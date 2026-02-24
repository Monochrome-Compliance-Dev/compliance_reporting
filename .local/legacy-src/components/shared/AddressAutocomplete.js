import { useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { FormHelperText, InputLabel, Box } from "@mui/material";

export default function AddressAutocomplete() {
  const {
    setValue,
    formState: { errors },
    watch,
  } = useFormContext();
  const autocompleteRef = useRef(null);

  // Set up Google Autocomplete and handle place selection
  useEffect(() => {
    const el = autocompleteRef.current;
    if (!el) return;

    el.componentRestrictions = { country: ["au"] };

    const handler = (event) => {
      const place = event.detail;
      if (!place || !place.address) return;
      const getComponent = (type) =>
        place.address.find((c) => c.type === type)?.longText || "";

      setValue(
        "addressline1",
        [getComponent("street_number"), getComponent("route")]
          .filter(Boolean)
          .join(" ")
      );
      setValue(
        "city",
        getComponent("locality") || getComponent("postal_town") || ""
      );
      setValue("state", getComponent("administrative_area_level_1") || "");
      setValue("postcode", getComponent("postal_code") || "");
      setValue("country", getComponent("country") || "Australia");
    };

    el.addEventListener("gmpx-placechange", handler);
    return () => el.removeEventListener("gmpx-placechange", handler);
  }, [setValue]);

  // Keep the autocomplete input in sync with react-hook-form value
  useEffect(() => {
    const el = autocompleteRef.current;
    if (!el) return;
    // Subscribe to changes in addressline1 using watch's callback
    const subscription = watch((values, { name }) => {
      if (name === "addressline1" && el.value !== values.addressline1) {
        el.value = values.addressline1 || "";
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  return (
    <Box sx={{ mb: 1 }}>
      <InputLabel shrink htmlFor="addressline1-autocomplete">
        Address Line 1
      </InputLabel>
      <gmpx-place-autocomplete
        ref={autocompleteRef}
        id="addressline1-autocomplete"
        placeholder="Start typing address..."
        style={{ width: "100%" }}
        visible="true"
      ></gmpx-place-autocomplete>
      {errors.addressline1 && (
        <FormHelperText error>{errors.addressline1.message}</FormHelperText>
      )}
    </Box>
  );
}
