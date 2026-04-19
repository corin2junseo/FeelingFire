"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Play,
  Pause,
  Download,
  ImageIcon,
  Music2,
  FileText,
} from "lucide-react";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import type { Music } from "@/types/music";

interface MusicDetailModalProps {
  music: Music;
  onClose: () => void;
}

export function MusicDetailModal({ music, onClose }: MusicDetailModalProps) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = useMusicPlayer();

  const isActive = currentTrack?.id === music.id;
  const isThisPlaying = isActive && isPlaying;

  // Close on Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handlePlay = () => {
    if (music.status !== "completed" || !music.file_url) return;
    if (isActive) {
      togglePlay();
    } else {
      playTrack(music);
    }
  };

  const handleDownloadAudio = () => {
    if (!music.file_url) return;
    const a = document.createElement("a");
    a.href = music.file_url;
    a.download = `${(music.title || music.prompt).slice(0, 30)}.mp3`;
    a.click();
  };

  const handleDownloadCover = async () => {
    if (!music.cover_image_url) return;
    try {
      const res = await fetch(music.cover_image_url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${(music.title || music.prompt).slice(0, 30)}-cover.webp`;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(music.cover_image_url, "_blank");
    }
  };

  const timeAgo = (() => {
    const diff = Date.now() - new Date(music.created_at).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  })();

  const title = music.title || music.prompt;

  return (
    <AnimatePresence>
      <motion.div
        key="detail-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        key="detail-panel"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-2xl bg-[#1A1A1E] border border-[#2E2E34] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#2E2E34] flex-shrink-0">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Now Playing</p>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-[#2A2A2E] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-col md:flex-row overflow-hidden flex-1 min-h-0">

            {/* ── Left: Album cover ── */}
            <div className="flex-shrink-0 p-5 flex items-start justify-center md:justify-start">
              <div className="w-52 h-52 md:w-56 md:h-56 rounded-2xl overflow-hidden bg-[#111115] border border-[#2E2E34] flex items-center justify-center">
                {music.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={music.cover_image_url}
                    alt="Album cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-gray-700">
                    <Music2 className="w-12 h-12" />
                    <p className="text-xs">No cover</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Right: Info + Lyrics ── */}
            <div className="flex-1 flex flex-col min-h-0 px-5 pb-5 md:pt-5 md:pl-0 overflow-hidden">

              {/* Track title + meta */}
              <div className="flex-shrink-0 mb-4">
                <h2 className="text-base font-semibold text-white leading-snug line-clamp-2">
                  {title}
                </h2>
                <p className="text-xs text-gray-500 mt-1">Feelingfire · {timeAgo}</p>
              </div>

              {/* Lyrics */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                {music.lyrics ? (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <FileText className="w-3.5 h-3.5 text-[#9b87f5]" />
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Lyrics</p>
                    </div>
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                      {music.lyrics}
                    </pre>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-8">
                    <FileText className="w-8 h-8 text-gray-700" />
                    <p className="text-sm text-gray-600">No lyrics</p>
                    <p className="text-xs text-gray-700">Add lyrics when generating music</p>
                  </div>
                )}
              </div>

              {/* Controls */}
              {music.status === "completed" && (
                <div className="flex-shrink-0 flex items-center gap-2 mt-4 pt-4 border-t border-[#2E2E34]">
                  <button
                    onClick={handlePlay}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-white/80 active:scale-95 transition-all text-xs font-semibold text-black"
                  >
                    {isThisPlaying ? (
                      <><Pause className="w-3.5 h-3.5 fill-black" />Pause</>
                    ) : (
                      <><Play className="w-3.5 h-3.5 fill-black ml-0.5" />Play</>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadAudio}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-[#333] text-xs font-medium text-gray-300 hover:border-[#555] hover:text-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Audio
                  </button>

                  {music.cover_image_url && (
                    <button
                      onClick={handleDownloadCover}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-[#333] text-xs font-medium text-gray-300 hover:border-[#555] hover:text-white transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      Cover
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
