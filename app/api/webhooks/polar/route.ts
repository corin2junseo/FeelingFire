import { NextRequest, NextResponse } from "next/server";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { createAdminClient } from "@/lib/supabase/admin";
import { addToCache } from "@/lib/credits";

const CREDITS_MAP: Record<string, number> = {
    [process.env.POLAR_PRO_PRODUCT_ID!]: 30,
    [process.env.POLAR_ULTRA_PRODUCT_ID!]: 330,
};

export async function POST(req: NextRequest) {
    const body = await req.text();

    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
        headers[key] = value;
    });

    let event;
    try {
        event = validateEvent(body, headers, process.env.POLAR_WEBHOOK_SECRET!);
    } catch (e) {
        if (e instanceof WebhookVerificationError) {
            console.error("[webhook] 서명 검증 실패 — POLAR_WEBHOOK_SECRET 확인 필요");
            return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
        }
        throw e;
    }

    if (event.type === "order.paid") {
        const order = event.data;
        const userId = order.customer.externalId;
        const productId = order.productId;
        const credits = productId ? (CREDITS_MAP[productId] ?? 0) : 0;

        if (!userId) {
            console.warn("[webhook] userId 없음 → externalCustomerId가 결제 생성 시 전달되지 않았음");
            return NextResponse.json({ received: true });
        }

        if (credits === 0) {
            console.warn("[webhook] credits=0 → productId가 CREDITS_MAP에 없음");
            return NextResponse.json({ received: true });
        }

        const supabase = createAdminClient();

        const { error } = await supabase.from("payments").insert({
            user_id: userId,
            polar_order_id: order.id,
            amount: order.totalAmount,
            credits,
            status: "completed",
        });

        if (error) {
            if (error.code === "23505") {
                console.warn("[webhook] 이미 처리된 주문 (duplicate), 무시");
                return NextResponse.json({ received: true });
            }
            console.error("[webhook] payments insert 오류:", error);
            throw error;
        }

        const { error: rpcError } = await supabase.rpc("increment_user_credits", {
            p_user_id: userId,
            p_amount: credits,
        });

        if (rpcError) {
            console.error("[webhook] increment_user_credits RPC 오류:", rpcError);
            throw rpcError;
        }

        // Supabase RPC 성공 후 Redis 캐시 동기화
        await addToCache(userId, credits)
    }

    return NextResponse.json({ received: true });
}
