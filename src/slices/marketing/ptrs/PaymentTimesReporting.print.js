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

import { useEffect } from "react";
import PageMeta from "shared/ui/PageMeta";

export default function PaymentTimesReportingPrint() {
  useEffect(() => {
    window.print();
  }, []);

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
            "body *": {
              visibility: "hidden",
            },
            "#ptrs-print-canvas, #ptrs-print-canvas *": {
              visibility: "visible",
            },
            "#ptrs-print-canvas": {
              position: "fixed",
              left: 0,
              top: 0,
              width: "186mm", // 210mm - 2*12mm margin
              minHeight: "273mm", // 297mm - 2*12mm margin
              margin: 0,
              padding: 0,
              background: "#fff",
              boxShadow: "none",
              borderRadius: 0,
              border: "none",
              overflow: "hidden",
            },

            // Footer sits at the bottom of each printed page.
            ".ptrs-print-footer": {
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              padding: "1mm 0",
              borderTop: "0.25mm solid #d9d9d9",
              fontSize: "8px",
              lineHeight: 1.05,
              background: "#fff",
            },
            ".ptrs-print-footer__row": {
              margin: "0 12mm",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center", // was flex-start
              gap: "3mm",
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
            footer: {
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
            // Uniform left/right padding so the content block aligns perfectly in print
            padding: "4mm 12mm 10mm 12mm", // reserve space so the fixed footer never overlaps content
            display: "grid",
            // Available inner width = 186mm - (12mm*2) = 162mm.
            // Account for 8mm column gap => columns sum to 154mm.
            gridTemplateColumns: "74mm 80mm",
            gridTemplateRows: "auto auto auto auto auto 1fr",
            gridTemplateAreas: `
  "logo logo"
  "what what"
  "who whatImage"
  "love love"
  "how how"
  "cta cta"
`,
            columnGap: "8mm",
            rowGap: "4mm",
          }}
        >
          {/* LOGO (full-width) */}
          <Box
            sx={{
              gridArea: "logo",
              padding: "2mm 0 4mm 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8mm",
              borderBottom: "0.4mm solid #2f3a44",
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
                Trusted by locally and internationally listed entities
              </Typography>
            </Box>
          </Box>

          {/* WHO */}
          <Box sx={{ gridArea: "who" }}>
            <Typography
              sx={{
                fontSize: "9pt",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#222",
              }}
            >
              Who is this for?
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
              sign-off, who value trust, clarity, and knowing the details have
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
              Monochrome Compliance makes PTRS something you don’t have to
              stress about — ever.
            </Typography>
          </Box>

          {/* WHAT */}
          <Box sx={{ gridArea: "what" }}>
            <Typography
              sx={{
                fontSize: "26pt",
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: "#111",
              }}
            >
              Let us prepare your Payment Times Report, and highlight the
              insights that matter.
            </Typography>
            <Typography
              sx={{ fontSize: "10pt", color: "#444", marginTop: "4mm" }}
            >
              We'll prepare your Payment Times Report and walk you through the
              outcomes, drivers and key insights — early enough to feel calm,
              confident, and in control.
            </Typography>
          </Box>

          {/* WHAT IMAGE */}
          <Box
            sx={{
              gridArea: "whatImage",
              display: "flex",
              flexDirection: "column",
              gap: "2mm",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: "4mm",
                paddingBottom: "2mm",
              }}
            >
              <Typography
                sx={{
                  fontSize: "9pt",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#222",
                }}
              >
                Insight Dashboard example
              </Typography>
            </Box>

            <Box
              component="img"
              src="/images/products/ptrs-dashboard-light.png"
              alt="PTRS metrics dashboard preview"
              sx={{
                width: "100%",
                height: "auto",
                maxHeight: "36mm",
                objectFit: "contain",
                objectPosition: "center top",
                borderRadius: "2mm",
                display: "block",
              }}
            />
          </Box>

          {/* HOW IMAGE & TEXT */}
          <Box sx={{ gridArea: "how" }}>
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

            <Stepper activeStep={-1} orientation="horizontal" alternativeLabel>
              <Step>
                <StepLabel>We review your data together</StepLabel>
              </Step>

              <Step>
                <StepLabel>We prepare your draft PTRS report</StepLabel>
              </Step>

              <Step>
                <StepLabel>
                  We review the draft with you and detail key takeaways
                </StepLabel>
              </Step>

              <Step>
                <StepLabel>You submit with confidence</StepLabel>
              </Step>
            </Stepper>

            {/* PROCESS STRIP (comparison) */}
            {/* <Box
              sx={{
                marginTop: "6mm",
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "6mm",
              }}
            >
              {[
                { step: "1", label: "Review your data" },
                { step: "2", label: "Prepare a draft report" },
                { step: "3", label: "Review outcomes & insights" },
                { step: "4", label: "Submit with confidence" },
              ].map((item) => (
                <Box
                  key={item.step}
                  sx={{
                    border: "0.3mm solid #e0e0e0",
                    borderRadius: "3mm",
                    padding: "4mm",
                    textAlign: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: "8mm",
                      height: "8mm",
                      borderRadius: "50%",
                      border: "0.4mm solid #222",
                      margin: "0 auto 2mm auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "9pt",
                      fontWeight: 700,
                    }}
                  >
                    {item.step}
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "9pt",
                      fontWeight: 600,
                      lineHeight: 1.3,
                      color: "#222",
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Box> */}
          </Box>

          {/* PROOF / WHAT MOVES THE NEEDLE */}
          <Box
            sx={{
              gridArea: "love",
              margin: 0,
              border: "0.4mm solid #e0e0e0",
              borderRadius: "4mm",
              padding: "7mm",
              background: "#fff",
            }}
          >
            <Typography
              sx={{
                fontSize: "9pt",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#222",
              }}
            >
              Moving the needle
            </Typography>

            <Typography
              sx={{
                fontSize: "9.5pt",
                color: "#222",
                marginTop: "2.5mm",
                lineHeight: 1.4,
              }}
            >
              In one engagement, we found that paying small business invoices
              just six days earlier materially changed the on-time payment
              result — without changing systems or renegotiating supplier terms.
            </Typography>

            <Box
              sx={{
                marginTop: "5mm",
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "5mm",
              }}
            >
              {[
                { value: "40%", label: "Current position" },
                { value: "72%", label: "If paid 6 days earlier" },
                { value: "86%", label: "If paid within typical delay" },
              ].map((item) => (
                <Box
                  key={item.label}
                  sx={{
                    border: "0.3mm solid #e6e6e6",
                    borderRadius: "3mm",
                    padding: "4mm",
                    textAlign: "center",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "18pt",
                      fontWeight: 900,
                      letterSpacing: "-0.02em",
                      color: "#111",
                      lineHeight: 1.05,
                    }}
                  >
                    {item.value}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "9pt",
                      color: "#666",
                      marginTop: "1.5mm",
                      lineHeight: 1.25,
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* CTA */}
          <Box sx={{ gridArea: "cta" }}>
            <Typography
              sx={{
                fontSize: "9pt",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginTop: "6mm",
              }}
            >
              Let us help you
            </Typography>
            <Typography
              sx={{ fontSize: "9.5pt", color: "#222", marginTop: "2mm" }}
            >
              We’ll take the stress out of PTRS and guide you to a clean,
              defensible sign-off.
            </Typography>

            <Typography
              sx={{
                fontSize: "9pt",
                color: "#444",
                marginTop: "2mm",
                lineHeight: 1.35,
              }}
            >
              <strong>Price:</strong> $7,000 per report submission{" "}
              <span style={{ color: "#777" }}>
                (subject to scope confirmation)
              </span>
              <br />
              <strong>Talk to us:</strong> contact@monochrome-compliance.com
            </Typography>
          </Box>
        </Box>

        {/* FOOTER */}
        <Box className="ptrs-print-footer">
          <Box className="ptrs-print-footer__row">
            <Box className="ptrs-print-footer__left">
              <Typography sx={{ fontSize: "9px", color: "#222" }}>
                {new Date().getFullYear()} Monochrome Compliance
              </Typography>
              <Typography
                className="ptrs-print-footer__sep"
                sx={{ fontSize: "9px" }}
              >
                •
              </Typography>
              <Typography sx={{ fontSize: "9px", color: "#222" }}>
                PTRS Marketing v1.0
              </Typography>
              <Typography
                className="ptrs-print-footer__sep"
                sx={{ fontSize: "9px" }}
              >
                •
              </Typography>
              <Typography sx={{ fontSize: "9px", color: "#222" }}>
                Version: Jan 2026
              </Typography>
              <Typography
                className="ptrs-print-footer__sep"
                sx={{ fontSize: "9px" }}
              >
                •
              </Typography>
              <Typography sx={{ fontSize: "9px", color: "#222" }}>
                ABN 20687127386
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}
