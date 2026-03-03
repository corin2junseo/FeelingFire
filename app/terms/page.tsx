"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const sections = [
    {
        title: "1. Acceptance of Terms",
        content: [
            {
                subtitle: "Agreement",
                text: "By accessing or using Feeling Fire ('the Service'), you agree to be bound by these Terms of Service ('Terms'). If you do not agree to these Terms, you may not use the Service.",
            },
            {
                subtitle: "Eligibility",
                text: "You must be at least 13 years of age to use Feeling Fire. By using the Service, you represent that you meet this requirement and that you have the legal capacity to enter into these Terms.",
            },
        ],
    },
    {
        title: "2. Service Description",
        content: [
            {
                subtitle: "AI Music Generation",
                text: "Feeling Fire provides an AI-powered music generation service that creates royalty-free audio tracks based on user-provided text prompts. Music is generated via third-party AI model providers, including Replicate.",
            },
            {
                subtitle: "Service Availability",
                text: "We strive to maintain high availability but do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control.",
            },
            {
                subtitle: "Beta Features",
                text: "Certain features may be offered in beta or preview. Beta features are provided as-is and may be modified or discontinued without notice.",
            },
        ],
    },
    {
        title: "3. User Accounts",
        content: [
            {
                subtitle: "Account Creation",
                text: "You create an account by authenticating through Google OAuth. You are responsible for maintaining the security of your account and for all activity that occurs under it.",
            },
            {
                subtitle: "Account Termination",
                text: "We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or remain inactive for an extended period. You may also request account deletion at any time.",
            },
        ],
    },
    {
        title: "4. Credits and Payments",
        content: [
            {
                subtitle: "Credit System",
                text: "Feeling Fire operates on a credit-based system. Credits are required to generate music. The credit cost per generation depends on duration and number of variations selected.",
            },
            {
                subtitle: "Purchasing Credits",
                text: "Credits are purchased through Polar.sh, our payment processor. All purchases are final. We do not offer refunds for unused credits except where required by applicable law.",
            },
            {
                subtitle: "Credit Expiry",
                text: "Credits do not expire as long as your account remains active. Credits are non-transferable and have no cash value.",
            },
            {
                subtitle: "Pricing Changes",
                text: "We reserve the right to modify credit pricing at any time. Price changes will be communicated in advance and will not affect credits already purchased.",
            },
        ],
    },
    {
        title: "5. Content and Intellectual Property",
        content: [
            {
                subtitle: "Your Prompts",
                text: "You retain ownership of the text prompts you submit. By submitting prompts, you grant us a limited license to process them for the purpose of generating music on your behalf.",
            },
            {
                subtitle: "Generated Music",
                text: "Music generated through the Service is provided for your use. You may use generated tracks in your YouTube videos, other content, and projects without paying royalties to Feeling Fire. However, you acknowledge that AI-generated content may be subject to evolving legal frameworks.",
            },
            {
                subtitle: "Prohibited Content",
                text: "You agree not to submit prompts designed to generate content that is illegal, defamatory, hateful, or that infringes third-party intellectual property rights.",
            },
            {
                subtitle: "Our Intellectual Property",
                text: "The Feeling Fire name, logo, website design, and underlying technology remain the intellectual property of Feeling Fire. You may not reproduce, distribute, or create derivative works from our platform without express written consent.",
            },
        ],
    },
    {
        title: "6. Acceptable Use",
        content: [
            {
                subtitle: "Permitted Use",
                text: "You may use Feeling Fire solely for lawful personal or commercial creative purposes, including creating music for YouTube videos, podcasts, games, and similar projects.",
            },
            {
                subtitle: "Prohibited Activities",
                text: "You must not: attempt to reverse-engineer, scrape, or abuse the API; circumvent credit systems or access controls; use automated bots to generate music at scale beyond normal personal use; resell generated music as a standalone music library service without authorization.",
            },
            {
                subtitle: "Enforcement",
                text: "Violation of acceptable use policies may result in immediate account suspension or termination without refund of unused credits.",
            },
        ],
    },
    {
        title: "7. Disclaimers",
        content: [
            {
                subtitle: "No Warranty",
                text: "The Service is provided 'as is' and 'as available' without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.",
            },
            {
                subtitle: "AI Limitations",
                text: "AI-generated music may not always meet your expectations. We do not guarantee specific quality, style, or that the output will be identical across generations with the same prompt.",
            },
            {
                subtitle: "Third-Party Services",
                text: "We are not responsible for the availability or performance of third-party services including Google, Replicate, Supabase, or Polar.sh.",
            },
        ],
    },
    {
        title: "8. Limitation of Liability",
        content: [
            {
                subtitle: "Liability Cap",
                text: "To the fullest extent permitted by law, Feeling Fire's total liability to you for any claim arising from use of the Service shall not exceed the amount you paid for credits in the 12 months preceding the claim.",
            },
            {
                subtitle: "Excluded Damages",
                text: "In no event shall Feeling Fire be liable for indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, even if advised of the possibility of such damages.",
            },
        ],
    },
    {
        title: "9. Changes to Terms",
        content: [
            {
                subtitle: "Modifications",
                text: "We may update these Terms at any time. We will notify users of material changes via email or a prominent notice on the Service. Continued use of the Service after changes take effect constitutes your acceptance of the revised Terms.",
            },
        ],
    },
    {
        title: "10. Governing Law",
        content: [
            {
                subtitle: "Jurisdiction",
                text: "These Terms shall be governed by and construed in accordance with applicable law. Any disputes shall be resolved through good-faith negotiation, and if unresolved, through binding arbitration.",
            },
        ],
    },
    {
        title: "11. Contact Us",
        content: [
            {
                subtitle: "Questions",
                text: "If you have questions about these Terms of Service, please contact us at: legal@feelingfire.ai",
            },
        ],
    },
];

export default function TermsPage() {
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
                            Terms of Service
                        </h1>
                        <p className="text-sm text-white/40">
                            Last updated: March 2, 2026
                        </p>
                        <p className="mt-4 text-base leading-relaxed text-white/60">
                            Please read these Terms of Service carefully before using Feeling Fire. These terms govern your use of our AI music generation platform.
                        </p>
                    </div>

                    {/* Sections */}
                    <div className="space-y-10">
                        {sections.map((section, i) => (
                            <motion.div
                                key={section.title}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 + i * 0.04, ease: "easeOut" }}
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
                        transition={{ duration: 0.5, delay: 0.7 }}
                        className="mt-12 text-center text-sm text-white/30"
                    >
                        By using Feeling Fire, you acknowledge that you have read and understood these Terms of Service.
                    </motion.p>
                </motion.div>
            </main>
        </div>
    );
}
