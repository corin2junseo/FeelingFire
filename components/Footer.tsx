"use client";

import React from "react";
import { motion } from "framer-motion";

const ACCENT = "#FECD00";

const socialLinks = [
    {
        label: "X",
        href: "https://x.com",
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
    },
    {
        label: "Threads",
        href: "https://threads.net",
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.851 1.205 8.604.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.29a13.495 13.495 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.36-.887h-.036c-.813 0-1.875.199-2.565 1.288l-1.706-1.117c.87-1.407 2.275-2.187 3.963-2.215h.043c3.051 0 4.868 1.882 4.959 5.03.023.082.055.159.082.241.346.14.683.304 1.007.493 1.216.708 2.098 1.7 2.553 2.866.773 1.968.712 5.194-1.799 7.643-1.868 1.832-4.13 2.698-7.072 2.717z" />
            </svg>
        ),
    },
    {
        label: "YouTube",
        href: "https://youtube.com",
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
        ),
    },
];

const defaultNavLinks = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
];

export function Footer({ navLinks }: { navLinks?: { label: string; href: string }[] } = {}) {
    const links = navLinks ?? defaultNavLinks;
    return (
        <footer className="relative w-full overflow-hidden bg-background">
            {/* Top divider */}
            <div className="h-px w-full bg-white/[0.06]" />

            {/* Main footer content */}
            <div className="relative mx-auto max-w-6xl px-8 pb-0 pt-16 md:px-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="flex justify-between items-start"
                >
                    {/* Left — social links + copyright */}
                    <div className="flex flex-col gap-5">
                        {socialLinks.map((social, i) => (
                            <motion.a
                                key={social.label}
                                href={social.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, x: -12 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{
                                    duration: 0.5,
                                    delay: i * 0.08,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="flex items-center gap-2.5 text-foreground/40 transition-colors hover:text-foreground/80 group"
                            >
                                <span className="transition-colors group-hover:text-foreground/80">
                                    {social.icon}
                                </span>
                                <span className="text-xs font-bold tracking-widest uppercase">
                                    {social.label}
                                </span>
                            </motion.a>
                        ))}

                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="mt-2 text-xs text-foreground/20 tracking-wider"
                        >
                            © 2026
                        </motion.p>
                    </div>

                    {/* Right — nav links */}
                    <div className="flex flex-col gap-5 items-end">
                        {links.map((link, i) => (
                            <motion.a
                                key={link.label}
                                href={link.href}
                                initial={{ opacity: 0, x: 12 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{
                                    duration: 0.5,
                                    delay: i * 0.08,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="text-xs font-bold tracking-widest uppercase text-foreground/40 transition-colors hover:text-foreground/80"
                            >
                                {link.label}
                            </motion.a>
                        ))}
                    </div>
                </motion.div>

                {/* Oversized display brand name */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-16 select-none overflow-hidden"
                >
                    <p
                        className="leading-none text-foreground/[0.05] whitespace-nowrap"
                        style={{
                            fontFamily: "var(--font-pirata-one)",
                            fontSize: "clamp(4rem, 18vw, 18rem)",
                            letterSpacing: "-0.02em",
                        }}
                    >
                        Feelingfire
                    </p>
                </motion.div>
            </div>
        </footer>
    );
}
