"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import axiosAuth from "../../app/lib/api/axiosConfig";
import { API_BASE } from "../../app/lib/api/config";
import {
  DELIVERY_CHECKOUT_STORAGE_KEY,
  persistCheckoutDetailsAfterPayment,
} from "../../app/lib/persistCheckoutDetails";
import useAuthContext from "../../app/lib/Authentication/AuthContext";
import AddressInputWithGoogle from "./AddressInputWithGoogle";

const cambodiaProvinces = [
  "Phnom Penh", "Banteay Meanchey", "Battambang", "Kampong Cham", "Kampong Chhnang",
  "Kampong Speu", "Kampong Thom", "Kampot", "Kandal", "Koh Kong", "Kratié",
  "Mondulkiri", "Oddar Meanchey", "Pailin", "Preah Vihear", "Prey Veng",
  "Pursat", "Ratanakiri", "Siem Reap", "Sihanoukville", "Stung Treng",
  "Svay Rieng", "Takeo", "Tbong Khmum", "Kep"
];

const inputClass =
  "w-full px-4 py-3 border border-[#e5e7eb] rounded-xl text-[#1a1a1a] placeholder-[#9ca3af] focus:ring-2 focus:ring-[#eb61a2]/40 focus:border-[#eb61a2] outline-none transition";
const labelClass = "block text-sm font-medium text-[#374151] mb-1.5";

function ProvinceSearchSelect({ onProvinceChange, value, onChange }) {
  const [query, setQuery] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(value || "");
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const filteredProvinces = cambodiaProvinces.filter((p) =>
    p.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (province) => {
    setSelected(province);
    setQuery(province);
    setIsOpen(false);
    onProvinceChange(province);
    onChange(province);
  };

  useEffect(() => {
    setQuery(value || "");
    setSelected(value || "");
  }, [value]);

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          const newQuery = e.target.value;
          setQuery(newQuery);
          setIsOpen(true);
          setSelected("");
          onChange("");
          onProvinceChange("");
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Search or select province..."
        className={inputClass}
      />
      <div
        className={`absolute z-20 w-full mt-1 bg-white border border-[#e5e7eb] rounded-xl shadow-lg overflow-hidden transition-all duration-200 ${isOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <div className="overflow-auto" style={{ maxHeight: isOpen ? 240 : 0 }}>
          {filteredProvinces.length > 0 ? (
            filteredProvinces.map((p) => (
              <div
                key={p}
                onClick={() => handleSelect(p)}
                className="px-4 py-2.5 hover:bg-[#fdf2f8] cursor-pointer text-[#1a1a1a] transition"
              >
                {p}
              </div>
            ))
          ) : (
            <div className="px-4 py-2.5 text-[#6b7280] italic">No provinces found</div>
          )}
        </div>
      </div>
    </div>
  );
}

function FileUploadWithRemove({ onResetFile, onFileChange }) {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (onFileChange) onFileChange(selectedFile ? selectedFile.name : null);
  };

  const handleRemove = () => {
    setFile(null);
    const el = document.getElementById("proof-of-address-input");
    if (el) el.value = "";
    if (onFileChange) onFileChange(null);
  };

  useEffect(() => {
    if (onResetFile) {
      setFile(null);
      const el = document.getElementById("proof-of-address-input");
      if (el) el.value = "";
      if (onFileChange) onFileChange(null);
    }
  }, [onResetFile, onFileChange]);

  return (
    <div className="space-y-2">
      <input
        type="file"
        id="proof-of-address-input"
        name="proof-of-address"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        className="hidden"
      />
      <label
        htmlFor="proof-of-address-input"
        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-[#fdf2f8] text-[#be185d] font-medium text-sm rounded-xl hover:bg-[#fce7f3] transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Choose file
      </label>
      {file && (
        <div className="flex items-center gap-2 p-3 bg-[#fdf2f8] rounded-xl border border-[#fbcfe8]">
          <span className="text-sm text-[#831843] font-medium truncate flex-1">{file.name}</span>
          <button
            type="button"
            onClick={handleRemove}
            className="w-7 h-7 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center hover:bg-[#be185d] transition text-sm"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

/** Matches backend KHQR gateways: `aba` (ABA) and `khqr` (generic Bakong). Stripe checkout uses `visa`. */
const FALLBACK_PAYMENT_OPTIONS = [
  { id: "aba", label: "ABA KHQR", image: "/assets/ABA.png" },
  { id: "khqr", label: "KHQR (Bakong)", image: "/assets/acelida.png" },
  { id: "visa", label: "Visa / Card (Stripe)", image: "/assets/Visa.png" },
];

const DELIVERY_OPTIONS = [
  {
    id: "vet",
    label: "VET",
    description: "Standard local delivery",
  },
  {
    id: "jnt",
    label: "J&T",
    description: "Courier delivery service",
  },
];

function normalizePaymentOption(option, index = 0) {
  if (!option || typeof option !== "object") return null;

  const id = String(
    option.id ??
    option.code ??
    option.gateway ??
    option.bankCode ??
    option.bank ??
    option.name ??
    `payment-${index}`
  )
    .trim()
    .toLowerCase();

  if (!id) return null;

  const label =
    option.label ??
    option.name ??
    option.displayName ??
    option.bankName ??
    option.gatewayName ??
    id.toUpperCase();
  const labelLower = String(label).toLowerCase();

  const image =
    option.image ??
    option.imageUrl ??
    option.logo ??
    option.logoUrl ??
    (id === "aba"
      ? "/assets/ABA.png"
      : id === "acelida" || id === "acleda" || id === "khqr"
        ? "/assets/acelida.png"
        : id === "visa"
          ? "/assets/Visa.png"
          : null);

  const rawType = String(option.type ?? option.methodType ?? option.category ?? "").toLowerCase();
  const isKhqr =
    option.supportsKhqr === true ||
    option.khqr === true ||
    rawType.includes("khqr") ||
    rawType.includes("bank") ||
    rawType.includes("payway") ||
    id === "aba" ||
    id === "khqr" ||
    id === "acelida" ||
    id === "acleda" ||
    labelLower.includes("aba") ||
    labelLower.includes("acleda") ||
    labelLower.includes("acelida") ||
    labelLower.includes("khqr") ||
    labelLower.includes("payway");
  const isCard =
    id === "visa" ||
    rawType.includes("card") ||
    rawType.includes("stripe") ||
    labelLower.includes("visa") ||
    labelLower.includes("card") ||
    labelLower.includes("stripe");

  const normalizedId = id === "acleda" || id === "acelida" ? "khqr" : id;

  return {
    id: normalizedId,
    label,
    image,
    isKhqr,
    isCard,
    bankId: option.bankId ?? option.id ?? null,
    bankCode: option.bankCode ?? option.code ?? option.gateway ?? normalizedId,
    merchantName: option.merchantName ?? option.displayName ?? option.bankName ?? null,
    raw: option,
  };
}

/** Avoid duplicate buttons when localStorage contained merged / repeated gateway rows. */
function dedupePaymentOptions(options) {
  const seen = new Map();
  for (const opt of options) {
    if (!opt?.id) continue;
    if (!seen.has(opt.id)) seen.set(opt.id, opt);
  }
  return Array.from(seen.values());
}

function extractResponseData(payload) {
  return payload?.data?.data ?? payload?.data ?? payload;
}

function stripEmptyOptional(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );
}

/** Stripe Checkout minimum for USD (card flow; KHQR should not use Stripe). */
const STRIPE_MIN_USD = 0.5;

/** Spring / validation messages from axios error response */
function formatCheckoutError(err) {
  if (!err?.response) return err?.message || "Request failed.";
  const { data, status } = err.response;
  if (typeof data === "string" && data.trim()) return data.trim();
  if (data?.message) return String(data.message);
  if (typeof data?.error === "string") return data.error;
  if (data?.error?.message) return String(data.error.message);
  if (Array.isArray(data?.errors) && data.errors.length) return String(data.errors[0]);
  if (data?.errors && typeof data.errors === "object") {
    const vals = Object.values(data.errors).flat().filter(Boolean);
    if (vals.length) return String(vals[0]);
  }
  return `Server error (${status}). If you run API on another host/port, set BACKEND_URL in .env and restart Next.`;
}

function clarifyStripeAmountError(message, { isKhqr, isStripe }) {
  const m = String(message || "").toLowerCase();
  if (!m.includes("amount_too_small") && !m.includes("amount too small")) return message;

  if (isKhqr) {
    return (
      "The server is opening Stripe Checkout for this KHQR payment. Stripe then rejects the amount " +
      "(amount_too_small under about US$0.50). For ABA/KHQR, the backend must not create a Stripe session—" +
      "only create the order from the cart, return orderId, and let the app call generate-khqr. " +
      "Until that is fixed, a larger cart total may still fail if the code always calls Stripe."
    );
  }
  if (isStripe) {
    return (
      `Card payments need a total of at least US$${STRIPE_MIN_USD.toFixed(2)} (Stripe minimum). ` +
      "Add items or increase quantity."
    );
  }
  return message;
}

/**
 * Smaller body for KHQR: avoids duplicate payment fields / userId (user is in the path)
 * that some Spring endpoints reject or that trigger Stripe-only branches.
 */
function buildKhqrCreateCheckoutPayload({
  name,
  email,
  phone,
  gender,
  deliveryAddress,
  homeNumber,
  streetAddress,
  districtCommune,
  selectedProvince,
  country,
  deliveryLocation,
  deliveryOption,
  totalPrice,
  effectivePaymentId,
  selectedPaymentOption,
}) {
  const fullAddress =
    deliveryAddress.trim() ||
    [homeNumber, streetAddress, districtCommune, selectedProvince, country].filter(Boolean).join(", ");
  const amount = parseFloat(String(totalPrice).replace(/[^0-9.-]/g, "")) || 0;
  const gateway = resolveKhqrGateway(effectivePaymentId, selectedPaymentOption);

  return stripEmptyOptional({
    name,
    fullName: name,
    email,
    phone,
    gender,
    deliveryAddressFull: fullAddress || undefined,
    deliveryStreet: streetAddress || undefined,
    deliveryCity: districtCommune || undefined,
    deliveryProvince: selectedProvince || undefined,
    deliveryMapUrl: deliveryLocation?.mapUrl,
    googleMapLink: deliveryLocation?.mapUrl,
    latitude: deliveryLocation?.lat,
    longitude: deliveryLocation?.lng,
    logisticCompany: deliveryOption,
    deliveryMethod: deliveryOption,
    amount,
    totalAmount: amount,
    currency: "USD",
    gateway,
  });
}

/** Some Spring APIs return 400/500 but still include orderId in the JSON body (order created; Stripe step failed). */
function extractOrderIdFromErrorPayload(data) {
  if (!data || typeof data !== "object") return null;
  const nested = data.data?.data ?? data.data ?? data;
  const id = nested?.orderId ?? nested?.order_id ?? data.orderId ?? data.order_id;
  if (id == null || id === "") return null;
  return String(id).trim();
}

/**
 * Creates the cart order for KHQR via the same endpoint as Stripe; backend should skip Stripe for gateway aba/khqr.
 * If the response is an error but includes orderId, we still proceed to generate-khqr (matches Postman flow).
 */
async function postKhqrOrderCreate(userId, khqrBody) {
  const path = `/payment/create-checkout-session/${userId}`;
  try {
    const sessionRes = await axiosAuth.post(path, khqrBody, { withCredentials: true });
    const orderData = extractResponseData(sessionRes.data);
    const orderIdRaw = orderData?.orderId ?? orderData?.order_id;
    if (orderIdRaw == null) {
      throw new Error("Order response missing orderId.");
    }
    return { sessionRes, orderData, recoveredFromError: false };
  } catch (err) {
    const oid = extractOrderIdFromErrorPayload(err.response?.data);
    if (oid) {
      return {
        sessionRes: null,
        orderData: { orderId: oid },
        recoveredFromError: true,
      };
    }
    throw err;
  }
}

/** Backend `GET /payment/generate-khqr`: `gateway` must be `aba` or `khqr`. */
function resolveKhqrGateway(paymentType, selectedPaymentOption) {
  const raw = String(
    selectedPaymentOption?.bankCode ?? selectedPaymentOption?.raw?.gateway ?? paymentType ?? ""
  ).toLowerCase();
  if (raw === "aba") return "aba";
  if (raw === "khqr") return "khqr";
  if (raw === "acelida" || raw === "acleda") return "khqr";
  return "aba";
}

async function checkKhqrOrderPaid(orderId) {
  try {
    const res = await axiosAuth.get(`/orders/${orderId}`, { withCredentials: true });
    const order = extractResponseData(res.data);
    const status = (order?.orderStatus ?? order?.status ?? "").toString().toUpperCase();
    if (status === "PAID" || status === "SUCCESS") return { paid: true, order };
  } catch (_) { }

  try {
    const res = await fetch(
      `${API_BASE}/payment/verify-success?orderId=${encodeURIComponent(orderId)}`,
      { method: "GET", credentials: "include" }
    );
    if (!res.ok) return { paid: false };
    const data = await res.json().catch(() => ({}));
    const payload = data?.data ?? data;
    const confirmed = payload?.confirmed === true || payload?.alreadyConfirmed === true;
    const order = payload?.order;
    const status = (order?.orderStatus ?? order?.status ?? "").toString().toUpperCase();
    if (confirmed || status === "PAID" || status === "SUCCESS") return { paid: true, order };
  } catch (_) { }

  return { paid: false };
}

export default function DiliveryAndPayment({ onClose, totalPrice, embedded = false }) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const { user } = useAuthContext();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [homeNumber, setHomeNumber] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [districtCommune, setDistrictCommune] = useState("");
  const [country, setCountry] = useState("Cambodia");
  const [deliveryOption, setDeliveryOption] = useState("vet");
  const [purpose, setPurpose] = useState("");
  const [proofOfAddress, setProofOfAddress] = useState(null);
  const [paymentType, setPaymentType] = useState("");
  const [paymentOptions, setPaymentOptions] = useState(() =>
    dedupePaymentOptions(
      FALLBACK_PAYMENT_OPTIONS.map((option, index) => normalizePaymentOption(option, index)).filter(Boolean)
    )
  );
  const [cardNumber, setCardNumber] = useState("");
  const [expDate, setExpDate] = useState("");
  const [amount, setAmount] = useState("");
  const [showCardFields, setShowCardFields] = useState(false);
  const [resetFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [khqrData, setKhqrData] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [khqrPolling, setKhqrPolling] = useState(false);

  const effectivePaymentId =
    paymentType === "acelida" || paymentType === "acleda" ? "khqr" : paymentType;
  const selectedPaymentOption =
    paymentOptions.find((option) => option.id === effectivePaymentId) ?? null;
  const isKhqrGateway = selectedPaymentOption?.isKhqr === true;
  const isStripeCard =
    selectedPaymentOption?.isCard === true || effectivePaymentId === "visa";

  const verifySummary = useMemo(() => {
    const addr =
      deliveryAddress.trim() ||
      [homeNumber, streetAddress, districtCommune, selectedProvince, country].filter(Boolean).join(", ");
    const ship = DELIVERY_OPTIONS.find((d) => d.id === deliveryOption)?.label ?? deliveryOption;
    return {
      contactLine: [name, email, phone].filter(Boolean).join(" · ") || "—",
      addressLine: addr || "—",
      shipping: ship,
      paymentLabel: selectedPaymentOption?.label || effectivePaymentId || "—",
      total: totalPrice,
    };
  }, [
    deliveryAddress,
    homeNumber,
    streetAddress,
    districtCommune,
    selectedProvince,
    country,
    deliveryOption,
    name,
    email,
    phone,
    selectedPaymentOption,
    effectivePaymentId,
    totalPrice,
  ]);

  useEffect(() => {
    const formDataToSave = {
      name,
      email,
      phone,
      gender,
      deliveryAddress,
      deliveryLocation,
      homeNumber,
      streetAddress,
      province: selectedProvince,
      districtCommune,
      country,
      deliveryOption,
      purpose,
      proofOfAddress,
      paymentType,
      paymentOptions,
      cardNumber,
      expDate,
      amount,
      showCardFields,
    };
    localStorage.setItem(DELIVERY_CHECKOUT_STORAGE_KEY, JSON.stringify(formDataToSave));
  }, [
    name,
    email,
    phone,
    gender,
    deliveryAddress,
    deliveryLocation,
    homeNumber,
    streetAddress,
    selectedProvince,
    districtCommune,
    country,
    deliveryOption,
    purpose,
    proofOfAddress,
    paymentType,
    paymentOptions,
    cardNumber,
    expDate,
    amount,
    showCardFields,
  ]);

  useEffect(() => {
    const savedData = localStorage.getItem(DELIVERY_CHECKOUT_STORAGE_KEY);
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setName(data.name || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setGender(data.gender || "");
        setDeliveryAddress(data.deliveryAddress || "");
        setDeliveryLocation(data.deliveryLocation || null);
        setHomeNumber(data.homeNumber || "");
        setStreetAddress(data.streetAddress || "");
        setSelectedProvince(data.province || "");
        setDistrictCommune(data.districtCommune || "");
        setCountry(data.country || "Cambodia");
        setDeliveryOption(data.deliveryOption || "vet");
        setPurpose(data.purpose || "");
        setProofOfAddress(data.proofOfAddress ?? null);
        const loadedPay = data.paymentType || "";
        setPaymentType(
          loadedPay === "acelida" || loadedPay === "acleda" ? "khqr" : loadedPay
        );
        if (Array.isArray(data.paymentOptions) && data.paymentOptions.length) {
          setPaymentOptions(
            dedupePaymentOptions(
              data.paymentOptions.map((option, index) => normalizePaymentOption(option, index)).filter(Boolean)
            )
          );
        }
        setCardNumber(data.cardNumber || "");
        setExpDate(data.expDate || "");
        setAmount(data.amount || "");
        setShowCardFields(!!data.showCardFields);
      } catch (_) { }
    }
  }, []);

  const buildDeliveryBody = () => {
    const fullAddress =
      deliveryAddress.trim() ||
      [homeNumber, streetAddress, districtCommune, selectedProvince, country].filter(Boolean).join(", ");

    return {
      deliveryAddressFull: fullAddress || undefined,
      deliveryStreet: streetAddress || undefined,
      deliveryCity: districtCommune || undefined,
      deliveryProvince: selectedProvince || undefined,
      deliveryPostalCode: undefined,
      deliveryMapUrl: deliveryLocation?.mapUrl || undefined,
      locationUrl: deliveryLocation?.mapUrl || undefined,
      googleMapLink: deliveryLocation?.mapUrl || undefined,
      latitude: deliveryLocation?.lat ?? undefined,
      longitude: deliveryLocation?.lng ?? undefined,
      deliveryOption,
      deliveryMethod: deliveryOption,
      shippingProvider: deliveryOption,
      logisticCompany: deliveryOption,
      paymentType: effectivePaymentId,
      paymentMethod: effectivePaymentId,
      paymentGateway: selectedPaymentOption?.bankCode ?? effectivePaymentId,
      paymentBankId: selectedPaymentOption?.bankId ?? undefined,
    };
  };

  /** Stripe checkout: full delivery + payment hints; user id is only in the URL path. */
  const buildPaymentRequestBody = () => ({
    ...buildDeliveryBody(),
    amount: parseFloat(String(totalPrice).replace(/[^0-9.-]/g, "")) || 0,
    totalAmount: parseFloat(String(totalPrice).replace(/[^0-9.-]/g, "")) || 0,
    currency: "USD",
    gateway: selectedPaymentOption?.bankCode ?? effectivePaymentId,
    bankId: selectedPaymentOption?.bankId ?? undefined,
    bankCode: selectedPaymentOption?.bankCode ?? effectivePaymentId,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!effectivePaymentId) {
      toast.error("Please select a payment method.");
      return;
    }
    if (!deliveryAddress?.trim()) {
      toast.error("Please enter a delivery address.");
      return;
    }
    if (!user?.id) {
      toast.error("Please log in to place an order.");
      return;
    }

    const amountNum = parseFloat(String(totalPrice).replace(/[^0-9.-]/g, "")) || 0;
    if (amountNum <= 0) {
      toast.error("Order total must be greater than zero.");
      return;
    }

    if (isStripeCard && amountNum < STRIPE_MIN_USD) {
      toast.error(
        `Card payments need a total of at least US$${STRIPE_MIN_USD.toFixed(2)} (Stripe minimum). Add more to your bag.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const paymentRequestBody = buildPaymentRequestBody();

      if (isStripeCard) {
        const sessionRes = await axiosAuth.post(
          `/payment/create-checkout-session/${user.id}`,
          paymentRequestBody,
          { withCredentials: true }
        );
        const resData = extractResponseData(sessionRes.data);
        const checkoutUrl =
          resData?.checkoutUrl ?? resData?.checkout_url ?? sessionRes.data?.checkoutUrl;
        if (checkoutUrl && typeof window !== "undefined") {
          window.location.href = checkoutUrl;
          return;
        }
        throw new Error("No checkout URL returned");
      }

      if (isKhqrGateway) {
        const khqrBody = buildKhqrCreateCheckoutPayload({
          name,
          email,
          phone,
          gender,
          deliveryAddress,
          homeNumber,
          streetAddress,
          districtCommune,
          selectedProvince,
          country,
          deliveryLocation,
          deliveryOption,
          totalPrice,
          effectivePaymentId,
          selectedPaymentOption,
        });

        const { orderData } = await postKhqrOrderCreate(user.id, khqrBody);
        const orderIdRaw = orderData?.orderId ?? orderData?.order_id;
        const orderId = orderIdRaw != null ? String(orderIdRaw).trim() : "";
        if (!orderId) throw new Error("Order was not created for KHQR (no orderId in response).");
        const gateway = resolveKhqrGateway(effectivePaymentId, selectedPaymentOption);
        const khqrRes = await axiosAuth.get("/payment/generate-khqr", {
          params: stripEmptyOptional({
            orderId,
            amount: amountNum,
            currency: "USD",
            gateway,
          }),
          withCredentials: true,
        });
        const khqrResData = extractResponseData(khqrRes.data);
        setKhqrData({
          orderId,
          qrImage: khqrResData?.qrImage,
          qrData: khqrResData?.qrData,
          amount: khqrResData?.amount ?? totalPrice,
          currency: khqrResData?.currency ?? "USD",
          merchantName: khqrResData?.merchantName ?? selectedPaymentOption?.merchantName,
          gateway: khqrResData?.gateway ?? gateway,
          paymentId: khqrResData?.paymentId ?? khqrResData?.payment_id,
        });
      }
    } catch (err) {
      const raw = formatCheckoutError(err);
      const msg = clarifyStripeAmountError(raw, { isKhqr: isKhqrGateway, isStripe: isStripeCard });
      if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
        console.error("Checkout error:", err.response?.status, err.response?.data ?? err.message);
      }
      setSubmitError(msg);
      toast.error(msg, { autoClose: isKhqrGateway ? 12000 : 6000 });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!khqrData?.orderId) return undefined;

    const orderId = khqrData.orderId;
    const maxAttempts = 120;
    const intervalMs = 3000;
    let cancelled = false;
    let attempts = 0;
    let intervalId = null;

    setKhqrPolling(true);

    const tick = async () => {
      if (cancelled) return;
      attempts += 1;
      const { paid } = await checkKhqrOrderPaid(orderId);
      if (cancelled) return;
      if (paid) {
        if (intervalId) clearInterval(intervalId);
        intervalId = null;
        setKhqrPolling(false);
        toast.success("Payment successful! Your order is confirmed.", {
          position: "top-center",
          autoClose: 4000,
        });
        void persistCheckoutDetailsAfterPayment(orderId);
        setKhqrData(null);
        onCloseRef.current?.();
        return;
      }
      if (attempts >= maxAttempts) {
        if (intervalId) clearInterval(intervalId);
        intervalId = null;
        setKhqrPolling(false);
        toast.info(
          "Still waiting for bank / PayWay confirmation. You can close this screen—your order will update when payment completes.",
          { position: "top-center", autoClose: 6000 }
        );
      }
    };

    void tick();
    intervalId = setInterval(() => void tick(), intervalMs);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      setKhqrPolling(false);
    };
  }, [khqrData?.orderId]);

  const handleManualKhqrCheck = useCallback(async () => {
    if (!khqrData?.orderId) return;
    setKhqrPolling(true);
    try {
      const { paid } = await checkKhqrOrderPaid(khqrData.orderId);
      if (paid) {
        toast.success("Payment successful! Your order is confirmed.", {
          position: "top-center",
          autoClose: 4000,
        });
        void persistCheckoutDetailsAfterPayment(khqrData.orderId);
        setKhqrData(null);
        onCloseRef.current?.();
      } else {
        toast.info("Not confirmed yet. If you just paid, wait a few seconds for PayWay.", {
          position: "top-center",
          autoClose: 4000,
        });
      }
    } finally {
      setKhqrPolling(false);
    }
  }, [khqrData?.orderId]);

  if (khqrData) {
    const qrSrc = khqrData.qrImage?.startsWith("data:")
      ? khqrData.qrImage
      : khqrData.qrImage
        ? (khqrData.qrImage.startsWith("http") ? khqrData.qrImage : `data:image/png;base64,${khqrData.qrImage}`)
        : null;
    const gw = String(khqrData.gateway || "").toLowerCase();
    const centerBankBadge =
      gw === "khqr" || gw === "acleda" || gw === "acelida"
        ? { src: "/assets/acelida.png", alt: "ACLEDA" }
        : { src: "/assets/ABA.png", alt: "ABA" };
    const cur = String(khqrData.currency || "USD").toUpperCase();
    const amountLabel =
      cur === "KHR" ? `៛ ${khqrData.amount}` : cur === "USD" ? `$ ${khqrData.amount}` : `${khqrData.currency} ${khqrData.amount}`;
    const scanBankHint =
      gw === "khqr" || gw === "acleda" || gw === "acelida"
        ? "Scan with your ACLEDA or another KHQR-compatible banking app."
        : "Scan with your ABA or another KHQR-compatible banking app.";

    return (
      <div className="bg-white flex flex-col h-full">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[#eee] bg-white">
          <h2 className="text-xl font-bold text-[#1a1a1a]">Pay with KHQR</h2>
          {!embedded && (
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#666] hover:bg-[#f5f5f5] hover:text-[#1a1a1a] transition"
              aria-label="Close"
            >
              <span className="text-xl leading-none">×</span>
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col items-center sm:px-6">
          {/* Single EMV QR from API; center badge uses ABA or ACLEDA asset (not generic / Flutter artwork) */}
          <div className="w-full max-w-[320px] overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
            <div className="bg-[#c8102e] px-4 py-3 text-center">
              <span className="text-[15px] font-bold tracking-[0.2em] text-white">KHQR</span>
            </div>
            <div className="px-4 pt-5 text-center">
              <p className="text-base font-semibold text-[#1a1a1a]">
                {khqrData.merchantName || "Merchant"}
              </p>
              <p className="mt-3 text-[28px] font-bold leading-none tabular-nums text-[#1a1a1a]">{amountLabel}</p>
            </div>
            <div className="relative flex justify-center px-4 pb-6 pt-4">
              {qrSrc ? (
                <div className="relative inline-flex">
                  <img
                    src={qrSrc}
                    alt="KHQR code — scan with your banking app"
                    className="h-[240px] w-[240px] max-h-[min(72vw,280px)] max-w-[min(72vw,280px)] object-contain"
                  />
                  <div
                    className="pointer-events-none absolute left-1/2 top-1/2 flex h-[52px] w-[52px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.15)] ring-[3px] ring-white"
                    aria-hidden
                  >
                    <img
                      src={centerBankBadge.src}
                      alt={centerBankBadge.alt}
                      className="h-9 w-9 object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex h-[240px] w-[240px] items-center justify-center bg-[#f5f5f5] text-center text-sm text-[#666]">
                  QR unavailable — try again
                </div>
              )}
            </div>
          </div>

          <p className="mt-5 text-center text-sm text-[#666] max-w-md">
            {scanBankHint} We confirm payment via your bank / PayWay; delivery details are saved to your order after payment succeeds.
          </p>
          <div className="mt-4 flex w-full max-w-[320px] flex-col">
            {khqrPolling && (
              <p className="text-[#eb61a2] text-sm font-medium mb-3 flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-[#eb61a2] border-t-transparent rounded-full animate-spin" />
                Checking payment status…
              </p>
            )}
            <button
              type="button"
              onClick={handleManualKhqrCheck}
              disabled={khqrPolling}
              className="w-full py-3.5 rounded-xl bg-[#eb61a2] text-white font-semibold hover:bg-[#d94d8c] disabled:opacity-60 transition"
            >
              Check payment status now
            </button>
            <button
              type="button"
              onClick={() => {
                setKhqrData(null);
              }}
              className="mt-3 text-[#666] text-sm hover:text-[#1a1a1a]"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white flex flex-col h-full">
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[#eee] bg-white">
        <h2 className="text-xl font-bold text-[#1a1a1a]">Delivery &amp; payment</h2>
        {!embedded && (
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#666] hover:bg-[#f5f5f5] hover:text-[#1a1a1a] transition"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {submitError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {submitError}
          </div>
        )}
        {/* Contact */}
        <section>
          <h3 className="text-base font-semibold text-[#1a1a1a] mb-4">Contact</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className={labelClass}>Full name <span className="text-[#eb61a2]">*</span></label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="email" className={labelClass}>Email <span className="text-[#eb61a2]">*</span></label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <span className={labelClass}>Gender <span className="text-[#eb61a2]">*</span></span>
              <div className="flex gap-6 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={gender === "male"}
                    onChange={(e) => setGender(e.target.value)}
                    required
                    className="w-4 h-4 text-[#eb61a2] focus:ring-[#eb61a2]"
                  />
                  <span className="text-[#374151]">Male</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={gender === "female"}
                    onChange={(e) => setGender(e.target.value)}
                    required
                    className="w-4 h-4 text-[#eb61a2] focus:ring-[#eb61a2]"
                  />
                  <span className="text-[#374151]">Female</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Delivery address */}
        <section>
          <h3 className="text-base font-semibold text-[#1a1a1a] mb-4">Delivery address</h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Delivery option <span className="text-[#eb61a2]">*</span></label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {DELIVERY_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setDeliveryOption(option.id)}
                    className={`rounded-2xl border-4 p-4 text-left transition ${deliveryOption === option.id
                        ? "border-[#eb61a1] bg-[#fff1f6] shadow-[0_8px_24px_rgba(235,97,162,0.12)]"
                        : "border-[#e5e7eb] bg-white hover:border-[#eb61a1]"
                      }`}
                    aria-pressed={deliveryOption === option.id}
                  >
                    <p className="text-sm font-semibold text-[#1f2937]">{option.label}</p>
                    <p className="mt-1 text-xs text-[#6b7280]">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="delivery-address" className={labelClass}>
                Full delivery address <span className="text-[#eb61a2]">*</span>
              </label>
              <AddressInputWithGoogle
                value={deliveryAddress}
                onChange={setDeliveryAddress}
                onLocationChange={setDeliveryLocation}
                required
                placeholder="Search address or select from Google Maps..."
              />
            </div>
            {deliveryLocation?.mapUrl && (
              <div className="rounded-2xl border border-[#f2d4e1] bg-[#fff8fb] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#7c3a57]">Current map link</p>
                    <p className="text-xs text-[#6b7280]">
                      Open the pinned location in Google Maps anytime.
                    </p>
                  </div>
                  <a
                    href={deliveryLocation.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-xl bg-[#1f2937] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#111827]"
                  >
                    Open current map
                  </a>
                </div>
              </div>
            )}
            <p className="text-xs text-[#6b7280]">Or fill in details below (optional)</p>
            <div>
              <label htmlFor="home-number" className={labelClass}>House / Building no.</label>
              <input
                type="text"
                id="home-number"
                name="home-number"
                placeholder="e.g. 123"
                value={homeNumber}
                onChange={(e) => setHomeNumber(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="street-address" className={labelClass}>Street</label>
              <input
                type="text"
                id="street-address"
                name="street-address"
                placeholder="Street, village..."
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="province" className={labelClass}>Province</label>
              <ProvinceSearchSelect
                onProvinceChange={(p) => setSelectedProvince(p)}
                value={selectedProvince}
                onChange={setSelectedProvince}
              />
            </div>
            <div>
              <label htmlFor="district-commune" className={labelClass}>District / Commune</label>
              <input
                type="text"
                id="district-commune"
                name="district-commune"
                placeholder="District, commune"
                value={districtCommune}
                onChange={(e) => setDistrictCommune(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="country" className={labelClass}>Country</label>
              <select
                id="country"
                name="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={inputClass}
              >
                <option value="Cambodia">Cambodia</option>
              </select>
            </div>
            <div>
              <label htmlFor="purpose" className={labelClass}>Purpose (optional)</label>
              <select
                id="purpose"
                name="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className={inputClass}
              >
                <option value="">Select</option>
                <option value="new-address">New address</option>
                <option value="address-update">Address update</option>
                <option value="delivery-address">Delivery address</option>
                <option value="billing-address">Billing address</option>
                <option value="permanent-address">Permanent address</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Proof of address (optional)</label>
              <FileUploadWithRemove onResetFile={resetFile} onFileChange={setProofOfAddress} />
            </div>
          </div>
        </section>

        {/* Payment */}
        <section>
          <h3 className="text-base font-semibold text-[#1a1a1a] mb-4">Payment</h3>
          <div className="mb-4 p-4 bg-[#fdf2f8] rounded-xl border border-[#fbcfe8]">
            <p className="text-sm font-medium text-[#831843]">Total</p>
            <p className="text-xl font-bold text-[#be185d]">${totalPrice}</p>
          </div>
          <div>
            <label className={labelClass}>Pay by <span className="text-[#eb61a2]">*</span></label>
             <div className="flex flex-wrap gap-3 mt-2">
                {paymentOptions.map((opt) => {
                  const isSelected = paymentType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPaymentType(opt.id)}
className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-4 transition-all min-w-[100px] ${
                          isSelected
                            ? "border-[#eb61a1] bg-black ring-2 ring-[#eb61a1]/30 shadow-md"
                            : "border-black bg-black"
                        }`}
                      aria-pressed={isSelected}
                      aria-label={`Pay with ${opt.label}`}
                    >
                      <img
                        src={opt.image}
                        alt={opt.label}
                        className="h-8 w-auto object-contain max-h-10"
                      />
                      <span className="text-xs font-medium text-white">
                        {opt.label}
                      </span>
                    </button>
                  ); 
                })}
             </div>
            {!paymentType && (
              <p className="text-xs text-[#6b7280] mt-1.5">Select a payment method above</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[#ecd7e2] bg-[#fff8fb] px-4 py-4 sm:px-5">
          <h3 className="text-sm font-semibold text-[#7c3a57] mb-3">Verify your details before paying</h3>
          <dl className="space-y-2 text-sm text-[#374151]">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[#9ca3af]">Contact</dt>
              <dd className="mt-0.5 break-words">{verifySummary.contactLine}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[#9ca3af]">Deliver to</dt>
              <dd className="mt-0.5 break-words">{verifySummary.addressLine}</dd>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#9ca3af]">Shipping</dt>
                <dd className="mt-0.5">{verifySummary.shipping}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#9ca3af]">Pay with</dt>
                <dd className="mt-0.5">{verifySummary.paymentLabel}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#9ca3af]">Total</dt>
                <dd className="mt-0.5 font-semibold text-[#be185d]">${verifySummary.total}</dd>
              </div>
            </div>
          </dl>
          <p className="mt-3 text-xs text-[#6b7280]">
            Your entries are saved in this browser until payment completes. Adjust any field above if something looks wrong.
          </p>
        </section>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 rounded-xl bg-[#eb61a2] text-white font-semibold hover:bg-[#d94d8c] focus:ring-2 focus:ring-[#eb61a2]/50 transition shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Creating order…" : "Place order"}
        </button>
      </form>
    </div>
  );
}
