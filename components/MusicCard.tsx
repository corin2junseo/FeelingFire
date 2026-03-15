"use client";

import React from "react";
import { Music } from "@/lib/types/musics";
import {
  Play,
  Pause,
  Download,
  AlertCircle,
  Music2,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

interface MusicCardProps {
  music: Music;
  onRename?: (id: string, newTitle: string) => void;
  onDelete?: (id: string) => void;
}

export function MusicCard({ music, onRename, onDelete }: MusicCardProps) {
  const { currentTrack, isPlaying, playTrack } = useMusicPlayer();

  const [menuOpen, setMenuOpen] = React.useState(false);
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState(
    music.title || music.prompt
  );
  const menuRef = React.useRef<HTMLDivElement>(null);
  const renameInputRef = React.useRef<HTMLInputElement>(null);

  const isActive = currentTrack?.id === music.id;
  const isThisPlaying = isActive && isPlaying;

  const waveformHeights = React.useMemo(
    () => Array.from({ length: 40 }, () => 20 + Math.random() * 80),
    []
  );

  // Close menu on outside click
  React.useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Focus rename input when renaming starts
  React.useEffect(() => {
    if (isRenaming) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [isRenaming]);

  // Keep rename value in sync when title changes externally
  React.useEffect(() => {
    if (!isRenaming) {
      setRenameValue(music.title || music.prompt);
    }
  }, [music.title, music.prompt, isRenaming]);

  const handlePlay = () => {
    if (music.status !== "completed" || !music.file_url) return;
    playTrack(music);
  };

  const handleDownload = () => {
    if (!music.file_url) return;
    const a = document.createElement("a");
    a.href = music.file_url;
    a.download = `${(music.title || music.prompt).slice(0, 30)}.mp3`;
    a.click();
  };

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== (music.title || music.prompt)) {
      onRename?.(music.id, trimmed);
    }
    setIsRenaming(false);
  };

  const displayText = music.title || music.prompt;
  const displayShort =
    displayText.length > 80 ? displayText.slice(0, 80) + "…" : displayText;

  const timeAgo = (() => {
    const diff = Date.now() - new Date(music.created_at).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`bg-[#1F2023] border rounded-2xl p-4 flex flex-col gap-3 transition-colors ${
        isActive ? "border-[#9b87f5]/40" : "border-[#333333]"
      }`}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
            isActive ? "bg-[#9b87f5]/20" : "bg-[#2A2A2E]"
          }`}
        >
          <Music2 className="w-5 h-5 text-[#9b87f5]" />
        </div>

        {/* Title / inline rename */}
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <input
              ref={renameInputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit();
                if (e.key === "Escape") setIsRenaming(false);
              }}
              onBlur={handleRenameSubmit}
              className="w-full bg-[#2A2A2E] text-sm text-gray-200 rounded-lg px-2 py-1 outline-none border border-[#9b87f5]/40 focus:border-[#9b87f5]"
            />
          ) : (
            <p className="text-sm text-gray-200 leading-snug">{displayShort}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
        </div>

        {/* Status badge + three-dot menu */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {music.status === "generating" && (
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Generating
            </span>
          )}
          {music.status === "failed" && (
            <span className="inline-flex items-center gap-1.5 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-full px-2.5 py-1">
              <AlertCircle className="w-3 h-3" />
              Failed
            </span>
          )}
          {music.status === "completed" && (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Ready
            </span>
          )}

          {/* Three-dot menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-300 hover:bg-[#333] transition-colors"
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-8 z-50 min-w-[140px] bg-[#2A2A2E] border border-[#444] rounded-xl shadow-xl overflow-hidden"
                >
                  {/* Rename */}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setRenameValue(music.title || music.prompt);
                      setIsRenaming(true);
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-gray-300 hover:bg-[#333] hover:text-white transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Rename
                  </button>

                  {/* Download (only if completed) */}
                  {music.status === "completed" && music.file_url && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleDownload();
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-gray-300 hover:bg-[#333] hover:text-white transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  )}

                  {/* Divider */}
                  <div className="h-px bg-[#333] mx-2" />

                  {/* Delete */}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete?.(music.id);
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Generating skeleton bars */}
      {music.status === "generating" && (
        <div className="flex items-end gap-0.5 h-8 px-1">
          {waveformHeights.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-full bg-[#9b87f5]/30 animate-pulse"
              style={{
                height: `${h}%`,
                animationDelay: `${(i * 0.06) % 1}s`,
                animationDuration: `${0.8 + (i % 4) * 0.2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Error message */}
      {music.status === "failed" && music.error_message && (
        <p className="text-xs text-red-400/80 bg-red-400/5 border border-red-400/10 rounded-lg px-3 py-2">
          {music.error_message}
        </p>
      )}

      {/* Completed: play + download */}
      {music.status === "completed" && music.file_url && (
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlay}
            className="flex-shrink-0 w-9 h-9 rounded-full bg-white flex items-center justify-center hover:bg-white/80 active:scale-95 transition-all"
            aria-label={isThisPlaying ? "Pause" : "Play"}
          >
            {isThisPlaying ? (
              <Pause className="w-4 h-4 text-[#1F2023] fill-[#1F2023]" />
            ) : (
              <Play className="w-4 h-4 text-[#1F2023] fill-[#1F2023] ml-0.5" />
            )}
          </button>

          {/* Playing indicator */}
          {isActive && (
            <div className="flex items-end gap-0.5 h-5">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 rounded-full bg-[#9b87f5]"
                  animate={
                    isThisPlaying
                      ? { height: ["40%", "100%", "40%"] }
                      : { height: "40%" }
                  }
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }}
                  style={{ height: "40%" }}
                />
              ))}
            </div>
          )}

          <div className="flex-1" />

          <button
            onClick={handleDownload}
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#333] transition-colors"
            aria-label="Download"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
