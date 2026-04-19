"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface Track {
    id: number;
    src: string;
    title: string;
    label: string;
}

interface ExampleSectionContent {
    sectionLabel?: string;
    headingLine1?: string;
    headingLine2?: string;
    subheading?: string;
    ctaText?: string;
}

const tracks: Track[] = [
    { id: 1, src: "/music/1.mp3", title: "Epic Journey", label: "MOOD · CINEMATIC" },
    { id: 2, src: "/music/2.mp3", title: "Chill Wave", label: "MOOD · AMBIENT" },
    { id: 3, src: "/music/3.mp3", title: "Fire Rising", label: "MOOD · UPBEAT" },
];

function generateWaveform(seed: number): number[] {
    return Array.from({ length: 30 }, (_, i) =>
        Math.max(12, Math.abs(Math.sin(i * 0.45 + seed * 1.8) * 65 + Math.cos(i * 0.75 + seed * 0.9) * 28))
    );
}

function formatTime(s: number): string {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
}

function MusicCard({
    track,
    index,
    currentlyPlaying,
    onPlay,
}: {
    track: Track;
    index: number;
    currentlyPlaying: number | null;
    onPlay: (id: number | null) => void;
}) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const bars = generateWaveform(index);
    const isPlaying = currentlyPlaying === track.id;

    useEffect(() => {
        if (!isPlaying && audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause();
        }
    }, [isPlaying]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            onPlay(null);
        } else {
            onPlay(track.id);
            audioRef.current.play();
        }
    };

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        setCurrentTime(audioRef.current.currentTime);
        if (audioRef.current.duration) {
            setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) setDuration(audioRef.current.duration);
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current || !audioRef.current.duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        audioRef.current.currentTime = pct * audioRef.current.duration;
    };

    const handleEnded = () => {
        onPlay(null);
        setProgress(0);
        setCurrentTime(0);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="group relative flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:border-white/20"
        >
            {/* Background track number decoration */}
            <span
                className="pointer-events-none absolute bottom-4 right-5 select-none text-8xl font-extrabold leading-none"
                style={{
                    fontFamily: "var(--font-pirata-one)",
                    color: "rgba(255,255,255,0.04)",
                }}
            >
                {String(track.id).padStart(2, "0")}
            </span>

            {/* Header row */}
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-xs font-bold tracking-widest text-foreground/50">
                        {track.label}
                    </p>
                    <h3
                        className="mt-1 truncate text-2xl font-extrabold text-foreground"
                        style={{ fontFamily: "var(--font-pirata-one)" }}
                    >
                        {track.title}
                    </h3>
                </div>

                {/* Play / Pause button */}
                <button
                    onClick={togglePlay}
                    aria-label={isPlaying ? "Pause" : "Play"}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 transition-all duration-200 hover:scale-105 hover:border-white/40 hover:bg-white/20"
                    style={isPlaying ? { background: "#ffffff", borderColor: "#ffffff" } : {}}
                >
                    {isPlaying ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <rect x="2" y="1" width="4" height="12" rx="1.5" fill="#000" />
                            <rect x="8" y="1" width="4" height="12" rx="1.5" fill="#000" />
                        </svg>
                    ) : (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M3 1.5L12.5 7L3 12.5V1.5Z" fill="#fff" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Waveform bars */}
            <div className="flex h-10 items-end gap-[2px]">
                {bars.map((height, i) => {
                    const filled = (i / bars.length) * 100 < progress;
                    return (
                        <motion.div
                            key={i}
                            className="flex-1 rounded-sm"
                            suppressHydrationWarning
                            animate={
                                isPlaying && filled
                                    ? { scaleY: [1, 1.15, 1], transition: { duration: 0.6, repeat: Infinity, delay: (i % 5) * 0.1 } }
                                    : { scaleY: 1 }
                            }
                            style={{
                                height: `${height}%`,
                                background: filled ? "#ffffff" : "rgba(255,255,255,0.15)",
                                transformOrigin: "bottom",
                            }}
                        />
                    );
                })}
            </div>

            {/* Progress bar + time */}
            <div className="flex flex-col gap-1.5">
                <div
                    className="h-[3px] w-full cursor-pointer rounded-full bg-white/10"
                    onClick={handleSeek}
                >
                    <div
                        className="h-full rounded-full transition-all duration-100 bg-white"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between text-[11px] text-foreground/40">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            <audio
                ref={audioRef}
                src={track.src}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
            />
        </motion.div>
    );
}

export function ExampleSection({ content }: { content?: ExampleSectionContent } = {}) {
    const sectionLabel = content?.sectionLabel ?? "EXAMPLE TRACKS";
    const headingLine1 = content?.headingLine1 ?? "Perfect Music";
    const headingLine2 = content?.headingLine2 ?? "For Your Videos";
    const subheading = content?.subheading ?? "Create the perfect soundtrack for your content.\nAI generates tracks matched to your mood instantly.";
    const ctaText = content?.ctaText ?? "Create Your Music →";

    const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);

    return (
        <section className="relative w-full overflow-hidden bg-background px-8 py-24 md:px-12">
            <div className="relative mx-auto max-w-5xl">
                {/* Section heading */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-16 text-center"
                >
                    <p className="mb-4 text-xs font-bold tracking-widest text-foreground/50">
                        {sectionLabel}
                    </p>
                    <h2
                        className="text-5xl font-extrabold leading-tight text-foreground md:text-6xl lg:text-7xl"
                        style={{ fontFamily: "var(--font-pirata-one)" }}
                    >
                        {headingLine1}
                        <br />
                        {headingLine2}
                    </h2>
                    <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-foreground/60 whitespace-pre-line">
                        {subheading}
                    </p>
                </motion.div>

                {/* Music cards */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    {tracks.map((track, i) => (
                        <MusicCard
                            key={track.id}
                            track={track}
                            index={i}
                            currentlyPlaying={currentlyPlaying}
                            onPlay={setCurrentlyPlaying}
                        />
                    ))}
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="mt-12 text-center"
                >
                    <a
                        href="/auth"
                        className="inline-block rounded-full bg-white px-8 py-3.5 text-sm font-bold text-black transition-all hover:scale-105 hover:bg-white/90"
                    >
                        {ctaText}
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
