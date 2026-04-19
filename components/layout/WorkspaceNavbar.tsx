"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, LogOut, Star, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { CreditModal } from "@/components/credits/CreditModal";

interface WorkspaceNavbarProps {
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
}

export function WorkspaceNavbar({ searchQuery = "", onSearchChange }: WorkspaceNavbarProps) {
    const { user, credits, signOut } = useAuth();
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [creditModalOpen, setCreditModalOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
    const fullName =
        (user?.user_metadata?.full_name as string) || user?.email || "User";
    const initials = fullName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    // Close popover on outside click (mobile-friendly)
    useEffect(() => {
        if (!popoverOpen) return;
        const handler = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setPopoverOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [popoverOpen]);

    return (
        <>
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md">
            {/* Single row on desktop / two rows on mobile via flex-wrap */}
            <div className="flex flex-wrap items-center gap-y-2 px-4 py-3 md:flex-nowrap md:px-8 md:py-4">

                {/* ── Logo ── */}
                <motion.span
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex-none select-none text-[1.25rem] font-bold tracking-wide text-white"
                    style={{ fontFamily: "var(--font-pirata-one)" }}
                >
                    Feeling Fire
                </motion.span>

                {/* ── Search — wraps to 2nd row on mobile, centered on desktop ── */}
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="order-last w-full md:order-none md:mx-8 md:max-w-[540px] md:flex-1"
                >
                    <div
                        className="relative flex items-center gap-2.5 rounded-full px-4 py-2.5
                            border border-white/[0.13]
                            bg-white/[0.06]
                            shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_24px_rgba(0,0,0,0.25)]"
                        style={{ backdropFilter: "blur(20px)" }}
                    >
                        <Search className="h-[15px] w-[15px] shrink-0 text-white/30" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                            className="w-full bg-transparent text-[0.83rem] text-white placeholder:text-white/25 focus:outline-none"
                        />
                        <div className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </div>
                </motion.div>

                {/* ── Right side: Credits + Avatar ── */}
                <motion.div
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="ml-auto flex items-center gap-3"
                >
                    {/* Credits pill */}
                    <button
                        onClick={() => setCreditModalOpen(true)}
                        className="flex items-center gap-1.5 rounded-full px-3 py-1.5
                            border border-white/20
                            bg-white/[0.06]
                            text-white/70 text-[0.78rem] font-medium
                            transition-colors duration-150
                            hover:bg-white/[0.12] hover:border-white/30"
                    >
                        <Zap className="h-3 w-3 fill-white/70" />
                        <span>{credits}</span>
                    </button>

                    {/* User Avatar — click-based popover */}
                    <div ref={popoverRef} className="relative">
                        <button
                            onClick={() => setPopoverOpen((p) => !p)}
                            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full
                                opacity-80 transition-opacity duration-200 hover:opacity-100"
                            aria-label="User menu"
                        >
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={fullName}
                                    referrerPolicy="no-referrer"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-white/10 text-[0.7rem] font-semibold text-white">
                                    {initials}
                                </div>
                            )}
                        </button>

                        {/* Popover */}
                        <AnimatePresence>
                            {popoverOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                                    transition={{ duration: 0.16, ease: "easeOut" }}
                                    className="absolute right-0 top-full mt-2.5 w-52 overflow-hidden rounded-2xl
                                        border border-white/[0.08]
                                        bg-[#1c1c1c]
                                        shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
                                >
                                    {/* User info */}
                                    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
                                        <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full">
                                            {avatarUrl ? (
                                                <img
                                                    src={avatarUrl}
                                                    alt={fullName}
                                                    referrerPolicy="no-referrer"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-white/10 text-[0.6rem] font-semibold text-white">
                                                    {initials}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-[0.8rem] font-medium text-white">
                                                {fullName}
                                            </p>
                                            <p className="truncate text-[0.68rem] text-white/40">
                                                {user?.email}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Credits row */}
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                                        <div className="flex items-center gap-2 text-[0.78rem] text-white/60">
                                            <Zap className="h-3.5 w-3.5 text-white/60 fill-white/60" />
                                            <span>Credits</span>
                                        </div>
                                        <span className="text-[0.85rem] font-semibold text-white">{credits}</span>
                                    </div>

                                    {/* Upgrade */}
                                    <button
                                        onClick={() => {
                                            setPopoverOpen(false);
                                            setCreditModalOpen(true);
                                        }}
                                        className="flex w-full items-center gap-2.5 px-4 py-3 text-[0.8rem] text-white/60
                                            transition-colors duration-150
                                            hover:bg-white/[0.04] hover:text-white"
                                    >
                                        <Star className="h-3.5 w-3.5" />
                                        <span>Upgrade</span>
                                    </button>

                                    {/* Sign out */}
                                    <button
                                        onClick={signOut}
                                        className="flex w-full items-center gap-2.5 px-4 py-3 text-[0.8rem] text-white/50
                                            transition-colors duration-150
                                            hover:bg-white/[0.04] hover:text-white"
                                    >
                                        <LogOut className="h-3.5 w-3.5" />
                                        <span>Sign out</span>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

            </div>
        </nav>

        <CreditModal open={creditModalOpen} onClose={() => setCreditModalOpen(false)} />
        </>
    );
}
