"use client";

import React from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

const Silk = dynamic(() => import("@/components/Silk"), { ssr: false });

export function CTASection() {
    return (
        <section className="relative w-full overflow-hidden" style={{ minHeight: "480px" }}>
            {/* Silk shader — full-bleed background */}
            <div className="absolute inset-0 z-0">
                <Silk
                    color="#111111"
                    speed={3}
                    scale={1.2}
                    noiseIntensity={1.8}
                    rotation={0.3}
                />
            </div>

            {/* Dark overlay to keep text readable */}
            <div className="absolute inset-0 z-10 bg-black/50" />

            {/* Subtle white glow */}
            <div
                className="pointer-events-none absolute inset-0 z-10"
                style={{
                    backgroundImage: `radial-gradient(ellipse 60% 50% at 50% 100%, rgba(255,255,255,0.04) 0%, transparent 70%)`,
                }}
            />

            {/* Content */}
            <div className="relative z-20 flex min-h-[480px] flex-col items-center justify-center px-8 py-24 text-center md:px-12">
                <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-4 text-xs font-bold tracking-widest text-foreground/50"
                >
                    GET STARTED
                </motion.p>

                <motion.h2
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                    className="text-5xl font-extrabold leading-tight text-foreground md:text-6xl lg:text-7xl"
                    style={{ fontFamily: "var(--font-pirata-one)" }}
                >
                    Start Creating
                    <br />
                    Your Music
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-foreground/60"
                >
                    No subscription, no commitment. Top up credits and
                    <br />
                    generate YouTube-ready music in seconds.
                </motion.p>

                <motion.a
                    href="/auth"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ scale: 1.05 }}
                    className="mt-10 inline-block rounded-full bg-white px-10 py-4 text-sm font-bold tracking-widest text-black transition-opacity hover:bg-white/90"
                >
                    Start for Free →
                </motion.a>
            </div>
        </section>
    );
}
