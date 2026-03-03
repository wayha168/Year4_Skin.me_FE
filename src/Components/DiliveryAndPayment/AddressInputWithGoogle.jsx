"use client";

import React, { useEffect, useRef, useState } from "react";

const inputClass =
  "w-full px-4 py-3 border border-[#e5e7eb] rounded-xl text-[#1a1a1a] placeholder-[#9ca3af] focus:ring-2 focus:ring-[#eb61a2]/40 focus:border-[#eb61a2] outline-none transition min-h-[80px]";

export default function AddressInputWithGoogle({ value, onChange, required, placeholder }) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const apiKey = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY : null;

  useEffect(() => {
    if (!apiKey || scriptLoaded) return;
    if (window.google?.maps?.places) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);
    return () => {};
  }, [apiKey, scriptLoaded]);

  useEffect(() => {
    if (!scriptLoaded || !inputRef.current || !window.google?.maps?.places) return;
    if (autocompleteRef.current) return;
    const Autocomplete = window.google.maps.places.Autocomplete;
    const autocomplete = new Autocomplete(inputRef.current, {
      types: ["address"],
      fields: ["formatted_address", "address_components", "geometry"],
    });
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const addr = place?.formatted_address || "";
      if (addr && onChange) onChange(addr);
    });
    autocompleteRef.current = autocomplete;
    return () => {
      if (window.google?.maps?.event && autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      autocompleteRef.current = null;
    };
  }, [scriptLoaded, onChange]);

  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      if (onChange) onChange("Geolocation not supported");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!key) {
          if (onChange) onChange(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          setLocationLoading(false);
          return;
        }
        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${key}`
          );
          const data = await res.json();
          const addr = data?.results?.[0]?.formatted_address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          if (onChange) onChange(addr);
        } catch (_) {
          if (onChange) onChange(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
        if (onChange) onChange("");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id="delivery-address"
          name="delivery-address"
          required={required}
          placeholder={placeholder || "Search address or select on map..."}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={inputClass}
          autoComplete="off"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {apiKey && (
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={locationLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#e5e7eb] bg-white text-[#374151] text-sm font-medium hover:bg-[#f9fafb] disabled:opacity-60 transition"
          >
            {locationLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-[#eb61a2] border-t-transparent rounded-full animate-spin" />
                Getting location...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-[#eb61a2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Use current location
              </>
            )}
          </button>
        )}
        {apiKey && (
          <span className="text-xs text-[#6b7280] self-center">Or type to search with Google Maps</span>
        )}
      </div>
    </div>
  );
}
