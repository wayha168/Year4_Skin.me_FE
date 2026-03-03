"use client";

import React, { useEffect, useRef, useState } from "react";

const inputClass =
  "w-full px-4 py-3 border border-[#e5e7eb] rounded-xl text-[#1a1a1a] placeholder-[#9ca3af] focus:ring-2 focus:ring-[#eb61a2]/40 focus:border-[#eb61a2] outline-none transition min-h-[80px]";

const DEFAULT_CENTER = { lat: 11.5564, lng: 104.9282 }; // Phnom Penh
const DEFAULT_ZOOM = 14;

export default function AddressInputWithGoogle({ value, onChange, required, placeholder }) {
  const inputRef = useRef(null);
  const mapContainerRef = useRef(null);
  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const apiKey = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY : null;
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!apiKey || scriptLoaded) return;
    if (window.google?.maps?.places) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);
    return () => {};
  }, [apiKey, scriptLoaded]);

  useEffect(() => {
    if (!scriptLoaded || !mapContainerRef.current || !window.google?.maps || mapRef.current) return;
    const { Map } = window.google.maps;
    const map = new Map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });
    mapRef.current = map;

    map.addListener("click", (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      if (markerRef.current) markerRef.current.setMap(null);
      const { Marker } = window.google.maps;
      markerRef.current = new Marker({ position: e.latLng, map });
      reverseGeocode(lat, lng);
    });

    setMapReady(true);
    return () => {
      if (markerRef.current) markerRef.current.setMap(null);
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [scriptLoaded]);

  const reverseGeocode = (lat, lng, onDone) => {
    if (!window.google?.maps) {
      if (onDone) onDone();
      return;
    }
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      const setAddr = onChangeRef.current;
      if (setAddr) {
        if (status === "OK" && results?.[0]) {
          setAddr(results[0].formatted_address);
        } else {
          setAddr(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
      }
      if (onDone) onDone();
    });
  };

  const moveMapTo = (lat, lng, addMarker = true) => {
    if (!mapRef.current || !window.google?.maps) return;
    const position = { lat: Number(lat), lng: Number(lng) };
    mapRef.current.setCenter(position);
    mapRef.current.setZoom(16);
    if (addMarker) {
      if (markerRef.current) markerRef.current.setMap(null);
      const { Marker } = window.google.maps;
      markerRef.current = new Marker({ position, map: mapRef.current });
    }
  };

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
      const loc = place?.geometry?.location;
      if (loc && mapRef.current) moveMapTo(loc.lat(), loc.lng(), true);
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
      const setAddr = onChangeRef.current;
      if (setAddr) setAddr("Location not supported by this browser");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        moveMapTo(latitude, longitude, true);
        if (window.google?.maps) {
          reverseGeocode(latitude, longitude, () => setLocationLoading(false));
        } else {
          const setAddr = onChangeRef.current;
          if (setAddr) setAddr(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          setLocationLoading(false);
        }
      },
      (err) => {
        setLocationLoading(false);
        const setAddr = onChangeRef.current;
        if (!setAddr) return;
        if (err.code === 1) setAddr("Location permission denied");
        else if (err.code === 2) setAddr("Location unavailable");
        else if (err.code === 3) setAddr("Location request timed out");
        else setAddr("");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id="delivery-address"
          name="delivery-address"
          required={required}
          placeholder={placeholder || "Search address or click on map..."}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={inputClass}
          autoComplete="off"
        />
      </div>

      {apiKey && (
        <>
          <div className="flex flex-wrap gap-2 items-center">
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
            <span className="text-xs text-[#6b7280]">Type to search or click on the map to set address</span>
          </div>

          {scriptLoaded && (
            <div className="relative rounded-xl overflow-hidden border border-[#e5e7eb] bg-[#f5f5f7]">
              <div
                ref={mapContainerRef}
                className="w-full h-[280px] min-h-[200px]"
                aria-label="Map to select delivery address"
              />
              {!mapReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#f5f5f7] rounded-xl">
                  <span className="w-8 h-8 border-2 border-[#eb61a2] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
