async function initMap() {
  // Request needed libraries.
  await google.maps.importLibrary("places");
  // Create the input HTML element, and append it.
  //@ts-ignore
  const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement();
  //@ts-ignore
  document.body.appendChild(placeAutocomplete);
  // Inject HTML UI.
  const selectedPlaceTitle = document.createElement("p");
  selectedPlaceTitle.textContent = "";
  document.body.appendChild(selectedPlaceTitle);
  const selectedPlaceInfo = document.createElement("pre");
  selectedPlaceInfo.textContent = "";
  document.body.appendChild(selectedPlaceInfo);
  // Add the gmp-placeselect listener, and display the results.
  //@ts-ignore
  placeAutocomplete.addEventListener(
    "gmp-select",
    async ({ placePrediction }) => {
      const place = placePrediction.toPlace();
      await place.fetchFields({
        fields: ["displayName", "formattedAddress", "location"],
      });
      selectedPlaceTitle.textContent = "Selected Place:";
      selectedPlaceInfo.textContent = JSON.stringify(
        place.toJSON(),
        /* replacer */ null,
        /* space */ 2
      );
    }
  );
}
initMap();
