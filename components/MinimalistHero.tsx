"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface MinimalistHeroProps {
    logoText: string;
    navLinks: { label: string; href: string }[];
    mainText: string;
    ctaLink: string;
    ctaLabel?: string;
    imageSrc: string;
    imageAlt: string;
    overlayText: {
        part1: string;
        part2: string;
    };
    className?: string;
}

const NavLink = ({
    href,
    children,
}: {
    href: string;
    children: React.ReactNode;
}) => (
    <a
        href={href}
        className="text-sm font-medium tracking-widest text-foreground/60 transition-colors hover:text-foreground"
    >
        {children}
    </a>
);

export const MinimalistHero = ({
    logoText,
    navLinks,
    ctaLink,
    ctaLabel = "Get Started",
    imageSrc,
    imageAlt,
    mainText,
    overlayText,
    className,
}: MinimalistHeroProps) => {
    return (
        <div
            className={cn(
                "relative flex min-h-screen w-full flex-col items-center overflow-hidden bg-background font-sans",
                className
            )}
        >
            {/* Header */}
            <header className="z-30 flex w-full max-w-7xl items-center justify-between px-6 py-6 md:px-12 md:py-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-xl font-bold tracking-wider"
                    style={{ fontFamily: "var(--font-comic-neue)" }}
                >
                    {logoText}
                </motion.div>

                {/* Desktop nav */}
                <div className="hidden items-center space-x-8 md:flex">
                    {navLinks.map((link) => (
                        <NavLink key={link.label} href={link.href}>
                            {link.label}
                        </NavLink>
                    ))}
                    <motion.a
                        href={ctaLink}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition-all hover:scale-105 hover:opacity-90"
                    >
                        {ctaLabel}
                    </motion.a>
                </div>

                {/* Mobile CTA (replaces hamburger with direct action) */}
                <motion.a
                    href={ctaLink}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-bold tracking-widest text-foreground/80 transition-all hover:border-white/40 md:hidden"
                >
                    {ctaLabel}
                </motion.a>
            </header>

            {/* Main Content */}
            <div className="relative flex w-full max-w-7xl flex-1 flex-col items-center px-6 pb-10 md:grid md:grid-cols-3 md:items-center md:px-12 md:pb-0">

                {/* MOBILE: Heading at top — DESKTOP: Right column */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="z-20 order-1 w-full pt-6 text-center md:order-3 md:flex md:items-center md:justify-start md:pt-0 md:text-left"
                >
                    <h1
                        className="text-[3.2rem] font-extrabold leading-[1.05] text-foreground sm:text-6xl md:text-7xl lg:text-9xl"
                        style={{ fontFamily: "var(--font-pirata-one)" }}
                    >
                        {overlayText.part1}
                        <br />
                        {overlayText.part2}
                    </h1>
                </motion.div>

                {/* Center Image */}
                <div className="relative order-2 flex w-full items-center justify-center py-6 md:h-full md:py-0">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                        className="absolute z-0 h-[200px] w-[200px] rounded-full bg-white/[0.05] sm:h-[260px] sm:w-[260px] md:h-[400px] md:w-[400px] lg:h-[500px] lg:w-[500px]"
                    />
                    <motion.img
                        src={imageSrc}
                        alt={imageAlt}
                        className="relative z-10 h-auto w-40 object-cover sm:w-52 md:w-64 md:scale-150 lg:w-72"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = `https://placehold.co/400x600/1a1a1a/ffffff?text=Image+Not+Found`;
                        }}
                    />
                </div>

                {/* MOBILE: Description + CTA at bottom — DESKTOP: Left column */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="z-20 order-3 w-full text-center md:order-1 md:text-left"
                >
                    <p className="mx-auto max-w-xs text-sm leading-relaxed text-foreground/70 md:mx-0">
                        {mainText}
                    </p>
                    <a
                        href={ctaLink}
                        className="mt-6 inline-block rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition-all hover:scale-105 hover:bg-white/90"
                    >
                        {ctaLabel} →
                    </a>
                </motion.div>
            </div>
        </div>
    );
};
