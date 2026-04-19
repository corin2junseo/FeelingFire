"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WorkspaceNavbar } from "@/components/layout/WorkspaceNavbar";
import { PromptInputBox, type MusicOptions } from "@/components/music/PromptInputBox";
import { MusicList } from "@/components/music/MusicList";
import { MusicPlayer } from "@/components/music/MusicPlayer";
import { GenerationStatus } from "@/components/music/GenerationStatus";
import { CreditModal } from "@/components/credits/CreditModal";
import { AlbumCoverModal } from "@/components/music/AlbumCoverModal";
import { MusicDetailModal } from "@/components/music/MusicDetailModal";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresUpdatePayload } from "@supabase/supabase-js";
import type { Music } from "@/types/music";

const POLL_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 75; // 75 × 4s = 5 minutes

interface PollingItem {
  musicIds: string[];    // all music IDs belonging to this prediction
  predictionId: string;
  attempts: number;
}

function WorkspacePageContent() {
  const { user, loading, credits, refreshCredits } = useAuth();
  const { setPlaylist } = useMusicPlayer();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [musics, setMusics] = useState<Music[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(false);
  const [pollingItems, setPollingItems] = useState<PollingItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [coverModal, setCoverModal] = useState<{ musicId: string; musicPrompt: string } | null>(null);
  const [detailMusic, setDetailMusic] = useState<Music | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const pollingItemsRef = useRef<PollingItem[]>([]);
  const pollingActiveRef = useRef(false);
  // Stable ref so Realtime callback can call refreshCredits without stale closure
  const refreshCreditsRef = useRef(refreshCredits);

  useEffect(() => {
    pollingItemsRef.current = pollingItems;
    pollingActiveRef.current = pollingItems.length > 0;
  }, [pollingItems]);

  useEffect(() => {
    refreshCreditsRef.current = refreshCredits;
  }, [refreshCredits]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [user, loading, router]);

  // 결제 완료 후 복귀 시 크레딧 강제 갱신 (웹훅 처리 대기)
  useEffect(() => {
    if (!user || searchParams.get("payment") !== "success") return;
    const t1 = setTimeout(() => refreshCredits(), 1500);
    const t2 = setTimeout(() => refreshCredits(), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [user, searchParams]);

  // Sync completed musics to player playlist
  useEffect(() => {
    setPlaylist(musics);
  }, [musics, setPlaylist]);

  // Load existing music history from Supabase
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data } = await supabase
          .from("musics")
          .select("id, user_id, prompt, title, mood, genre, duration, file_path, file_url, cover_image_url, lyrics, status, error_message, created_at, updated_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (data) setMusics(data as Music[]);
      } finally {
        setIsLoadingHistory(false);
      }
    })();
  }, [user]);

  // Supabase Realtime: DB UPDATE → 즉시 UI 반영 (폴링 응답 처리 불필요)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`musics-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "musics",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: RealtimePostgresUpdatePayload<Music>) => {
          const updated = payload.new;

          // DB row 전체로 로컬 상태 갱신 (file_url 포함)
          setMusics((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
          );

          // 완료 또는 실패 시 해당 musicId를 pollingItems에서 제거
          if (updated.status === "completed" || updated.status === "failed") {
            setPollingItems((prev) =>
              prev
                .map((p) => ({
                  ...p,
                  musicIds: p.musicIds.filter((id) => id !== updated.id),
                }))
                .filter((p) => p.musicIds.length > 0)
            );

            // 실패(환불 발생) 시 크레딧 표시 즉시 갱신
            if (updated.status === "failed") {
              refreshCreditsRef.current();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Replicate 상태 확인 트리거 (fire-and-forget)
  // UI 갱신은 Supabase Realtime이 담당하므로 응답 처리 불필요.
  useEffect(() => {
    const interval = setInterval(() => {
      if (!pollingActiveRef.current) return;
      const current = pollingItemsRef.current;
      if (current.length === 0) return;

      const timedOut: PollingItem[] = [];
      const active: PollingItem[] = [];

      for (const item of current) {
        if (item.attempts >= MAX_POLL_ATTEMPTS) {
          timedOut.push(item);
        } else {
          active.push(item);
          // 서버에 Replicate 상태 확인 요청 (응답 불필요 — Realtime이 UI 처리)
          const musicIdsParam = item.musicIds.join(",");
          fetch(
            `/api/musics/poll?predictionId=${item.predictionId}&musicIds=${musicIdsParam}`
          ).catch(() => { });
        }
      }

      // 타임아웃 항목: 크레딧 환불 + 로컬 상태 실패 처리
      if (timedOut.length > 0) {
        const timedOutIds = timedOut.flatMap((i) => i.musicIds);
        fetch("/api/musics/refund", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ musicIds: timedOutIds }),
        }).catch(() => { });
        setMusics((prev) =>
          prev.map((m) =>
            timedOutIds.includes(m.id)
              ? { ...m, status: "failed", error_message: "Generation timed out" }
              : m
          )
        );
      }

      // 타임아웃 항목 제거 + 나머지 attempts 증가
      setPollingItems(
        active.map((item) => ({ ...item, attempts: item.attempts + 1 }))
      );
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      cover_image_url: null,
      lyrics: null,
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
      let data: Record<string, unknown> = {};
      try {
        data = await res.json();
      } catch {
        // empty or non-JSON response (e.g. server crash, missing env vars)
      }

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
                  error_message: (data.error as string) ?? "Generation failed",
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

  const handleRename = useCallback(async (id: string, newTitle: string) => {
    const { error } = await supabase
      .from("musics")
      .update({ title: newTitle })
      .eq("id", id)
      .eq("user_id", user!.id);
    if (!error) {
      setMusics((prev) =>
        prev.map((m) => (m.id === id ? { ...m, title: newTitle } : m))
      );
    }
  }, [user]);

  const handleOpenDetail = useCallback((music: Music) => {
    setDetailMusic(music);
  }, []);

  const handleGenerateCover = useCallback((musicId: string, musicPrompt: string) => {
    setCoverModal({ musicId, musicPrompt });
  }, []);

  const handleApplyCover = useCallback((musicId: string, coverUrl: string) => {
    setMusics((prev) =>
      prev.map((m) => (m.id === musicId ? { ...m, cover_image_url: coverUrl } : m))
    );
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await supabase.from("musics").delete().eq("id", id);
    setMusics((prev) => prev.filter((m) => m.id !== id));
    setPollingItems((prev) =>
      prev
        .map((p) => ({ ...p, musicIds: p.musicIds.filter((mid) => mid !== id) }))
        .filter((p) => p.musicIds.length > 0)
    );
  }, []);

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
          onGenerateCover={handleGenerateCover}
          onOpenDetail={handleOpenDetail}
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
        <MusicPlayer onOpenDetail={handleOpenDetail} />
      </div>

      {/* Music detail modal */}
      {detailMusic && (
        <MusicDetailModal
          music={detailMusic}
          onClose={() => setDetailMusic(null)}
        />
      )}

      {/* Credit modal — opens on insufficient credits */}
      <CreditModal open={creditModalOpen} onClose={() => setCreditModalOpen(false)} />

      {/* Album cover modal */}
      {coverModal && (
        <AlbumCoverModal
          open={true}
          musicId={coverModal.musicId}
          musicPrompt={coverModal.musicPrompt}
          userCredits={credits}
          onClose={() => setCoverModal(null)}
          onApply={handleApplyCover}
          onInsufficientCredits={() => {
            setCoverModal(null);
            setCreditModalOpen(true);
          }}
        />
      )}
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#171717]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    }>
      <WorkspacePageContent />
    </Suspense>
  );
}
