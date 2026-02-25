"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Define the props interface for type safety and reusability
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

// Helper component for navigation links
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

// The main reusable Hero Section component
export const MinimalistHero = ({
    logoText,
    navLinks,
    mainText,
    ctaLink,
    ctaLabel = "Get Started",
    imageSrc,
    imageAlt,
    overlayText,
    className,
}: MinimalistHeroProps) => {
    return (
        <div
            className={cn(
                "relative flex h-screen w-full flex-col items-center justify-between overflow-hidden bg-background p-8 font-sans md:p-12",
                className
            )}
        >
            {/* Header */}
            <header className="z-30 flex w-full max-w-7xl items-center justify-between">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-xl font-bold tracking-wider"
                    style={{ fontFamily: "var(--font-comic-neue)" }}
                >
                    {logoText}
                </motion.div>
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
                <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col space-y-1.5 md:hidden"
                    aria-label="Open menu"
                >
                    <span className="block h-0.5 w-6 bg-foreground"></span>
                    <span className="block h-0.5 w-6 bg-foreground"></span>
                    <span className="block h-0.5 w-5 bg-foreground"></span>
                </motion.button>
            </header>

            {/* Main Content Area */}
            <div className="relative grid w-full max-w-7xl flex-grow grid-cols-1 items-center md:grid-cols-3">
                {/* Left Text Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1 }}
                    className="z-20 order-2 text-center md:order-1 md:text-left"
                >
                    <p className="mx-auto max-w-xs text-sm leading-relaxed text-foreground/80 md:mx-0">
                        {mainText}
                    </p>
                    <a
                        href={ctaLink}
                        className="mt-6 inline-block rounded-full bg-yellow-400 px-6 py-3 text-sm font-bold text-black transition-all hover:scale-105 hover:bg-yellow-300 hover:shadow-lg hover:shadow-yellow-400/30"
                    >
                        {ctaLabel} →
                    </a>
                </motion.div>

                {/* Center Image with Circle */}
                <div className="relative order-1 flex h-full items-center justify-center md:order-2">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                            duration: 0.8,
                            ease: [0.22, 1, 0.36, 1],
                            delay: 0.2,
                        }}
                        className="absolute z-0 h-[300px] w-[300px] rounded-full bg-yellow-400/90 md:h-[400px] md:w-[400px] lg:h-[500px] lg:w-[500px]"
                    ></motion.div>
                    <motion.img
                        src={imageSrc}
                        alt={imageAlt}
                        className="relative z-10 h-auto w-56 scale-150 object-cover md:w-64 lg:w-72"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 1,
                            ease: [0.22, 1, 0.36, 1],
                            delay: 0.4,
                        }}
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = `https://placehold.co/400x600/eab308/ffffff?text=Image+Not+Found`;
                        }}
                    />
                </div>

                {/* Right Text */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.2 }}
                    className="z-20 order-3 flex items-center justify-center text-center md:justify-start"
                >
                    <h1
                        className="text-7xl font-extrabold text-foreground md:text-8xl lg:text-9xl"
                        style={{ fontFamily: "var(--font-pirata-one)" }}
                    >
                        {overlayText.part1}
                        <br />
                        {overlayText.part2}
                    </h1>
                </motion.div>
            </div>
        </div>
    );
};
