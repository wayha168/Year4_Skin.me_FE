"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { API_BASE } from "../lib/api/config";
import { persistCheckoutDetailsAfterPayment } from "../lib/persistCheckoutDetails";

function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [state, setState] = useState({
    loading: true,
    title: "Verifying payment...",
    message: "Please wait while we confirm your payment with Skin.me.",
    detailsNote: "",
  });

  useEffect(() => {
    let cancelled = false;

    const verifyPayment = async () => {
      if (!orderId) {
        if (!cancelled) {
          setState({
            loading: false,
            title: "Missing order",
            message: "No orderId was found in the payment success URL.",
            detailsNote: "",
          });
        }
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/payment/verify-success?orderId=${encodeURIComponent(orderId)}`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json().catch(() => ({}));
        const payload = data?.data ?? data;
        const confirmed = payload?.confirmed === true || payload?.alreadyConfirmed === true;

        if (!cancelled) {
          if (!response.ok) {
            setState({
              loading: false,
              title: "Could not verify",
              message:
                payload?.message ??
                data?.message ??
                `The server returned ${response.status}. You can open your profile to check the order.`,
              detailsNote: "",
            });
            return;
          }
          let detailsNote = "";
          if (confirmed && orderId) {
            const persist = await persistCheckoutDetailsAfterPayment(orderId);
            if (persist.ok) {
              detailsNote = "Your delivery details have been saved to your order.";
            } else if (persist.reason === "unauthorized") {
              detailsNote =
                "Sign in and open your profile if delivery details did not attach—your session may have expired.";
            } else if (persist.reason === "no_matching_endpoint") {
              detailsNote =
                "Ask your backend team to add PATCH /api/v1/orders/{id}/checkout-details (or similar) so checkout form data can be stored on the order.";
            } else if (persist.reason !== "no_checkout_data") {
              detailsNote =
                persist.error?.response?.data?.message?.toString?.() ||
                "Delivery details could not be synced automatically. You can confirm them from your order history if needed.";
            }
          }

          setState({
            loading: false,
            title: confirmed ? "Payment confirmed" : "Payment status",
            message:
              data?.message ??
              (confirmed
                ? "Your order has been confirmed successfully."
                : "We could not confirm payment yet. If you completed Stripe checkout, wait a moment and refresh, or check your orders."),
            detailsNote,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            loading: false,
            title: "Verification error",
            message: error?.message || "We could not verify the payment yet. Please refresh this page in a moment.",
            detailsNote: "",
          });
        }
      }
    };

    verifyPayment();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <main className="min-h-screen bg-[#f8f5f7] px-4 py-16">
      <div className="mx-auto max-w-xl rounded-[28px] border border-[#f1d5e2] bg-white p-8 shadow-[0_20px_50px_rgba(60,15,40,0.08)]">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff1f6] text-[#eb61a2]">
            {state.loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#eb61a2] border-t-transparent" />
            ) : (
              <span className="text-xl font-bold">S</span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b5487f]">Skin.me</p>
            <h1 className="text-2xl font-bold text-[#1f2937]">{state.title}</h1>
          </div>
        </div>

        <p className="text-sm leading-6 text-[#4b5563]">{state.message}</p>

        {state.detailsNote ? (
          <p className="mt-4 text-sm leading-6 text-[#6b7280]">{state.detailsNote}</p>
        ) : null}

        {orderId && (
          <div className="mt-5 rounded-2xl border border-[#f3e3ea] bg-[#fffafc] px-4 py-3 text-sm text-[#6b7280]">
            Order ID: <span className="font-semibold text-[#1f2937]">{orderId}</span>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/profile"
            className="rounded-xl bg-[#eb61a2] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#d94d8c]"
          >
            View orders
          </Link>
          <Link
            href="/products"
            className="rounded-xl border border-[#e5e7eb] px-5 py-3 text-sm font-semibold text-[#374151] transition hover:bg-[#f9fafb]"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </main>
  );
}

export default PaymentSuccessPage;
