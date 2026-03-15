"use client";

import React from "react";
import { motion } from "framer-motion";

interface PricingPlan {
    id: string;
    name: string;
    price: string;
    credits: number;
    perCredit: string;
    badge: string | null;
    description: string;
    features: string[];
}

interface PricingSectionContent {
    sectionLabel?: string;
    headingLine1?: string;
    headingLine2?: string;
    subheading?: string;
    creditPill?: string;
    ctaText?: string;
    bottomNote?: string;
    plans?: PricingPlan[];
}

const defaultPlans: PricingPlan[] = [
    {
        id: "pro",
        name: "Pro",
        price: "$1",
        credits: 30,
        perCredit: "$0.033",
        badge: null,
        description: "Start Light",
        features: ["30 credits", "1 credit = 1 track", "No expiry", "Commercial use OK"],
    },
    {
        id: "ultra",
        name: "Ultra",
        price: "$10",
        credits: 330,
        perCredit: "$0.030",
        badge: "BEST VALUE",
        description: "Create More",
        features: ["330 credits", "1 credit = 1 track", "No expiry", "Commercial use OK"],
    },
];

export function PricingSection({ content }: { content?: PricingSectionContent } = {}) {
    const sectionLabel = content?.sectionLabel ?? "PRICING";
    const headingLine1 = content?.headingLine1 ?? "Pay Only For";
    const headingLine2 = content?.headingLine2 ?? "What You Use";
    const subheading = content?.subheading ?? "No subscription, no commitment. Top up credits\nand generate music whenever you need it.";
    const creditPill = content?.creditPill ?? "1 CREDIT = 1 TRACK GENERATED";
    const ctaText = content?.ctaText ?? "Get Started →";
    const bottomNote = content?.bottomNote ?? "Credits never expire. One-time payment, no subscription.";
    const plans = content?.plans ?? defaultPlans;

    return (
        <section
            id="pricing"
            className="relative w-full overflow-hidden bg-background px-8 py-24 md:px-12"
        >
            <div className="relative mx-auto max-w-4xl">
                {/* Section heading */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-6 text-center"
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
                    <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-foreground/60 whitespace-pre-line">
                        {subheading}
                    </p>
                </motion.div>

                {/* Credit explanation pill */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-16 flex justify-center"
                >
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-xs font-bold tracking-widest text-foreground/70">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-foreground/60" />
                        {creditPill}
                    </div>
                </motion.div>

                {/* Pricing cards */}
                <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{
                                duration: 0.7,
                                delay: i * 0.12,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="relative w-full max-w-[280px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
                        >
                            {/* Subtle radial glow */}
                            <div
                                className="pointer-events-none absolute inset-0 z-0"
                                style={{
                                    backgroundImage: `radial-gradient(circle at 50% 30%, rgba(255,255,255,1) 0%, transparent 65%)`,
                                    opacity: plan.badge ? 0.05 : 0.03,
                                    mixBlendMode: "screen",
                                }}
                            />

                            {/* Best value badge */}
                            {plan.badge && (
                                <div className="relative z-10 flex justify-center pt-5">
                                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold tracking-widest text-foreground/70">
                                        {plan.badge}
                                    </span>
                                </div>
                            )}

                            {/* Card body */}
                            <div
                                className={`relative z-10 flex flex-col items-center gap-1 px-10 text-center ${plan.badge ? "pb-10 pt-5" : "py-10"}`}
                            >
                                {/* Plan name */}
                                <span className="text-[0.7rem] font-bold uppercase tracking-widest text-foreground/40">
                                    {plan.name}
                                </span>

                                {/* Price */}
                                <span className="mt-3 text-5xl font-extrabold text-foreground">
                                    {plan.price}
                                </span>

                                {/* Credits */}
                                <span className="mt-1 text-sm font-bold text-foreground/80">
                                    {plan.credits} credits
                                </span>

                                {/* Per credit */}
                                <span className="text-[0.7rem] text-foreground/30">
                                    {plan.perCredit} per credit
                                </span>

                                {/* Divider */}
                                <div className="my-6 h-px w-full bg-white/8" />

                                {/* Feature list */}
                                <ul className="flex flex-col gap-2.5 text-left w-full">
                                    {plan.features.map((f) => (
                                        <li
                                            key={f}
                                            className="flex items-center gap-2.5 text-xs text-foreground/60"
                                        >
                                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/10">
                                                <svg
                                                    width="8"
                                                    height="8"
                                                    viewBox="0 0 8 8"
                                                    fill="none"
                                                >
                                                    <path
                                                        d="M1.5 4L3.2 5.7L6.5 2.3"
                                                        stroke="rgba(255,255,255,0.7)"
                                                        strokeWidth="1.4"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            </span>
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                <a
                                    href="/auth"
                                    className="mt-8 w-full rounded-full bg-white py-3 text-xs font-bold tracking-widest text-black transition-all hover:scale-105 hover:bg-white/90"
                                >
                                    {ctaText}
                                </a>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom note */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mt-10 text-center text-xs text-foreground/30"
                >
                    {bottomNote}
                </motion.p>
            </div>
        </section>
    );
}
