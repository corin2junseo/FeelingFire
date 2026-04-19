"use client";

import React from "react";

// ── Loading animation ──────────────────────────────────────────────────────────
function LoadingLines() {
  const letters = "Generating".split("");

  return (
    <div className="relative flex items-center justify-center h-[60px] w-auto font-semibold select-none text-white">
      {letters.map((letter, idx) => (
        <span
          key={idx}
          className="relative inline-block opacity-0 z-[2] text-[1rem] text-white"
          style={{
            animation: "letterAnim 4s linear infinite",
            animationDelay: `${0.1 + idx * 0.105}s`,
          }}
        >
          {letter}
        </span>
      ))}

      <div
        className="absolute top-0 left-0 w-full h-full z-[1]"
        style={{
          maskImage:
            "repeating-linear-gradient(90deg,transparent 0,transparent 6px,black 7px,black 8px)",
        }}
      >
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 50%,#ff0 0%,transparent 50%),radial-gradient(circle at 45% 45%,#f00 0%,transparent 45%),radial-gradient(circle at 55% 55%,#0ff 0%,transparent 45%),radial-gradient(circle at 45% 55%,#0f0 0%,transparent 45%),radial-gradient(circle at 55% 45%,#00f 0%,transparent 45%)",
            maskImage:
              "radial-gradient(circle at 50% 50%,transparent 0%,transparent 10%,black 25%)",
            animation:
              "transformAnim 2s infinite alternate cubic-bezier(0.6,0.8,0.5,1), opacityAnim 4s infinite",
          }}
        />
      </div>
    </div>
  );
}

// ── Error indicator ────────────────────────────────────────────────────────────
function ErrorIndicator() {
  return (
    <div className="flex items-center gap-2 text-red-400 text-sm select-none h-[60px] justify-center">
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M6.5 6.5L13.5 13.5M13.5 6.5L6.5 13.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <span>Generation failed</span>
    </div>
  );
}

// ── GenerationStatus (main export) ────────────────────────────────────────────
interface GenerationStatusProps {
  isGenerating: boolean;
  hasError: boolean;
}

export function GenerationStatus({ isGenerating, hasError }: GenerationStatusProps) {
  if (!isGenerating && !hasError) return null;

  return (
    <div className="w-full max-w-3xl mb-2">
      {isGenerating ? <LoadingLines /> : <ErrorIndicator />}
    </div>
  );
}
