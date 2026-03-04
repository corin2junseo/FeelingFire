import { NextRequest, NextResponse } from "next/server";
import { Polar } from "@polar-sh/sdk";
import { createClient } from "@/lib/supabase/server";

const polar = new Polar({
    accessToken: process.env.POLAR_API_TOKEN!,
    server: "production",
});

const PRODUCT_IDS: Record<string, string> = {
    pro: process.env.POLAR_PRO_PRODUCT_ID!,
    ultra: process.env.POLAR_ULTRA_PRODUCT_ID!,
};

export async function POST(req: NextRequest) {
    console.log("[checkout] ENV check:", {
        hasToken: !!process.env.POLAR_API_TOKEN,
        hasProId: !!process.env.POLAR_PRO_PRODUCT_ID,
        hasUltraId: !!process.env.POLAR_ULTRA_PRODUCT_ID,
        proId: process.env.POLAR_PRO_PRODUCT_ID,
        ultraId: process.env.POLAR_ULTRA_PRODUCT_ID,
    });

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await req.json();
    const productId = PRODUCT_IDS[plan];

    console.log("[checkout] plan:", plan, "productId:", productId);

    if (!productId) {
        return NextResponse.json({ error: "Invalid plan — productId is empty" }, { status: 400 });
    }

    const origin =
        req.headers.get("origin") ??
        process.env.PUBLIC_APP_URL?.replace(/\/$/, "") ??
        "";

    try {
        const checkout = await polar.checkouts.create({
            products: [productId],
            customerEmail: user.email!,
            externalCustomerId: user.id,
            successUrl: `${origin}/workspace?payment=success`,
        });

        return NextResponse.json({ url: checkout.url });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.error("[checkout] Polar error:", e);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
