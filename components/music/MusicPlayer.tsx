"use client";

import React from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music2,
  Download,
  ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

interface MusicPlayerProps {
  onOpenDetail?: (music: import("@/types/music").Music) => void;
}

export function MusicPlayer({ onOpenDetail }: MusicPlayerProps = {}) {
  const {
    currentTrack,
    isPlaying,
    progress,
    currentTime,
    duration,
    volume,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
  } = useMusicPlayer();

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    seek((e.clientX - rect.left) / rect.width);
  };

  const handleDownload = () => {
    if (!currentTrack?.file_url) return;
    const a = document.createElement("a");
    a.href = currentTrack.file_url;
    a.download = `${currentTrack.prompt.slice(0, 30)}.mp3`;
    a.click();
  };

  const handleDownloadCover = async () => {
    if (!currentTrack?.cover_image_url) return;
    try {
      const res = await fetch(currentTrack.cover_image_url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${currentTrack.prompt.slice(0, 30)}-cover.webp`;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(currentTrack.cover_image_url, "_blank");
    }
  };

  const trackTitle = currentTrack
    ? currentTrack.prompt.length > 45
      ? currentTrack.prompt.slice(0, 45) + "…"
      : currentTrack.prompt
    : "";

  const mobileTitle = currentTrack
    ? currentTrack.prompt.length > 25
      ? currentTrack.prompt.slice(0, 25) + "…"
      : currentTrack.prompt
    : "";

  return (
    <AnimatePresence>
      {currentTrack && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 72 }}
          exit={{ height: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 300 }}
          className="w-full overflow-hidden bg-[#121212] border-t border-white/10"
        >
          {/* ── MOBILE layout (< md) ── */}
          <div className="relative flex md:hidden h-[72px] items-center px-4 gap-3">
            {/* Track info — click to open detail */}
            <button
              className="flex items-center gap-2 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
              onClick={() => onOpenDetail?.(currentTrack)}
              aria-label="View track details"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-md overflow-hidden bg-[#2A2A2E] flex items-center justify-center">
                {currentTrack.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentTrack.cover_image_url} alt="Album cover" className="w-full h-full object-cover" />
                ) : (
                  <Music2 className="w-4 h-4 text-[#9b87f5]" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-white font-medium truncate leading-tight">
                  {mobileTitle}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">Feelingfire</p>
              </div>
            </button>

            {/* Compact controls */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={prev}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Previous"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-black fill-black" />
                ) : (
                  <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                )}
              </button>

              <button
                onClick={next}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Next"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={handleDownload}
                className="text-gray-500 hover:text-white transition-colors"
                aria-label="Download audio"
              >
                <Download className="w-4 h-4" />
              </button>

              {currentTrack.cover_image_url && (
                <button
                  onClick={handleDownloadCover}
                  className="text-gray-500 hover:text-white transition-colors"
                  aria-label="Download cover"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Progress strip — bottom of mobile row */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#2a2a2a] cursor-pointer"
              onClick={handleProgressClick}
            >
              <div
                className="h-full bg-[#9b87f5]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* ── DESKTOP layout (≥ md) ── */}
          <div className="hidden md:flex h-[72px] items-center px-4 gap-4">
            {/* Left — track info — click to open detail */}
            <button
              className="flex items-center gap-3 w-[28%] min-w-0 text-left hover:opacity-80 transition-opacity"
              onClick={() => onOpenDetail?.(currentTrack)}
              aria-label="View track details"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-[#2A2A2E] flex items-center justify-center">
                {currentTrack.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentTrack.cover_image_url} alt="Album cover" className="w-full h-full object-cover" />
                ) : (
                  <Music2 className="w-5 h-5 text-[#9b87f5]" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-white font-medium truncate leading-tight">
                  {trackTitle}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Feelingfire</p>
              </div>
            </button>

            {/* Center — controls + progress */}
            <div className="flex-1 flex flex-col items-center justify-center gap-1.5">
              <div className="flex items-center gap-5">
                <button
                  onClick={prev}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Previous"
                >
                  <SkipBack className="w-[18px] h-[18px]" />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 text-black fill-black" />
                  ) : (
                    <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                  )}
                </button>

                <button
                  onClick={next}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Next"
                >
                  <SkipForward className="w-[18px] h-[18px]" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="w-full flex items-center gap-2 max-w-md">
                <span className="text-[10px] text-gray-500 w-7 text-right tabular-nums">
                  {formatTime(currentTime)}
                </span>
                <div
                  className="flex-1 h-1 bg-[#333] rounded-full cursor-pointer group relative"
                  onClick={handleProgressClick}
                >
                  <div
                    className="h-full bg-[#9b87f5] rounded-full relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity -mr-1.5" />
                  </div>
                </div>
                <span className="text-[10px] text-gray-500 w-7 tabular-nums">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Right — volume + download */}
            <div className="flex items-center gap-3 w-[28%] justify-end">
              {currentTrack.cover_image_url && (
                <button
                  onClick={handleDownloadCover}
                  className="text-gray-500 hover:text-white transition-colors"
                  aria-label="Download cover"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={handleDownload}
                className="text-gray-500 hover:text-white transition-colors"
                aria-label="Download audio"
              >
                <Download className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVolume(volume === 0 ? 1 : 0)}
                  className="text-gray-500 hover:text-white transition-colors"
                  aria-label="Toggle mute"
                >
                  {volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-20 h-1 cursor-pointer accent-[#9b87f5]"
                  aria-label="Volume"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
