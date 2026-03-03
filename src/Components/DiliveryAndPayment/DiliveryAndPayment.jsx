"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import axiosAuth from "../../app/lib/api/axiosConfig";
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
        className={`absolute z-20 w-full mt-1 bg-white border border-[#e5e7eb] rounded-xl shadow-lg overflow-hidden transition-all duration-200 ${
          isOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
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

const KHQR_GATEWAYS = ["aba", "wing", "acelida"];

export default function DiliveryAndPayment({ onClose, totalPrice, embedded = false }) {
  const { user } = useAuthContext();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [homeNumber, setHomeNumber] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [districtCommune, setDistrictCommune] = useState("");
  const [country, setCountry] = useState("Cambodia");
  const [purpose, setPurpose] = useState("");
  const [proofOfAddress, setProofOfAddress] = useState(null);
  const [paymentType, setPaymentType] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expDate, setExpDate] = useState("");
  const [amount, setAmount] = useState("");
  const [showCardFields, setShowCardFields] = useState(false);
  const [resetFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [khqrData, setKhqrData] = useState(null);
  const [submitError, setSubmitError] = useState("");

  const isKhqrGateway = KHQR_GATEWAYS.includes(paymentType);
  const showQrCode = isKhqrGateway;

  useEffect(() => {
    const formDataToSave = {
      name,
      email,
      phone,
      gender,
      deliveryAddress,
      homeNumber,
      streetAddress,
      province: selectedProvince,
      districtCommune,
      country,
      purpose,
      proofOfAddress,
      paymentType,
      cardNumber,
      expDate,
      amount,
      showCardFields,
    };
    localStorage.setItem("deliveryPaymentForm", JSON.stringify(formDataToSave));
  }, [
    name,
    email,
    phone,
    gender,
    deliveryAddress,
    homeNumber,
    streetAddress,
    selectedProvince,
    districtCommune,
    country,
    purpose,
    proofOfAddress,
    paymentType,
    cardNumber,
    expDate,
    amount,
    showCardFields,
  ]);

  useEffect(() => {
    const savedData = localStorage.getItem("deliveryPaymentForm");
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setName(data.name || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setGender(data.gender || "");
        setDeliveryAddress(data.deliveryAddress || "");
        setHomeNumber(data.homeNumber || "");
        setStreetAddress(data.streetAddress || "");
        setSelectedProvince(data.province || "");
        setDistrictCommune(data.districtCommune || "");
        setCountry(data.country || "Cambodia");
        setPurpose(data.purpose || "");
        setProofOfAddress(data.proofOfAddress ?? null);
        setPaymentType(data.paymentType || "");
        setCardNumber(data.cardNumber || "");
        setExpDate(data.expDate || "");
        setAmount(data.amount || "");
        setShowCardFields(!!data.showCardFields);
      } catch (_) {}
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
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (isKhqrGateway) {
      if (!user?.id) {
        toast.error("Please log in to place an order.");
        return;
      }
      setSubmitting(true);
      try {
        const deliveryBody = buildDeliveryBody();
        const sessionRes = await axiosAuth.post(
          `/payment/create-checkout-session/${user.id}`,
          deliveryBody,
          { withCredentials: true }
        );
        const resData = sessionRes.data?.data ?? sessionRes.data;
        const orderId = resData?.orderId ?? resData?.order_id;
        if (!orderId) {
          throw new Error("Order was not created");
        }
        const amountNum = parseFloat(String(totalPrice).replace(/[^0-9.-]/g, "")) || 0;
        const khqrRes = await axiosAuth.get("/payment/generate-khqr", {
          params: { orderId, amount: amountNum, currency: "USD", gateway: paymentType },
          withCredentials: true,
        });
        const khqrResData = khqrRes.data?.data ?? khqrRes.data;
        setKhqrData({
          orderId,
          qrImage: khqrResData?.qrImage,
          qrData: khqrResData?.qrData,
          amount: khqrResData?.amount ?? totalPrice,
          currency: khqrResData?.currency ?? "USD",
          merchantName: khqrResData?.merchantName,
          gateway: khqrResData?.gateway ?? paymentType,
        });
      } catch (err) {
        const msg = err.response?.data?.message ?? err.message ?? "Failed to create order or generate QR.";
        setSubmitError(msg);
        toast.error(msg);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (showCardFields) {
      console.log("Card payment (Stripe flow can be wired here)", {
        totalPrice,
        ...buildDeliveryBody(),
      });
      toast.info("Card payment: redirect to Stripe or use Payment Element.");
      return;
    }

    const fullAddress =
      deliveryAddress.trim() ||
      [homeNumber, streetAddress, districtCommune, selectedProvince, country].filter(Boolean).join(", ");
    console.log("Form Submitted:", { deliveryAddress: fullAddress, totalPrice });
    toast.success("Order received. Complete payment to confirm.");
    onClose();
  };

  const handleVerifyKhqr = async () => {
    if (!khqrData?.orderId) return;
    setVerifyLoading(true);
    try {
      await axiosAuth.post(`/payment/verify-khqr/${khqrData.orderId}`, {}, { withCredentials: true });
      toast.success("Payment verification submitted. Your order is being processed.", {
        position: "top-center",
        autoClose: 3000,
      });
      setKhqrData(null);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message ?? err.message ?? "Verification failed.";
      toast.error(msg);
    } finally {
      setVerifyLoading(false);
    }
  };

  if (khqrData) {
    const qrSrc = khqrData.qrImage?.startsWith("data:")
      ? khqrData.qrImage
      : khqrData.qrImage
        ? (khqrData.qrImage.startsWith("http") ? khqrData.qrImage : `data:image/png;base64,${khqrData.qrImage}`)
        : null;
    return (
      <div className="bg-white flex flex-col h-full">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[#eee] bg-white">
          <h2 className="text-xl font-bold text-[#1a1a1a]">Pay with {khqrData.gateway?.toUpperCase() || "KHQR"}</h2>
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
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col items-center">
          {khqrData.merchantName && (
            <p className="text-[#666] text-sm mb-2">{khqrData.merchantName}</p>
          )}
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-4 mb-4">
            {qrSrc ? (
              <img src={qrSrc} alt="KHQR payment code" className="w-56 h-56 object-contain" />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center bg-[#f5f5f5] rounded-xl text-[#666] text-sm">
                Scan with ABA / KHQR app
              </div>
            )}
          </div>
          <p className="text-xl font-bold text-[#eb61a2] mb-1">
            {khqrData.currency} {khqrData.amount}
          </p>
          <p className="text-[#666] text-sm mb-6">Scan the QR code with your banking app to pay.</p>
          <button
            type="button"
            onClick={handleVerifyKhqr}
            disabled={verifyLoading}
            className="w-full py-3.5 rounded-xl bg-[#eb61a2] text-white font-semibold hover:bg-[#d94d8c] disabled:opacity-60 transition"
          >
            {verifyLoading ? "Submitting…" : "I've paid"}
          </button>
          <button
            type="button"
            onClick={() => setKhqrData(null)}
            className="mt-3 text-[#666] text-sm hover:text-[#1a1a1a]"
          >
            ← Back
          </button>
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
              <label htmlFor="delivery-address" className={labelClass}>
                Full delivery address <span className="text-[#eb61a2]">*</span>
              </label>
              <AddressInputWithGoogle
                value={deliveryAddress}
                onChange={setDeliveryAddress}
                required
                placeholder="Search address or select from Google Maps..."
              />
            </div>
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
          <div className="space-y-4">
            <div>
              <label htmlFor="card_type" className={labelClass}>Pay by QR <span className="text-[#eb61a2]">*</span></label>
              <select
                id="card_type"
                name="card_type"
                required
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className={inputClass}
              >
                <option value="" disabled hidden>Select method</option>
                <option value="aba">ABA</option>
                <option value="acelida">ACELIDA</option>
                <option value="wing">WING</option>
              </select>
            </div>
            {showQrCode && (
              <div className="flex justify-center my-4">
                <img src={QrCode} alt="QR Code for payment" className="w-48 h-56 object-contain" />
              </div>
            )}
            <div
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={() => setShowCardFields(!showCardFields)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setShowCardFields(!showCardFields)}
            >
              <span className={labelClass + " mb-0"}>Or pay by card</span>
              <span className={`text-[#eb61a2] transition-transform ${showCardFields ? "rotate-90" : "-rotate-90"}`}>▶</span>
            </div>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                showCardFields ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="space-y-4 pt-2">
                <div>
                  <label htmlFor="card_number" className={labelClass}>Card number</label>
                  <input
                    type="text"
                    id="card_number"
                    name="card_number"
                    required={showCardFields}
                    pattern="[0-9\s]{15,23}"
                    maxLength={23}
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\s/g, "");
                      const chunks = raw.match(/.{1,4}/g);
                      setCardNumber(chunks ? chunks.join(" ") : "");
                    }}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="exp_date" className={labelClass}>Expiry</label>
                  <input
                    type="month"
                    id="exp_date"
                    name="exp_date"
                    required={showCardFields}
                    min="2025-01"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="relative">
                  <label htmlFor="amount" className={labelClass}>Amount</label>
                  <input
                    type="text"
                    id="amount"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
                    required={showCardFields}
                    className={`${inputClass} pl-8`}
                  />
                  <span className="absolute left-4 top-[2.6rem] text-[#6b7280]">$</span>
                </div>
              </div>
            </div>
          </div>
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
