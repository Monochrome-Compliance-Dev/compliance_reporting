let loadPromise = null;

export const loadGoogleMapsApi = () => {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (window.google && window.google.maps && window.google.maps.places) {
      resolve();
      return;
    }

    const scriptId = "google-maps-script";
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      if (existingScript.getAttribute("data-loaded") === "true") {
        resolve();
      } else {
        existingScript.addEventListener("load", resolve);
      }
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_API_KEY}&libraries=places&v=beta&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.setAttribute("data-loaded", "true");
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return loadPromise;
};
