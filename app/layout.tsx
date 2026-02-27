import type { Metadata } from "next";
import { Geist, Geist_Mono, Pirata_One, Comic_Neue } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { MusicPlayerProvider } from "@/contexts/MusicPlayerContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pirataOne = Pirata_One({
  variable: "--font-pirata-one",
  weight: "400",
  subsets: ["latin"],
});

const comicNeue = Comic_Neue({
  variable: "--font-comic-neue",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Feeling Fire — AI Music for YouTube Creators",
  description:
    "Create unique, royalty-free music for your YouTube videos with AI. Tailored to your mood, ready in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pirataOne.variable} ${comicNeue.variable} antialiased`}
      >
        <AuthProvider>
          <MusicPlayerProvider>{children}</MusicPlayerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
