"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const sections = [
    {
        title: "1. Information We Collect",
        content: [
            {
                subtitle: "Account Information",
                text: "When you sign in with Google, we receive your name, email address, and profile picture from Google's OAuth service. We store this information to create and manage your Feeling Fire account.",
            },
            {
                subtitle: "Usage Data",
                text: "We collect information about how you use our service, including music generation prompts, selected options (mood, genre, duration), generation history, and feature interactions. This data helps us improve our service.",
            },
            {
                subtitle: "Payment Information",
                text: "Credit purchases are processed by Polar.sh. We do not store your payment card details. We receive and store transaction records including the amount paid, credits purchased, and transaction timestamps.",
            },
            {
                subtitle: "Technical Data",
                text: "We automatically collect certain technical information such as your IP address, browser type, device information, and access timestamps through standard server logs and Supabase infrastructure.",
            },
        ],
    },
    {
        title: "2. How We Use Your Information",
        content: [
            {
                subtitle: "Providing the Service",
                text: "We use your information to authenticate your account, process music generation requests via Replicate's AI models, manage your credit balance, and deliver generated audio files.",
            },
            {
                subtitle: "Service Improvement",
                text: "Aggregated and anonymized usage patterns help us improve generation quality, optimize performance, and develop new features. We do not sell individual user data.",
            },
            {
                subtitle: "Communications",
                text: "We may send you service-related emails such as account confirmations or important updates. We do not send marketing emails without your explicit consent.",
            },
        ],
    },
    {
        title: "3. Data Sharing",
        content: [
            {
                subtitle: "Third-Party Providers",
                text: "We share data with trusted service providers necessary to operate Feeling Fire: Supabase (database and authentication), Google (OAuth login), Replicate (AI music generation), and Polar.sh (payment processing). Each provider has their own privacy policy.",
            },
            {
                subtitle: "No Sale of Data",
                text: "We do not sell, rent, or trade your personal information to third parties for their marketing purposes.",
            },
            {
                subtitle: "Legal Requirements",
                text: "We may disclose your information if required by law, court order, or governmental authority, or when we believe disclosure is necessary to protect our rights or the safety of others.",
            },
        ],
    },
    {
        title: "4. Data Retention",
        content: [
            {
                subtitle: "Account Data",
                text: "We retain your account information for as long as your account is active. If you request account deletion, we will remove your personal data within 30 days, except where retention is required by law.",
            },
            {
                subtitle: "Generated Music",
                text: "Music files you generate are stored in our private Supabase Storage bucket and are accessible only to you. You may delete your music at any time from your workspace.",
            },
            {
                subtitle: "Logs",
                text: "Server logs and usage data are retained for up to 90 days for security and debugging purposes.",
            },
        ],
    },
    {
        title: "5. Security",
        content: [
            {
                subtitle: "Data Protection",
                text: "We implement industry-standard security measures including encrypted data transmission (HTTPS/TLS), row-level security (RLS) policies on our database ensuring users can only access their own data, and private storage with authenticated access.",
            },
            {
                subtitle: "Breach Notification",
                text: "In the event of a data breach that affects your personal information, we will notify you and relevant authorities as required by applicable law.",
            },
        ],
    },
    {
        title: "6. Your Rights",
        content: [
            {
                subtitle: "Access and Portability",
                text: "You may request a copy of the personal data we hold about you at any time by contacting us.",
            },
            {
                subtitle: "Correction and Deletion",
                text: "You may update your profile information or request deletion of your account and associated data. Account deletion requests can be submitted via email.",
            },
            {
                subtitle: "Opt-Out",
                text: "You may opt out of non-essential communications at any time. Note that opting out of service-related emails may limit your ability to use certain features.",
            },
        ],
    },
    {
        title: "7. Cookies",
        content: [
            {
                subtitle: "Session Cookies",
                text: "We use cookies strictly necessary for authentication, including session tokens managed by Supabase. These cookies expire when you sign out or after a set period of inactivity.",
            },
            {
                subtitle: "No Tracking",
                text: "We do not use advertising cookies or cross-site tracking technologies.",
            },
        ],
    },
    {
        title: "8. Contact Us",
        content: [
            {
                subtitle: "Privacy Inquiries",
                text: "If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us at: privacy@feelingfire.ai",
            },
        ],
    },
];

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#181818] text-white font-sans">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#181818]/80 backdrop-blur-xl">
                <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
                    <Link
                        href="/"
                        className="text-xl font-bold tracking-tight text-white"
                        style={{ fontFamily: "var(--font-pirata-one)" }}
                    >
                        Feeling Fire
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Home
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="mx-auto max-w-4xl px-6 py-16">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    {/* Title */}
                    <div className="mb-12">
                        <h1 className="mb-3 text-4xl font-bold tracking-tight text-white md:text-5xl">
                            Privacy Policy
                        </h1>
                        <p className="text-sm text-white/40">
                            Last updated: March 2, 2026
                        </p>
                        <p className="mt-4 text-base leading-relaxed text-white/60">
                            At Feeling Fire, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information when you use our AI music generation service.
                        </p>
                    </div>

                    {/* Sections */}
                    <div className="space-y-10">
                        {sections.map((section, i) => (
                            <motion.div
                                key={section.title}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 + i * 0.05, ease: "easeOut" }}
                                className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 md:p-8"
                            >
                                <h2 className="mb-5 text-lg font-semibold text-[#9b87f5]">
                                    {section.title}
                                </h2>
                                <div className="space-y-5">
                                    {section.content.map((item) => (
                                        <div key={item.subtitle}>
                                            <h3 className="mb-1.5 text-sm font-medium text-white/90">
                                                {item.subtitle}
                                            </h3>
                                            <p className="text-sm leading-relaxed text-white/55">
                                                {item.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Footer note */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        className="mt-12 text-center text-sm text-white/30"
                    >
                        We may update this Privacy Policy from time to time. Continued use of the service after changes constitutes acceptance of the updated policy.
                    </motion.p>
                </motion.div>
            </main>
        </div>
    );
}
