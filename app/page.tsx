"use client";

import { MinimalistHero } from "@/components/MinimalistHero";
import { FeaturesSection } from "@/components/FeaturesSection";
import { ExampleSection } from "@/components/ExampleSection";
import { PricingSection } from "@/components/PricingSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

export default function Home() {
    const navLinks = [
        { label: "HOME", href: "#" },
        { label: "FEATURES", href: "#features" },
        { label: "PRICING", href: "#pricing" },
    ];

    return (
        <main>
            <MinimalistHero
                logoText="Feeling Fire"
                navLinks={navLinks}
                mainText="AI-powered music generation for YouTube creators. Create unique, royalty-free tracks tailored to your video's mood in seconds."
                ctaLink="/auth"
                imageSrc="https://ik.imagekit.io/fpxbgsota/image%2013.png?updatedAt=1753531863793"
                imageAlt="AI music generation visual"
                overlayText={{
                    part1: "Create",
                    part2: "Your Music",
                }}
            />
            <FeaturesSection />
            <ExampleSection />
            <PricingSection />
            <CTASection />
            <Footer />
        </main>
    );
}
