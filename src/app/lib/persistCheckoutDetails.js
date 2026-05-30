import axiosAuth from "./api/axiosConfig";

/**
 * Same key as `DiliveryAndPayment` uses to keep checkout form in localStorage until payment completes.
 * `persistCheckoutDetailsAfterPayment` runs only after success (Stripe `/payment-success` or KHQR paid)—
 * not when the user submits the checkout form.
 */
export const DELIVERY_CHECKOUT_STORAGE_KEY = "deliveryPaymentForm";

function stripEmpty(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );
}

export function parseStoredCheckoutForm() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DELIVERY_CHECKOUT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Shapes the saved checkout form into fields that match create-checkout-session / order delivery columns.
 * Backend should merge these on PATCH (e.g. delivery_address_full, latitude, …).
 */
export function buildOrderCheckoutDetailsBody(raw) {
  if (!raw || typeof raw !== "object") return null;
  const fullAddress =
    String(raw.deliveryAddress || "").trim() ||
    [raw.homeNumber, raw.streetAddress, raw.districtCommune, raw.province, raw.country]
      .filter(Boolean)
      .join(", ");
  const loc = raw.deliveryLocation;
  const body = stripEmpty({
    name: raw.name,
    fullName: raw.name,
    email: raw.email,
    phone: raw.phone,
    gender: raw.gender,
    deliveryAddressFull: fullAddress || undefined,
    deliveryStreet: raw.streetAddress || undefined,
    deliveryCity: raw.districtCommune || undefined,
    deliveryProvince: raw.province || undefined,
    deliveryMapUrl: loc?.mapUrl,
    googleMapLink: loc?.mapUrl,
    locationUrl: loc?.mapUrl,
    latitude: loc?.lat,
    longitude: loc?.lng,
    logisticCompany: raw.deliveryOption,
    deliveryMethod: raw.deliveryOption,
    shippingProvider: raw.deliveryOption,
    paymentMethod: raw.paymentType,
    paymentType: raw.paymentType,
  });
  return Object.keys(body).length ? body : null;
}

/**
 * Pushes saved checkout/delivery fields to the API so the order row is updated in the DB.
 * Tries common Spring paths until one succeeds (implement ONE on the backend).
 *
 * Preferred: PATCH `/api/v1/orders/{orderId}/checkout-details`
 */
export async function persistCheckoutDetailsAfterPayment(orderId) {
  if (orderId == null || String(orderId).trim() === "") {
    return { ok: false, reason: "missing_order_id" };
  }
  const id = String(orderId).trim();
  const body = buildOrderCheckoutDetailsBody(parseStoredCheckoutForm());
  if (!body) {
    return { ok: false, reason: "no_checkout_data" };
  }

  const attempts = [
    { method: "patch", path: `/orders/${id}/checkout-details` },
    { method: "put", path: `/orders/${id}/checkout-details` },
    { method: "patch", path: `/orders/${id}/delivery` },
    { method: "put", path: `/orders/${id}/delivery` },
    { method: "patch", path: `/orders/${id}` },
  ];

  let lastError = null;
  for (const { method, path } of attempts) {
    try {
      const cfg = { withCredentials: true };
      if (method === "patch") await axiosAuth.patch(path, body, cfg);
      else await axiosAuth.put(path, body, cfg);
      localStorage.removeItem(DELIVERY_CHECKOUT_STORAGE_KEY);
      return { ok: true, path, method };
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      if (status === 401) return { ok: false, error: err, reason: "unauthorized" };
      if (status === 404 || status === 405) continue;
      return { ok: false, error: err, path, method };
    }
  }

  return { ok: false, error: lastError, reason: "no_matching_endpoint" };
}
