// NOTE:
// This file provides global, non-layout print hygiene.
// Document-specific print layouts (A4 sizing, grids, footers)
// should define their own GlobalStyles locally.
//
import { GlobalStyles } from "@mui/material";

export default function GlobalPrintStyles() {
  return (
    <GlobalStyles
      styles={{
        /* A4 page + margins */
        "@page": {
          size: "A4",
          margin: "16mm",
        },

        "@media print": {
          /* Use brand colours on paper */
          "*": {
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          },

          /* Hide interactive-only UI */
          '[data-role="scroll-banner"]': { display: "none !important" },
          '[data-role="sticky-cta"]': { display: "none !important" },
          ".screen-only": { display: "none !important" },

          /* Optional: show simple text where buttons/links were */
          ".print-url": { display: "block !important" },

          /* Remove shadows/hover transforms for crisp print */
          ".MuiPaper-root": { boxShadow: "none !important" },
          '[style*="position: fixed"]': { position: "static !important" },

          /* Avoid awkward splits */
          "section, .section, .MuiGrid-container, .grid-row, .MuiPaper-root": {
            breakInside: "avoid",
            pageBreakInside: "avoid",
          },

          /* Tidy images */
          img: { maxWidth: "100%", height: "auto" },
        },
      }}
    />
  );
}
