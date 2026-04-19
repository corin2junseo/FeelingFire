"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, RotateCcw, Check, ImageIcon, Download } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AlbumCoverModalProps {
  open: boolean;
  musicId: string;
  musicPrompt: string;
  userCredits: number;
  onClose: () => void;
  onApply: (musicId: string, coverUrl: string) => void;
  onInsufficientCredits: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STYLE_PRESETS = [
  {
    id: "abstract",
    label: "Abstract",
    gradient: "from-purple-500 via-pink-500 to-orange-400",
    desc: "Vibrant shapes",
  },
  {
    id: "photorealistic",
    label: "Photo Real",
    gradient: "from-blue-700 via-blue-500 to-cyan-400",
    desc: "Cinematic photo",
  },
  {
    id: "anime",
    label: "Anime",
    gradient: "from-rose-400 via-fuchsia-400 to-orange-300",
    desc: "Illustrated style",
  },
  {
    id: "dark_fantasy",
    label: "Dark Fantasy",
    gradient: "from-slate-900 via-purple-900 to-slate-700",
    desc: "Mystical & epic",
  },
  {
    id: "minimalist",
    label: "Minimalist",
    gradient: "from-gray-600 via-gray-500 to-gray-400",
    desc: "Clean & simple",
  },
  {
    id: "neon_cyberpunk",
    label: "Neon Cyber",
    gradient: "from-pink-600 via-violet-600 to-cyan-500",
    desc: "Synthwave glow",
  },
] as const;

type StyleId = (typeof STYLE_PRESETS)[number]["id"];

const FORMATS = [
  { id: "square" as const, label: "Square", sub: "1:1 · Album Cover" },
  { id: "youtube" as const, label: "YouTube", sub: "16:9 · Thumbnail" },
];

type FormatId = "square" | "youtube";

// ── Component ─────────────────────────────────────────────────────────────────

export function AlbumCoverModal({
  open,
  musicId,
  musicPrompt,
  userCredits,
  onClose,
  onApply,
  onInsufficientCredits,
}: AlbumCoverModalProps) {
  const [selectedStyle, setSelectedStyle] = React.useState<StyleId>("abstract");
  const [selectedFormat, setSelectedFormat] = React.useState<FormatId>("square");
  const [prompt, setPrompt] = React.useState(musicPrompt);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generatedUrl, setGeneratedUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Reset state when modal opens with a new music
  React.useEffect(() => {
    if (open) {
      setPrompt(musicPrompt);
      setGeneratedUrl(null);
      setError(null);
      setIsGenerating(false);
    }
  }, [open, musicPrompt]);

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleGenerate = async () => {
    if (userCredits < 1) {
      onInsufficientCredits();
      return;
    }
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedUrl(null);

    try {
      const res = await fetch("/api/covers/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          musicId,
          prompt: prompt.trim(),
          style: selectedStyle,
          format: selectedFormat,
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
          onInsufficientCredits();
        } else {
          setError((data.error as string) ?? "Failed to generate cover");
        }
        return;
      }

      setGeneratedUrl(data.coverUrl as string);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!generatedUrl) return;
    onApply(musicId, generatedUrl);
    onClose();
  };

  const handleDownload = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `cover-${musicId}.webp`;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      // Fallback: open in new tab
      window.open(url, "_blank");
    }
  };

  const isSquare = selectedFormat === "square";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-lg bg-[#1A1A1E] border border-[#2E2E34] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#2E2E34]">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#9b87f5]" />
                  <h2 className="text-sm font-semibold text-white">Generate Album Cover</h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-[#2A2A2E] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1">
                <div className="px-5 py-4 flex flex-col gap-5">

                  {/* Style presets */}
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Style</p>
                    <div className="grid grid-cols-3 gap-2">
                      {STYLE_PRESETS.map((preset) => {
                        const active = selectedStyle === preset.id;
                        return (
                          <button
                            key={preset.id}
                            onClick={() => setSelectedStyle(preset.id)}
                            className={`relative rounded-xl overflow-hidden transition-all ${
                              active
                                ? "ring-2 ring-[#9b87f5] ring-offset-1 ring-offset-[#1A1A1E]"
                                : "ring-1 ring-[#333] hover:ring-[#555]"
                            }`}
                          >
                            {/* Gradient swatch */}
                            <div className={`h-12 bg-gradient-to-br ${preset.gradient}`} />
                            {/* Label */}
                            <div className="bg-[#1F2023] px-2 py-1.5">
                              <p className="text-xs font-medium text-white text-left leading-none">
                                {preset.label}
                              </p>
                              <p className="text-[10px] text-gray-500 text-left mt-0.5">
                                {preset.desc}
                              </p>
                            </div>
                            {/* Active check */}
                            {active && (
                              <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#9b87f5] flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Format selector */}
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Format</p>
                    <div className="flex gap-2">
                      {FORMATS.map((fmt) => {
                        const active = selectedFormat === fmt.id;
                        return (
                          <button
                            key={fmt.id}
                            onClick={() => setSelectedFormat(fmt.id)}
                            className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                              active
                                ? "border-[#9b87f5] bg-[#9b87f5]/10 text-white"
                                : "border-[#333] text-gray-400 hover:border-[#555] hover:text-gray-300"
                            }`}
                          >
                            {/* Shape indicator */}
                            <div
                              className={`rounded border-2 transition-colors ${
                                active ? "border-[#9b87f5]" : "border-gray-600"
                              } ${
                                fmt.id === "square"
                                  ? "w-6 h-6"
                                  : "w-9 h-6"
                              }`}
                            />
                            <div className="text-center">
                              <p className="text-xs font-medium leading-none">{fmt.label}</p>
                              <p className="text-[10px] text-gray-500 mt-0.5">{fmt.sub}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Prompt */}
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                      Describe the image
                    </p>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={3}
                      placeholder="e.g. dreamy forest at sunset, warm tones…"
                      className="w-full bg-[#111115] border border-[#2E2E34] rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:border-[#9b87f5]/60 resize-none transition-colors"
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <p className="text-xs text-red-400 bg-red-400/5 border border-red-400/10 rounded-lg px-3 py-2">
                      {error}
                    </p>
                  )}

                  {/* Generated preview */}
                  <AnimatePresence>
                    {generatedUrl && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.25 }}
                        className="flex flex-col items-center gap-3"
                      >
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider self-start">
                          Preview
                        </p>
                        <div
                          className={`overflow-hidden rounded-xl border border-[#333] ${
                            isSquare ? "w-48 h-48" : "w-full"
                          }`}
                          style={
                            !isSquare
                              ? { aspectRatio: "16/9" }
                              : undefined
                          }
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={generatedUrl}
                            alt="Generated album cover"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer actions */}
              <div className="px-5 py-4 border-t border-[#2E2E34] flex items-center gap-2">
                {/* Credit badge */}
                <div className="flex items-center gap-1 text-xs text-gray-500 mr-auto">
                  <Sparkles className="w-3.5 h-3.5 text-[#9b87f5]" />
                  <span>1 credit</span>
                  <span className="text-gray-600">·</span>
                  <span className={userCredits < 1 ? "text-red-400" : "text-gray-500"}>
                    {userCredits} remaining
                  </span>
                </div>

                {/* Regenerate + Download (shown after first generation) */}
                {generatedUrl && (
                  <>
                    <button
                      onClick={() => handleDownload(generatedUrl)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-300 border border-[#333] hover:border-[#555] hover:text-white transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Save
                    </button>
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-300 border border-[#333] hover:border-[#555] hover:text-white transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Retry
                    </button>
                  </>
                )}

                {/* Generate / Apply */}
                {generatedUrl ? (
                  <button
                    onClick={handleApply}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#9b87f5] hover:bg-[#8b77e5] text-white transition-colors active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Apply Cover
                  </button>
                ) : (
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim() || userCredits < 1}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#9b87f5] hover:bg-[#8b77e5] text-white transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Generating…
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Generate
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
