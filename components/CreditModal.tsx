"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface CreditModalProps {
    open: boolean;
    onClose: () => void;
}

const plans = [
    { id: "pro", name: "Pro", price: "$1", credits: "30 credits" },
    { id: "ultra", name: "Ultra", price: "$10", credits: "330 credits" },
];

export function CreditModal({ open, onClose }: CreditModalProps) {
    const [mounted, setMounted] = useState(false);
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    async function handlePlanClick(planId: string) {
        if (!user || loadingPlan) return;

        setLoadingPlan(planId);
        try {
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan: planId }),
            });

            if (!res.ok) throw new Error("Failed to create checkout");

            const { url } = await res.json();
            window.location.href = url;
        } catch {
            setLoadingPlan(null);
        }
    }

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center"
                    onClick={onClose}
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60"
                        style={{ backdropFilter: "blur(6px)" }}
                    />

                    {/* Cards */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="relative z-10 flex gap-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {plans.map((plan) => {
                            const isLoading = loadingPlan === plan.id;
                            const isDisabled = !!loadingPlan;

                            return (
                                <motion.div
                                    key={plan.name}
                                    whileHover={isDisabled ? {} : { scale: 1.06 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    className={`relative w-44 overflow-hidden rounded-2xl border border-white/[0.1] bg-[#1a1a1a] px-8 py-10 ${
                                        isDisabled
                                            ? "cursor-not-allowed opacity-60"
                                            : "cursor-pointer"
                                    }`}
                                    onClick={() => handlePlanClick(plan.id)}
                                >
                                    {/* Yellow glow */}
                                    <div
                                        className="absolute inset-0 z-0"
                                        style={{
                                            backgroundImage: `radial-gradient(circle at center, #FFF991 0%, transparent 70%)`,
                                            opacity: 0.13,
                                            mixBlendMode: "screen",
                                        }}
                                    />
                                    <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                                        <span className="text-[0.75rem] font-medium uppercase tracking-widest text-white/40">
                                            {plan.name}
                                        </span>
                                        <span className="text-4xl font-bold text-white">
                                            {isLoading ? (
                                                <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                                            ) : (
                                                plan.price
                                            )}
                                        </span>
                                        <span className="text-[0.76rem] text-white/30">
                                            {plan.credits}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
