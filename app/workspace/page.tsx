"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { WorkspaceNavbar } from "@/components/WorkspaceNavbar";
import { PromptInputBox } from "@/components/PromptInputBox";

export default function WorkspacePage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/auth");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#171717]">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#171717]">
            <WorkspaceNavbar />

            {/* 추후 워크스페이스 콘텐츠 영역 */}
            <main className="pt-20 pb-40" />

            {/* 하단 고정 프롬프트 창 */}
            <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center px-4 pb-6">
                <div className="w-full max-w-3xl">
                    <PromptInputBox />
                </div>
            </div>
        </div>
    );
}
