// This document defines its own print layout and intentionally
// overrides global print defaults where required.

import {
  Box,
  GlobalStyles,
  Typography,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";

import PageMeta from "../../../components/ui/PageMeta";
import { useEffect } from "react";

export default function PaymentTimesReportingPrint() {
  const printedDateAu = new Date().toLocaleDateString("en-AU");

  //   useEffect(() => {
  //     window.print();
  //   }, []);

  return (
    <>
      <GlobalStyles
        styles={{
          // A4 print setup
          "@page": {
            size: "A4",
            margin: "12mm",
          },
          "@media print": {
            "html, body": {
              background: "#fff",
              margin: 0,
              padding: 0,
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            },
            "header, nav": {
              display: "none !important",
            },
            ".MuiAppBar-root, .MuiToolbar-root": {
              display: "none !important",
            },
            ".MuiDrawer-root, .MuiBackdrop-root": {
              display: "none !important",
            },
            "#react-devtools, #react-devtools-root, #react-devtools-container":
              {
                display: "none !important",
              },
            ".react-devtools, .ReactQueryDevtools, .react-query-devtools": {
              display: "none !important",
            },
            ".tsqd-open-btn, .tsqd-parent-container, .tsqd-panel": {
              display: "none !important",
            },
            "[class*='tsqd-']": {
              display: "none !important",
            },
            "[data-testid='react-query-devtools']": {
              display: "none !important",
            },

            // Ensure the print canvas occupies the full printable area.
            "#ptrs-print-canvas": {
              width: "186mm", // 210mm - 2*12mm margin
              minHeight: "273mm", // 297mm - 2*12mm margin
              margin: 0,
              padding: 0,
              background: "#fff",
              boxShadow: "none",
              borderRadius: 0,
              border: "none",
            },

            // Footer sits at the bottom of each printed page.
            ".ptrs-print-footer": {
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              padding: "2mm 0",
              borderTop: "0.3mm solid #d9d9d9",
              fontSize: "9px",
              lineHeight: 1.2,
              background: "#fff",
            },
            ".ptrs-print-footer__row": {
              margin: "0 12mm",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "8mm",
            },
            ".ptrs-print-footer__left": {
              display: "flex",
              flexWrap: "wrap",
              gap: "4mm",
              alignItems: "center",
            },
            ".ptrs-print-footer__sep": {
              color: "#999",
            },

            // Hide anything marked screen-only when printing.
            ".screen-only": {
              display: "none !important",
            },
          },

          // On-screen: show a centred A4 preview on a neutral backdrop.
          "@media screen": {
            body: {
              background: "#0f1220",
            },
            "#ptrs-print-preview-wrap": {
              minHeight: "calc(100vh - 80px)",
              padding: "24px",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
            },
            "#ptrs-print-canvas": {
              width: "186mm",
              minHeight: "273mm",
              background: "#fff",
              borderRadius: "8px",
              boxShadow: "0 12px 50px rgba(0,0,0,0.35)",
              overflow: "hidden",
            },
          },
        }}
      />

      <PageMeta
        title="PTRS Marketing One-pager (Print)"
        description="A print-first PTRS one-pager designed for executive review."
      />

      <Box id="ptrs-print-canvas">
        {/* CONTENT GRID */}
        <Box
          sx={{
            // Fixed A4 canvas content padding
            boxSizing: "border-box",
            width: "186mm",
            minHeight: "273mm",
            padding: "10mm 0 12mm 0", // leave room visually for footer in preview
            display: "grid",
            gridTemplateColumns: "72mm 114mm", // left + right = 186mm
            gridTemplateRows: "auto auto auto auto auto 1fr",
            gridTemplateAreas: `
  "logo logo"
  "what who"
  "what whatImage"
  "howImage how"
  "love love"
  "cta cta"
`,
            columnGap: "8mm",
            rowGap: "7mm",
          }}
        >
          {/* LOGO (full-width) */}
          <Box
            sx={{
              gridArea: "logo",
              padding: "2mm 12mm 4mm 12mm",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8mm",
              borderBottom: "0.4mm solid #e6e6e6",
            }}
          >
            <Box
              component="img"
              src="https://monochrome-assets.s3.ap-southeast-2.amazonaws.com/logo-light-no-background.png"
              alt="Monochrome Compliance"
              sx={{
                height: "10mm",
                maxWidth: "95mm",
                width: "auto",
                objectFit: "contain",
                objectPosition: "left center",
                display: "block",
              }}
            />

            <Box sx={{ textAlign: "right" }}>
              <Typography
                sx={{
                  fontSize: "8pt",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#666",
                  lineHeight: 1.1,
                }}
              >
                Payment Times Reporting
              </Typography>
              <Typography
                sx={{
                  fontSize: "8.5pt",
                  fontWeight: 600,
                  color: "#777",
                  marginTop: "1mm",
                }}
              >
                Practical, defensible compliance reporting
              </Typography>
            </Box>
          </Box>

          {/* WHO */}
          <Box sx={{ gridArea: "who", paddingRight: "12mm" }}>
            <Typography
              sx={{
                fontSize: "9pt",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#222",
              }}
            >
              Who this is for
            </Typography>

            <Typography
              sx={{
                fontSize: "9.5pt",
                color: "#222",
                marginTop: "2mm",
                lineHeight: 1.4,
              }}
            >
              Finance teams who want Payment Times Reporting to feel calm,
              predictable, and genuinely taken care of.
            </Typography>

            <Typography
              sx={{
                fontSize: "9.5pt",
                color: "#222",
                marginTop: "2mm",
                lineHeight: 1.4,
              }}
            >
              We work with CFOs and senior finance leaders responsible for PTRS
              sign-off who value trust, clarity, and knowing the details have
              been handled properly.
            </Typography>

            <Typography
              sx={{
                fontSize: "9.5pt",
                color: "#222",
                marginTop: "2mm",
                lineHeight: 1.4,
              }}
            >
              Our role is to make PTRS something you don’t have to stress about
              — ever.
            </Typography>
          </Box>

          {/* WHAT */}
          <Box
            sx={{ gridArea: "what", paddingLeft: "12mm", paddingTop: "2mm" }}
          >
            <Typography
              sx={{
                fontSize: "26pt",
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: "#111",
              }}
            >
              We prepare your Payment Times Report and surface the insights that
              matter.
            </Typography>
            <Typography
              sx={{ fontSize: "10pt", color: "#444", marginTop: "4mm" }}
            >
              We prepare your Payment Times Report and walk you through the
              outcomes, drivers, and key decisions — early enough to feel calm,
              confident, and in control.
            </Typography>
          </Box>

          {/* WHAT IMAGE */}
          <Box
            sx={{
              gridArea: "whatImage",
              marginRight: "12mm",
              border: "0.4mm solid #e0e0e0",
              borderRadius: "4mm",
              padding: "4mm",
              minHeight: "48mm",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              component="img"
              src="/images/solutions/ptrs/ptrs-full-dashboard-light.png"
              alt="PTRS metrics dashboard preview"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                objectPosition: "center top",
                borderRadius: "2mm",
                display: "block",
              }}
            />
          </Box>

          {/* HOW IMAGE */}
          <Box
            sx={{
              gridArea: "howImage",
              marginLeft: "12mm",
              border: "0.4mm solid #e0e0e0",
              borderRadius: "4mm",
              padding: "6mm",
              minHeight: "44mm",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Box sx={{ width: "100%" }}>
              <Stepper
                alternativeLabel
                activeStep={3}
                sx={{
                  width: "100%",
                  "& .MuiStepLabel-label": {
                    fontSize: "8.5pt",
                    color: "#222",
                    lineHeight: 1.2,
                    marginTop: "2mm",
                  },
                  "& .MuiStepLabel-label.Mui-active, & .MuiStepLabel-label.Mui-completed":
                    {
                      fontWeight: 700,
                    },
                  "& .MuiStepIcon-root": {
                    fontSize: "18pt",
                    color: "#cfcfcf",
                  },
                  "& .MuiStepIcon-root.Mui-active, & .MuiStepIcon-root.Mui-completed":
                    {
                      color: "#111",
                    },
                  "& .MuiStepConnector-line": {
                    borderColor: "#e0e0e0",
                    borderTopWidth: "0.6mm",
                  },
                }}
              >
                <Step>
                  <StepLabel>Review your data</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Prepare draft report</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Walk through insights</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Submit with confidence</StepLabel>
                </Step>
              </Stepper>

              <Typography
                sx={{
                  fontSize: "8.5pt",
                  color: "#666",
                  textAlign: "center",
                  marginTop: "3mm",
                  lineHeight: 1.2,
                }}
              >
                A calm, guided process — built for sign‑off.
              </Typography>
            </Box>
          </Box>

          {/* HOW */}
          <Box sx={{ gridArea: "how", paddingRight: "12mm" }}>
            <Typography
              sx={{
                fontSize: "9pt",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#222",
              }}
            >
              How the engagement works
            </Typography>
            <Typography
              sx={{
                fontSize: "9.5pt",
                color: "#444",
                marginTop: "2mm",
                lineHeight: 1.35,
              }}
            >
              Simple, repeatable, and handled end‑to‑end.
            </Typography>
          </Box>

          {/* CUSTOMER LOVE */}
          <Box
            sx={{
              gridArea: "love",
              margin: "0 12mm",
              border: "0.4mm solid #e0e0e0",
              borderRadius: "4mm",
              padding: "7mm",
            }}
          >
            <Typography
              sx={{
                fontSize: "10.5pt",
                fontStyle: "italic",
                color: "#111",
                lineHeight: 1.35,
              }}
            >
              Placeholder quote: “Clear, calm, and no surprises — we knew
              exactly what we were signing.”
            </Typography>
            <Typography
              sx={{ fontSize: "9pt", color: "#666", marginTop: "2mm" }}
            >
              Placeholder attribution (optional): CFO, Large Enterprise
            </Typography>
          </Box>

          {/* CTA */}
          <Box sx={{ gridArea: "cta", margin: "0 12mm" }}>
            <Typography
              sx={{
                fontSize: "9pt",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Talk to us
            </Typography>
            <Typography
              sx={{ fontSize: "9.5pt", color: "#222", marginTop: "2mm" }}
            >
              Placeholder: A short conversation is usually enough to confirm
              scope and timing.
            </Typography>
          </Box>
        </Box>

        {/* FOOTER */}
        <Box className="ptrs-print-footer">
          <Box className="ptrs-print-footer__row">
            <Box className="ptrs-print-footer__left">
              <span>{new Date().getFullYear()} Monochrome Compliance</span>
              <span className="ptrs-print-footer__sep">•</span>
              <span>PTRS Marketing v1.0</span>
              <span className="ptrs-print-footer__sep">•</span>
              <span>Printed: {printedDateAu}</span>
              <span className="ptrs-print-footer__sep">•</span>
              <span>ABN 20687127386</span>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <span>
                <Typography
                  sx={{
                    fontSize: "9pt",
                    color: "#555",
                    marginTop: "2mm",
                  }}
                >
                  Practical, defensible Payment Times Reporting
                </Typography>
              </span>
              <br />
              <span style={{ fontWeight: 700 }}>Talk to us:</span>{" "}
              contact@monochrome-compliance.com
            </Box>
          </Box>
        </Box>
      </Box>

      {/* When printing, Chrome will use @media print styles; keeping an always-present canvas ensures it prints reliably. */}
      <Box id="ptrs-print-canvas" sx={{ display: "none" }} />
    </>
  );
}
