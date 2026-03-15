"use client";

import { MinimalistHero } from "@/components/MinimalistHero";
import { FeaturesSection } from "@/components/FeaturesSection";
import { ExampleSection } from "@/components/ExampleSection";
import { PricingSection } from "@/components/PricingSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

export default function HomeKo() {
    const navLinks = [
        { label: "홈", href: "#" },
        { label: "기능", href: "#features" },
        { label: "가격", href: "#pricing" },
    ];

    return (
        <main>
            <MinimalistHero
                logoText="Feeling Fire"
                navLinks={navLinks}
                mainText="YouTube 크리에이터를 위한 AI 음악 생성. 단 몇 초 만에 영상 분위기에 맞는 독창적인 트랙을 만드세요."
                ctaLink="/auth"
                ctaLabel="시작하기"
                imageSrc="https://ik.imagekit.io/fpxbgsota/image%2013.png?updatedAt=1753531863793"
                imageAlt="AI 음악 생성 비주얼"
                overlayText={{
                    part1: "나만의",
                    part2: "음악",
                    part3: "만들기",
                }}
                langSwitch={{
                    currentLang: "ko",
                    enHref: "/",
                    koHref: "/ko",
                }}
            />
            <FeaturesSection
                content={{
                    sectionLabel: "기능",
                    headingLine1: "필요한 모든 것을",
                    headingLine2: "한 곳에서",
                    subheading:
                        "저작권 걱정, 불법 다운로드, 어울리지 않는 배경음악 — 크리에이터가 겪는 모든 문제를 한 번에 해결하세요.",
                    ctaText: "무료로 시작하기 →",
                    features: [
                        {
                            id: 1,
                            image: "/image/1.jpg",
                            tag: "저작권 프리",
                            title: "저작권 걱정 없이",
                            description:
                                "수익 창출 영상에도 마음껏 사용하세요. Feelingfire의 모든 트랙은 완전 무료 저작권입니다.",
                        },
                        {
                            id: 2,
                            image: "/image/2.jpg",
                            tag: "다운로드 불필요",
                            title: "MP3 찾아 헤매지 마세요",
                            description:
                                "의심스러운 다운로드 사이트에 시간 낭비할 필요 없어요. 필요한 음악을 즉시 생성하세요.",
                        },
                        {
                            id: 3,
                            image: "/image/3.jpg",
                            tag: "맞춤 생성",
                            title: "나만의 방식으로",
                            description:
                                "분위기, 장르, 템포를 직접 설정하세요. AI가 영상에 딱 맞는 트랙을 만들어 드립니다.",
                        },
                        {
                            id: 4,
                            image: "/image/4.jpg",
                            tag: "즉시 생성",
                            title: "몇 초면 완성",
                            description:
                                "긴 대기 시간 없어요. 프롬프트 입력 후 고품질 음악이 순식간에 준비됩니다.",
                        },
                        {
                            id: 5,
                            image: "/image/5.jpg",
                            tag: "모든 분위기 · 모든 장르",
                            title: "장르 제한 없음",
                            description:
                                "로파이부터 오케스트라까지 — 영상의 분위기가 무엇이든, 딱 맞는 사운드가 즉시 나옵니다.",
                        },
                        {
                            id: 6,
                            image: "/image/6.jpg",
                            tag: "상업적 사용",
                            title: "상업적 사용 가능",
                            description:
                                "광고, 브랜드 영상, YouTube 수익 창출 — 모든 상업적 목적에 자유롭게 사용하세요.",
                        },
                    ],
                }}
            />
            <ExampleSection
                content={{
                    sectionLabel: "예시 트랙",
                    headingLine1: "영상에 완벽한",
                    headingLine2: "음악",
                    subheading:
                        "콘텐츠에 딱 맞는 사운드트랙을 만들어보세요.\nAI가 분위기에 맞는 트랙을 즉시 생성합니다.",
                    ctaText: "나만의 음악 만들기 →",
                }}
            />
            <PricingSection
                content={{
                    sectionLabel: "가격",
                    headingLine1: "사용한 만큼만",
                    headingLine2: "결제하세요",
                    subheading:
                        "구독 없음, 약정 없음. 크레딧을 충전하고\n필요할 때 언제든지 음악을 생성하세요.",
                    creditPill: "1 크레딧 = 1 트랙 생성",
                    ctaText: "시작하기 →",
                    bottomNote: "크레딧은 만료되지 않습니다. 일회성 결제, 구독 없음.",
                    plans: [
                        {
                            id: "pro",
                            name: "Pro",
                            price: "$1",
                            credits: 30,
                            perCredit: "$0.033",
                            badge: null,
                            description: "가볍게 시작",
                            features: [
                                "30 크레딧",
                                "1 크레딧 = 1 트랙",
                                "기간 제한 없음",
                                "상업적 사용 가능",
                            ],
                        },
                        {
                            id: "ultra",
                            name: "Ultra",
                            price: "$10",
                            credits: 330,
                            perCredit: "$0.030",
                            badge: "최고 가성비",
                            description: "더 많이 만들기",
                            features: [
                                "330 크레딧",
                                "1 크레딧 = 1 트랙",
                                "기간 제한 없음",
                                "상업적 사용 가능",
                            ],
                        },
                    ],
                }}
            />
            <CTASection
                content={{
                    sectionLabel: "지금 시작하기",
                    headingLine1: "지금 나만의",
                    headingLine2: "음악을 만드세요",
                    subheading:
                        "구독 없음, 약정 없음. 크레딧을 충전하고\nYouTube 완성 음악을 몇 초 만에 생성하세요.",
                    ctaText: "무료로 시작하기 →",
                }}
            />
            <Footer
                navLinks={[
                    { label: "기능", href: "#features" },
                    { label: "가격", href: "#pricing" },
                    { label: "개인정보처리방침", href: "/privacy" },
                    { label: "이용약관", href: "/terms" },
                ]}
            />
        </main>
    );
}
