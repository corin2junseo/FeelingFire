"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthPage() {
    const { signInWithGoogle, loading } = useAuth();

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-[#171717] font-sans">
            {/* Main Card — glass color tint, no blur/glow */}
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="w-full max-w-[360px] rounded-3xl border border-white/10 bg-white/[0.06] p-12 text-center"
            >
                {/* Logo / Title */}
                <motion.div
                    initial={{ scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="mb-8"
                >
                    <h1
                        className="mb-2 text-[2.5rem] leading-tight font-bold tracking-tight text-white"
                        style={{ fontFamily: "var(--font-pirata-one)" }}
                    >
                        Feeling Fire
                    </h1>
                    <p className="text-[0.8rem] text-neutral-400 tracking-wide">
                        Unlock the power of AI music
                    </p>
                </motion.div>

                {/* Google Login Button */}
                <motion.button
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.97 }}
                    onClick={signInWithGoogle}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[0.06] px-6 py-3.5 text-[0.85rem] font-medium text-white transition-colors hover:bg-white/[0.12] hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    <span>{loading ? "Loading..." : "Continue with Google"}</span>
                </motion.button>

                {/* Footer note */}
                <p className="mt-6 text-[0.7rem] text-neutral-600">
                    By continuing, you agree to our Terms &amp; Privacy Policy.
                </p>
            </motion.div>
        </div>
    );
}
