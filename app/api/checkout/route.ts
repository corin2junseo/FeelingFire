import { NextRequest, NextResponse } from "next/server";
import { Polar } from "@polar-sh/sdk";
import { createClient } from "@/lib/supabase/server";

const polar = new Polar({
    accessToken: process.env.POLAR_API_TOKEN!,
    server: "sandbox",
});

const PRODUCT_IDS: Record<string, string> = {
    pro: process.env.POLAR_PRO_PRODUCT_ID!,
    ultra: process.env.POLAR_ULTRA_PRODUCT_ID!,
};

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await req.json();
    const productId = PRODUCT_IDS[plan];

    if (!productId) {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const origin = req.headers.get("origin") ?? "";

    const checkout = await polar.checkouts.create({
        products: [productId],
        customerEmail: user.email!,
        externalCustomerId: user.id,
        successUrl: `${origin}/workspace?payment=success`,
    });

    return NextResponse.json({ url: checkout.url });
}
