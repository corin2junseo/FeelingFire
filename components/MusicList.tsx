"use client";

import { Music2 } from "lucide-react";
import { MusicCard } from "@/components/MusicCard";
import type { Music } from "@/lib/types/musics";

interface MusicListProps {
  musics: Music[];
  isLoading: boolean;
  onRename?: (id: string, newTitle: string) => void;
  onDelete?: (id: string) => void;
}

export function MusicList({ musics, isLoading, onRename, onDelete }: MusicListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 mt-32">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        <p className="text-gray-500 text-sm">Loading your music…</p>
      </div>
    );
  }

  if (musics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 mt-32 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#1F2023] border border-[#333] flex items-center justify-center">
          <Music2 className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <p className="text-gray-400 text-sm font-medium">No music yet</p>
          <p className="text-gray-600 text-xs mt-1">
            Describe the music you want and hit send
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl flex flex-col gap-3">
      {musics.map((music) => (
        <MusicCard
          key={music.id}
          music={music}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
