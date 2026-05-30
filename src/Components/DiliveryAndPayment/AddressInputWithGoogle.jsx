"use client";

import React, { useEffect, useRef, useState } from "react";

const inputClass =
  "w-full rounded-xl border border-[#e5e7eb] px-4 py-3 text-[#1a1a1a] placeholder-[#9ca3af] outline-none transition focus:border-[#eb61a2] focus:ring-2 focus:ring-[#eb61a2]/40 min-h-[80px]";

const pacHostClass = `${inputClass} flex items-stretch [&_gmp-place-autocomplete]:block [&_gmp-place-autocomplete]:min-h-[56px] [&_gmp-place-autocomplete]:w-full`;

const DEFAULT_CENTER = { lat: 11.5564, lng: 104.9282 };
const DEFAULT_ZOOM = 14;

const CAMBODIA_BIAS = { south: 9.5, west: 102.0, north: 14.8, east: 108.0 };

const buildMapUrl = (lat, lng) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;

function readLatLng(place) {
  const loc = place?.location;
  if (!loc) return null;
  if (typeof loc.lat === "function") return { lat: loc.lat(), lng: loc.lng() };
  const lat = loc.lat;
  const lng = loc.lng;
  if (typeof lat === "number" && typeof lng === "number") return { lat, lng };
  return null;
}

export default function AddressInputWithGoogle({
  value,
  onChange,
  onLocationChange,
  required,
  placeholder,
}) {
  const inputRef = useRef(null);
  const pacHostRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const onLocationChangeRef = useRef(onLocationChange);
  const pacCleanupRef = useRef(null);
  const placeSelectBusyRef = useRef(false);

  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [usePlainInput, setUsePlainInput] = useState(false);

  const apiKey = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY : null;

  onChangeRef.current = onChange;
  onLocationChangeRef.current = onLocationChange;

  const commitLocation = ({ lat, lng, address = "" }) => {
    const nextLocation = {
      lat: Number(lat),
      lng: Number(lng),
      address: address || value || "",
      mapUrl: buildMapUrl(lat, lng),
    };

    setSelectedLocation(nextLocation);
    onLocationChangeRef.current?.(nextLocation);
  };

   useEffect(() => {
     if (!apiKey) return;
     if (window.google?.maps) {
       setScriptLoaded(true);
       return;
     }
     // Prevent duplicate script injection
     const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
     if (existingScript) {
       existingScript.onload = () => setScriptLoaded(true);
       return;
     }
     const script = document.createElement("script");
     const cbName = "skinmeGoogleMapsCallback";
     // Only define the callback if it doesn't exist
     if (typeof window[cbName] !== "function") {
       window[cbName] = () => {
         setScriptLoaded(true);
       };
     }
     script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
       apiKey
     )}&callback=${cbName}`;
     script.async = true;
     script.defer = true;
     document.head.appendChild(script);
   }, [apiKey]);

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

    map.addListener("click", (event) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      if (markerRef.current) markerRef.current.setMap(null);
      const { Marker } = window.google.maps;
      markerRef.current = new Marker({ position: event.latLng, map });
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
      const fallbackAddress = `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`;
      onChangeRef.current?.(fallbackAddress);
      commitLocation({ lat, lng, address: fallbackAddress });
      onDone?.();
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      const nextAddress =
        status === "OK" && results?.[0]
          ? results[0].formatted_address
          : `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`;

      onChangeRef.current?.(nextAddress);
      commitLocation({ lat, lng, address: nextAddress });
      onDone?.();
    });
  };

  const moveMapTo = (lat, lng, addMarker = true, address = "") => {
    if (!mapRef.current || !window.google?.maps) return;

    const position = { lat: Number(lat), lng: Number(lng) };
    mapRef.current.setCenter(position);
    mapRef.current.setZoom(16);

    if (addMarker) {
      if (markerRef.current) markerRef.current.setMap(null);
      const { Marker } = window.google.maps;
      markerRef.current = new Marker({ position, map: mapRef.current });
    }

    commitLocation({ lat, lng, address });
  };

  useEffect(() => {
    if (!scriptLoaded || !apiKey || usePlainInput || !pacHostRef.current) return;

    let cancelled = false;

    pacCleanupRef.current?.();
    pacCleanupRef.current = null;
    pacHostRef.current.replaceChildren();

    const attachPlain = () => setUsePlainInput(true);

     (async () => {
       try {
         const { PlacesLibrary } = await window.google.maps.importLibrary("places");
         if (cancelled || !pacHostRef.current) return;

         const Ctor = PlacesLibrary.PlaceAutocompleteElement;
         if (!Ctor) {
           attachPlain();
           return;
         }

        const pac = new Ctor({
          includedRegionCodes: ["kh"],
        });
        pac.locationBias = CAMBODIA_BIAS;
        if (placeholder) {
          pac.setAttribute("placeholder", placeholder);
        }

        pac.id = "delivery-address";
        pacHostRef.current.appendChild(pac);

        const handleSelect = async (event) => {
          if (placeSelectBusyRef.current) return;
          const pred =
            event.placePrediction ||
            (event.detail && event.detail.placePrediction) ||
            event.target?.placePrediction;

          if (!pred || typeof pred.toPlace !== "function") return;

          placeSelectBusyRef.current = true;
          try {
            const place = pred.toPlace();
            await place.fetchFields({
              fields: ["formattedAddress", "location", "displayName"],
            });

            const address = place.formattedAddress || place.displayName || "";
            const coords = readLatLng(place);

            if (address) onChangeRef.current?.(address);
            if (coords && mapRef.current) {
              moveMapTo(coords.lat, coords.lng, true, address);
            } else if (address) {
              commitLocation({
                lat: DEFAULT_CENTER.lat,
                lng: DEFAULT_CENTER.lng,
                address,
              });
            }
          } catch (_) {
            /* selection fetch failed — map / manual entry still work */
          } finally {
            placeSelectBusyRef.current = false;
          }
        };

        pac.addEventListener("gmp-select", handleSelect);
        pac.addEventListener("gmp-placeselect", handleSelect);
        pacCleanupRef.current = () => {
          pac.removeEventListener("gmp-select", handleSelect);
          pac.removeEventListener("gmp-placeselect", handleSelect);
        };
      } catch (_) {
        attachPlain();
      }
    })();

    return () => {
      cancelled = true;
      pacCleanupRef.current?.();
      pacCleanupRef.current = null;
      if (pacHostRef.current) pacHostRef.current.replaceChildren();
    };
  }, [scriptLoaded, apiKey, usePlainInput, placeholder]);

  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      onChangeRef.current?.("Location not supported by this browser");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        moveMapTo(latitude, longitude, true);

        if (window.google?.maps) {
          reverseGeocode(latitude, longitude, () => setLocationLoading(false));
          return;
        }

        const fallbackAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        onChangeRef.current?.(fallbackAddress);
        commitLocation({ lat: latitude, lng: longitude, address: fallbackAddress });
        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);
        if (error.code === 1) onChangeRef.current?.("Location permission denied");
        else if (error.code === 2) onChangeRef.current?.("Location unavailable");
        else if (error.code === 3) onChangeRef.current?.("Location request timed out");
        else onChangeRef.current?.("");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        {usePlainInput ? (
          <input
            ref={inputRef}
            type="text"
            id="delivery-address"
            name="delivery-address"
            required={required}
            placeholder={placeholder || "Search address or click on map..."}
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            className={inputClass}
            autoComplete="off"
          />
        ) : (
          <div ref={pacHostRef} className={pacHostClass} aria-label="Address search" />
        )}
      </div>

      {apiKey && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={locationLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-[#f2c9db] bg-[#fff6fa] px-4 py-2 text-sm font-medium text-[#8e2e61] transition hover:bg-[#ffeef5] disabled:opacity-60"
            >
              {locationLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#eb61a2] border-t-transparent" />
                  Getting location...
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4 text-[#eb61a2]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Use current location
                </>
              )}
            </button>
            <span className="text-xs text-[#6b7280]">Search, tap the map, or use your current location.</span>
          </div>

          {selectedLocation && (
            <div className="rounded-2xl border border-[#f2d4e1] bg-[linear-gradient(135deg,#fff8fb_0%,#fff2ea_100%)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#7c3a57]">Selected map location</p>
                  <p className="text-sm text-[#374151]">{selectedLocation.address || "Pinned location"}</p>
                  <p className="text-xs text-[#6b7280]">
                    {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </p>
                </div>
                <a
                  href={selectedLocation.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#eb61a2] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#d94d8c]"
                >
                  Open map
                </a>
              </div>
            </div>
          )}

          {scriptLoaded && (
            <div className="relative overflow-hidden rounded-2xl border border-[#ead2dd] bg-[#f5f5f7]">
              <div
                ref={mapContainerRef}
                className="h-[300px] min-h-[220px] w-full"
                aria-label="Map to select delivery address"
              />
              {!mapReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#f5f5f7]">
                  <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#eb61a2] border-t-transparent" />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
