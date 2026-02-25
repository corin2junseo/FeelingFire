"use client";

import { MinimalistHero } from "@/components/MinimalistHero";

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
                ctaLink="#features"
                imageSrc="https://ik.imagekit.io/fpxbgsota/image%2013.png?updatedAt=1753531863793"
                imageAlt="AI music generation visual"
                overlayText={{
                    part1: "Create",
                    part2: "Your Music",
                }}
            />
        </main>
    );
}
