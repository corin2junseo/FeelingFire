"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

interface FeatureCard {
    id: number;
    image: string;
    tag: string;
    title: string;
    description: string;
}

const features: FeatureCard[] = [
    {
        id: 1,
        image: "/image/1.jpg",
        tag: "COPYRIGHT FREE",
        title: "No More Copyright Worries",
        description:
            "Use it in monetized videos without a second thought. Every track on Feelingfire is fully royalty-free.",
    },
    {
        id: 2,
        image: "/image/2.jpg",
        tag: "NO MORE DOWNLOADS",
        title: "Stop Hunting for MP3s",
        description:
            "No more wasting time on sketchy download sites. Create exactly the music you need, instantly.",
    },
    {
        id: 3,
        image: "/image/3.jpg",
        tag: "PERSONALIZED",
        title: "Generated Your Way",
        description:
            "Set the mood, genre, and tempo yourself. AI crafts a track tailored perfectly to your video.",
    },
    {
        id: 4,
        image: "/image/4.jpg",
        tag: "INSTANT",
        title: "Done in Seconds",
        description:
            "No long wait times. Enter your prompt and high-quality music is ready before you know it.",
    },
    {
        id: 5,
        image: "/image/5.jpg",
        tag: "ANY MOOD · ANY GENRE",
        title: "No Genre Limits",
        description:
            "From lo-fi to orchestral — whatever the vibe of your video, the right sound is a prompt away.",
    },
    {
        id: 6,
        image: "/image/6.jpg",
        tag: "COMMERCIAL USE",
        title: "Commercial Use Included",
        description:
            "Ads, brand videos, YouTube monetization — use freely for any commercial purpose.",
    },
];

export function FeaturesSection() {
    return (
        <section
            id="features"
            className="relative w-full overflow-hidden bg-background px-8 py-24 md:px-12"
        >
            <div className="relative mx-auto max-w-6xl">
                {/* Section heading */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-16 text-center"
                >
                    <p className="mb-4 text-xs font-bold tracking-widest text-foreground/50">
                        FEATURES
                    </p>
                    <h2
                        className="text-5xl font-extrabold leading-tight text-foreground md:text-6xl lg:text-7xl"
                        style={{ fontFamily: "var(--font-pirata-one)" }}
                    >
                        Everything You
                        <br />
                        Need
                    </h2>
                    <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-foreground/60">
                        Copyright stress, sketchy downloads, mismatched tracks —
                        all the problems creators face, solved in one place.
                    </p>
                </motion.div>

                {/* Feature cards grid */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, i) => (
                        <motion.div
                            key={feature.id}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{
                                duration: 0.7,
                                delay: i * 0.1,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08]"
                        >
                            {/* Image area */}
                            <div className="relative h-48 w-full overflow-hidden">
                                <Image
                                    src={feature.image}
                                    alt={feature.title}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                />
                                {/* Dark gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />

                                {/* Tag badge */}
                                <div className="absolute left-4 top-4">
                                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold tracking-widest text-foreground/70">
                                        {feature.tag}
                                    </span>
                                </div>

                                {/* Large background number */}
                                <span
                                    className="pointer-events-none absolute bottom-2 right-4 select-none text-7xl font-extrabold leading-none"
                                    style={{
                                        fontFamily: "var(--font-pirata-one)",
                                        color: "rgba(255,255,255,0.05)",
                                    }}
                                >
                                    {String(feature.id).padStart(2, "0")}
                                </span>
                            </div>

                            {/* Text content */}
                            <div className="flex flex-col gap-2 p-6 pt-4">
                                <h3
                                    className="text-xl font-extrabold text-foreground"
                                    style={{ fontFamily: "var(--font-pirata-one)" }}
                                >
                                    {feature.title}
                                </h3>
                                <p className="text-sm leading-relaxed text-foreground/60">
                                    {feature.description}
                                </p>

                                {/* Bottom accent line */}
                                <div
                                    className="mt-3 h-px w-8 transition-all duration-300 group-hover:w-full"
                                    style={{ background: "rgba(255,255,255,0.25)" }}
                                />
                            </div>
                        </motion.div>
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
                        Start for Free →
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
