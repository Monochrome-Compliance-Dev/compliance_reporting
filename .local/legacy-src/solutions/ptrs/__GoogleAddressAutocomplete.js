import { useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { useTheme } from "@mui/material/styles";
// import "./GoogleAddressStyling.css";

const stateNameToCode = {
  "Australian Capital Territory": "ACT",
  "Northern Territory": "NT",
  "New South Wales": "NSW",
  Queensland: "QLD",
  "South Australia": "SA",
  Tasmania: "TAS",
  Victoria: "VIC",
  "Western Australia": "WA",
};
const getStateCode = (name) => stateNameToCode[name] || "";

let googleMapsApiPromise = null;
function loadGoogleMapsApi() {
  if (googleMapsApiPromise) {
    return googleMapsApiPromise;
  }

  googleMapsApiPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Window is undefined"));
      return;
    }
    if (window.google && window.google.maps && window.google.maps.places) {
      resolve(window.google);
      return;
    }

    const existingScript = document.querySelector(
      'script[src^="https://maps.googleapis.com/maps/api/js"]'
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.google && window.google.maps && window.google.maps.places) {
          resolve(window.google);
        } else {
          reject(
            new Error(
              "Google Maps API loaded but places library is not available"
            )
          );
        }
      });
      existingScript.addEventListener("error", (error) => {
        reject(error);
      });
      return;
    }

    const script = document.createElement("script");
    const apiKey = process.env.REACT_APP_GOOGLE_API_KEY || "";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        resolve(window.google);
      } else {
        reject(
          new Error(
            "Google Maps API loaded but places library is not available"
          )
        );
      }
    };
    script.onerror = (error) => {
      reject(error);
    };

    document.head.appendChild(script);
  });

  return googleMapsApiPromise;
}

export default function GoogleAddressAutocomplete() {
  const { setValue } = useFormContext();
  const containerRef = useRef(null);
  const placeAutocompleteRef = useRef(null);
  const theme = useTheme();

  useEffect(() => {
    let placeAutocomplete;
    const container = containerRef.current;

    loadGoogleMapsApi()
      .then(() => {
        if (typeof window !== "undefined" && window.google && container) {
          if (!placeAutocompleteRef.current) {
            placeAutocomplete =
              new window.google.maps.places.PlaceAutocompleteElement();
            container.appendChild(placeAutocomplete);
            placeAutocompleteRef.current = placeAutocomplete;

            // Try to resize the internal input using the element's width/height properties
            placeAutocomplete.style.width = "100%";
            placeAutocomplete.style.minHeight = "56px"; // match MUI TextField height

            placeAutocomplete.addEventListener(
              "gmp-select",
              async ({ placePrediction }) => {
                const place = placePrediction.toPlace();
                await place.fetchFields({
                  fields: [
                    "displayName",
                    "formattedAddress",
                    "addressComponents",
                  ],
                });
                const placeData = place.toJSON();

                // Update form fields
                setValue("googleAddress", placeData.formattedAddress || "");
                const components = placeData.addressComponents || [];
                const get = (type) =>
                  components.find((c) => c.types.includes(type))?.longText ||
                  "";
                const getShort = (type) =>
                  components.find((c) => c.types.includes(type))?.shortText ||
                  "";

                const streetNumber = get("street_number");
                const route = get("route");
                let addressline1 = "";
                if (streetNumber && route) {
                  addressline1 = `${streetNumber} ${route}`;
                } else if (route) {
                  addressline1 = route;
                } else if (streetNumber) {
                  addressline1 = streetNumber;
                }
                setValue("addressline1", addressline1);

                const subpremise = get("subpremise");
                setValue("addressline2", subpremise);

                const premise = get("premise");
                const floor = get("floor");
                let addressline3 = "";
                if (floor && premise) {
                  addressline3 = `${floor}, ${premise}`;
                } else if (premise) {
                  addressline3 = premise;
                } else if (floor) {
                  addressline3 = floor;
                }
                setValue("addressline3", addressline3);

                setValue("city", get("locality"));
                const stateName = get("administrative_area_level_1");
                const stateCode =
                  getStateCode(stateName) ||
                  getShort("administrative_area_level_1");
                setValue("state", stateCode);
                setValue("postcode", get("postal_code"));
                setValue("country", get("country"));
              }
            );
          }
        }
      })
      .catch((error) => {
        console.error("Failed to load Google Maps API:", error);
      });

    // Cleanup function to remove script if needed
    return () => {
      const script = document.querySelector(
        'script[src^="https://maps.googleapis.com/maps/api/js"]'
      );
      if (script) {
        script.remove();
        googleMapsApiPromise = null;
      }
      if (
        placeAutocompleteRef.current &&
        placeAutocompleteRef.current._observer
      ) {
        placeAutocompleteRef.current._observer.disconnect();
      }
      if (placeAutocompleteRef.current && container) {
        container.removeChild(placeAutocompleteRef.current);
        placeAutocompleteRef.current = null;
      }
    };
  }, [setValue]);

  return (
    <div style={{ marginBottom: "1rem" }}>
      <label
        htmlFor="autocomplete-container"
        style={{
          display: "block",
          marginBottom: "6px",
          fontWeight: 400,
          fontSize: "1rem",
          lineHeight: "1.4375em",
          padding: "0 8px",
          color: theme.palette.text.primary,
          fontFamily: theme.typography.fontFamily,
          letterSpacing: "0.01em",
        }}
      >
        Address Lookup
      </label>
      <div
        id="autocomplete-container"
        className="widget-container"
        ref={containerRef}
        style={{
          width: "100%",
          borderRadius: "8px",
          border: `1px solid ${theme.palette.mode === "dark" ? "#818181" : "#818181"}`,
          background: theme.palette.mode === "dark" ? "#5b5b5b" : "#fff",
          color: theme.palette.mode === "dark" ? "#fff" : "#000",
          display: "block",
          fontSize: "1rem",
          height: "1.4375em",
          padding: "16.5px 14px",
          boxSizing: "content-box",
          transition: "background 0.2s, color 0.2s",
        }}
      />
    </div>
  );
}
