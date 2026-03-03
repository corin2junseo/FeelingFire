"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { WorkspaceNavbar } from "@/components/WorkspaceNavbar";
import { PromptInputBox, type MusicOptions } from "@/components/PromptInputBox";
import { MusicList } from "@/components/MusicList";
import { MusicPlayer } from "@/components/MusicPlayer";
import { GenerationStatus } from "@/components/GenerationStatus";
import { CreditModal } from "@/components/CreditModal";
import { createClient } from "@/lib/supabase/client";
import type { Music } from "@/lib/types/musics";

const POLL_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 75; // 75 × 4s = 5 minutes

interface PollingItem {
  musicIds: string[];    // all music IDs belonging to this prediction
  predictionId: string;
  attempts: number;
}

export default function WorkspacePage() {
  const { user, loading, credits, refreshCredits } = useAuth();
  const { setPlaylist } = useMusicPlayer();
  const router = useRouter();

  const [musics, setMusics] = useState<Music[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(false);
  const [pollingItems, setPollingItems] = useState<PollingItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const pollingItemsRef = useRef<PollingItem[]>([]);

  useEffect(() => {
    pollingItemsRef.current = pollingItems;
  }, [pollingItems]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [user, loading, router]);

  // Sync completed musics to player playlist
  useEffect(() => {
    setPlaylist(musics);
  }, [musics, setPlaylist]);

  // Load existing music history from Supabase
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    (async () => {
      try {
        const { data } = await supabase
          .from("musics")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (data) setMusics(data as Music[]);
      } finally {
        setIsLoadingHistory(false);
      }
    })();
  }, [user]);

  // Poll Replicate status every POLL_INTERVAL_MS
  useEffect(() => {
    if (pollingItems.length === 0) return;

    const interval = setInterval(async () => {
      const current = pollingItemsRef.current;
      if (current.length === 0) return;

      const results = await Promise.all(
        current.map(async (item) => {
          if (item.attempts >= MAX_POLL_ATTEMPTS) {
            return { ...item, status: "failed", error: "Generation timed out" };
          }
          try {
            const musicIdsParam = item.musicIds.join(",");
            const res = await fetch(
              `/api/musics/poll?predictionId=${item.predictionId}&musicIds=${musicIdsParam}`
            );
            const data = await res.json();
            return { ...item, attempts: item.attempts + 1, ...data };
          } catch {
            return { ...item, attempts: item.attempts + 1, status: "processing" };
          }
        })
      );

      const done = results.filter(
        (r) => r.status === "completed" || r.status === "failed"
      );
      const stillPending = results.filter(
        (r) => r.status !== "completed" && r.status !== "failed"
      );

      if (done.length > 0) {
        setMusics((prev) =>
          prev.map((m) => {
            for (const result of done) {
              if (result.status === "completed") {
                const match = (
                  result.items as { musicId: string; fileUrl: string | null }[]
                )?.find((it) => it.musicId === m.id);
                if (match) return { ...m, status: "completed", file_url: match.fileUrl };
              } else if (result.status === "failed") {
                if ((result.musicIds as string[])?.includes(m.id)) {
                  return {
                    ...m,
                    status: "failed",
                    error_message: result.error ?? "Generation failed",
                  };
                }
              }
            }
            return m;
          })
        );
      }

      setPollingItems(
        stillPending.map((r) => ({
          musicIds: r.musicIds,
          predictionId: r.predictionId,
          attempts: r.attempts,
        }))
      );
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [pollingItems]);

  const handleSend = async (caption: string, options: MusicOptions) => {
    const { lyrics, duration, batchSize } = options;
    if (!caption.trim() || isGenerating) return;
    setIsGenerating(true);
    setGenerationError(false);

    const now = new Date().toISOString();
    const tempIds = Array.from(
      { length: batchSize },
      (_, i) => `temp-${Date.now()}-${i}`
    );

    // Optimistic placeholders
    const placeholders: Music[] = tempIds.map((id) => ({
      id,
      user_id: user!.id,
      prompt: caption.trim(),
      title: null,
      mood: null,
      genre: null,
      duration: null,
      file_path: null,
      file_url: null,
      status: "generating",
      error_message: null,
      created_at: now,
      updated_at: now,
    }));
    setMusics((prev) => [...placeholders, ...prev]);

    try {
      const res = await fetch("/api/musics/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: caption.trim(),
          lyrics: lyrics || undefined,
          duration,
          batch_size: batchSize,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          // Remove optimistic placeholders and open credit modal
          setMusics((prev) => prev.filter((m) => !tempIds.includes(m.id)));
          setCreditModalOpen(true);
        } else {
          setGenerationError(true);
          setMusics((prev) =>
            prev.map((m) =>
              tempIds.includes(m.id)
                ? {
                    ...m,
                    status: "failed",
                    error_message: data.error ?? "Generation failed",
                  }
                : m
            )
          );
        }
      } else {
        const { predictionId, items } = data as {
          predictionId: string;
          items: { musicId: string }[];
        };

        // Replace each placeholder with its real DB id (order preserved)
        setMusics((prev) => {
          let updated = [...prev];
          items.forEach((item, i) => {
            const tempId = tempIds[i];
            if (tempId) {
              updated = updated.map((m) =>
                m.id === tempId ? { ...m, id: item.musicId } : m
              );
            }
          });
          // Safety net for any unmatched placeholders
          return updated.map((m) =>
            tempIds.includes(m.id)
              ? { ...m, status: "failed" as const, error_message: "Generation failed" }
              : m
          );
        });

        const realMusicIds = items.map((it) => it.musicId);
        setPollingItems((prev) => [
          ...prev,
          { musicIds: realMusicIds, predictionId, attempts: 0 },
        ]);
      }
    } catch (err) {
      setGenerationError(true);
      setMusics((prev) =>
        prev.map((m) =>
          tempIds.includes(m.id)
            ? { ...m, status: "failed", error_message: String(err) }
            : m
        )
      );
    } finally {
      setIsGenerating(false);
      await refreshCredits();
    }
  };

  const handleRename = async (id: string, newTitle: string) => {
    const supabase = createClient();
    await supabase.from("musics").update({ title: newTitle }).eq("id", id);
    setMusics((prev) =>
      prev.map((m) => (m.id === id ? { ...m, title: newTitle } : m))
    );
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from("musics").delete().eq("id", id);
    setMusics((prev) => prev.filter((m) => m.id !== id));
    setPollingItems((prev) =>
      prev
        .map((p) => ({ ...p, musicIds: p.musicIds.filter((mid) => mid !== id) }))
        .filter((p) => p.musicIds.length > 0)
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#171717]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#171717]">
      <WorkspaceNavbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="pt-28 pb-64 px-4 flex flex-col items-center md:pt-20">
        <GenerationStatus
          isGenerating={isGenerating || pollingItems.length > 0}
          hasError={generationError}
        />
        <MusicList
          musics={
            searchQuery.trim()
              ? musics.filter((m) =>
                  (m.title ?? m.prompt)
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
                )
              : musics
          }
          isLoading={isLoadingHistory}
          onRename={handleRename}
          onDelete={handleDelete}
          searchQuery={searchQuery}
        />
      </main>

      {/* Fixed bottom bar: PromptInput + MusicPlayer stacked */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        {/* Prompt input */}
        <div
          className="flex justify-center px-4 pb-4 pt-5"
          style={{
            background:
              "linear-gradient(to top, #171717 70%, transparent)",
          }}
        >
          <div className="w-full max-w-3xl">
            <PromptInputBox
              onSend={handleSend}
              isLoading={isGenerating}
              placeholder="Describe the music style, mood, genre…"
              userCredits={credits}
              onInsufficientCredits={() => setCreditModalOpen(true)}
            />
          </div>
        </div>

        {/* Music player — slides in right below prompt when a track is active */}
        <MusicPlayer />
      </div>

      {/* Credit modal — opens on insufficient credits */}
      <CreditModal open={creditModalOpen} onClose={() => setCreditModalOpen(false)} />
    </div>
  );
}
