// Lightweight helper to render Chart.js charts off-screen and return a PNG dataURL.
// Safe in SSR (returns null if window/document not available or Chart.js not loaded).

export async function chartToPng(config, width = 800, height = 240) {
  if (typeof window === "undefined" || typeof document === "undefined")
    return null;
  // Chart.js must be present (bundled as dependency). If not, no-op.
  const Chart = window.Chart || (await maybeImportChart());
  if (!Chart) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Ensure deterministic, fast renders (no animations, no responsiveness)
  const cfg = {
    ...config,
    options: {
      responsive: false,
      animation: false,
      devicePixelRatio: 1,
      ...(config?.options || {}),
    },
  };

  const chart = new Chart(ctx, cfg);
  // Allow one frame for layout
  await new Promise((r) => requestAnimationFrame(r));
  const url = canvas.toDataURL("image/png");
  chart.destroy();
  return url;
}

async function maybeImportChart() {
  try {
    // Optional dynamic import if Chart wasn't attached to window by bundler
    const mod = await import(/* webpackChunkName: "chartjs" */ "chart.js/auto");
    const Chart = mod?.default || mod?.Chart || null;
    if (Chart) window.Chart = Chart;
    return Chart;
  } catch (_) {
    return null;
  }
}
