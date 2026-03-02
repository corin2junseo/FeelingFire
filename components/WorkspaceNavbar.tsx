"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, LogOut, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { CreditModal } from "@/components/CreditModal";

interface WorkspaceNavbarProps {
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
}

export function WorkspaceNavbar({ searchQuery = "", onSearchChange }: WorkspaceNavbarProps) {
    const { user, signOut } = useAuth();
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [creditModalOpen, setCreditModalOpen] = useState(false);

    const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
    const fullName =
        (user?.user_metadata?.full_name as string) || user?.email || "User";
    const initials = fullName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <>
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4">
            {/* ── Logo ── */}
            <motion.span
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="select-none text-[1.25rem] font-bold tracking-wide text-white"
                style={{ fontFamily: "var(--font-pirata-one)" }}
            >
                Feeling Fire
            </motion.span>

            {/* ── Search ── */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative w-full max-w-[540px] mx-8"
            >
                {/* Glass pill */}
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
                    {/* Inner top-edge highlight */}
                    <div className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>
            </motion.div>

            {/* ── User Profile ── */}
            <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative"
                onMouseEnter={() => setPopoverOpen(true)}
                onMouseLeave={() => setPopoverOpen(false)}
            >
                {/* Avatar button */}
                <button
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

                            {/* Upgrade */}
                            <button
                                onClick={() => {
                                    setPopoverOpen(false);
                                    setCreditModalOpen(true);
                                }}
                                className="flex w-full items-center gap-2.5 px-4 py-3 text-[0.8rem] text-amber-400/80
                                    transition-colors duration-150
                                    hover:bg-white/[0.04] hover:text-amber-300"
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
            </motion.div>
        </nav>

        <CreditModal open={creditModalOpen} onClose={() => setCreditModalOpen(false)} />
        </>
    );
}
