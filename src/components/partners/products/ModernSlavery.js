import { Box, Button, Paper, useTheme } from "@mui/material";
import {
  ComparisonTable,
  FAQSection,
  FeaturesSection,
  Footer,
  HeroSection,
  HowSection,
  PartnerBenefitsSection,
  PricingSection,
  QRCodeSection,
  ActionSection,
  TrustedSection,
  WhatSection,
  WhoSection,
} from "../../brochures/shared";

import { moduleData } from "../../brochures/modules/modern-slavery/brochure.partner";
import React, { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { Link } from "react-router";

function PageBreak() {
  return (
    <Box
      sx={{
        display: "none",
        "@media print": {
          display: "block",
          breakAfter: "page",
          pageBreakAfter: "always", // fallback for older engines
        },
      }}
    />
  );
}

const ModernSlaveryPage = React.forwardRef(function PrintableContent(
  { printing },
  ref
) {
  return (
    <Box ref={ref} sx={{ maxWidth: "100%", overflowX: "hidden", mt: 2 }}>
      <HeroSection {...moduleData} />
      <Box sx={{ px: { xs: 2, sm: 4, md: 8 }, py: 4 }}>
        <WhatSection description={moduleData.description} />
        <FeaturesSection features={moduleData.features} />
        <ActionSection actions={moduleData.actionSection} />
        {printing && (
          <>
            <Footer />
            <PageBreak />
          </>
        )}
        <WhoSection audience={moduleData.audience} />
        <PartnerBenefitsSection
          benefits={moduleData.partnerBenefits}
          extras={moduleData.whyPartner}
        />
        {printing && (
          <>
            <Footer />
            <PageBreak />
          </>
        )}
        <HowSection how={moduleData.howSection} />
        {/* <TrustedSection trustedSection={moduleData.trustedSection} /> */}
        <FAQSection faqs={moduleData.faqs} />
        {printing && (
          <>
            <Footer />
            <PageBreak />
          </>
        )}
        <ComparisonTable comparison={moduleData.comparison} />
        <PricingSection printing={printing} {...moduleData.pricing} />
        {printing && (
          <>
            <Footer />
            <PageBreak />
          </>
        )}
        {printing && (
          <>
            <QRCodeSection codes={true} />
            <Footer />
          </>
        )}
      </Box>
    </Box>
  );
});

export default function ModernSlaveryPartnerBrochure() {
  const documentTitle = "Modern Slavery Partner Brochure";
  const theme = useTheme();
  const contentRef = useRef(null);
  const [printing, setPrinting] = useState(false);

  const printPdf = useReactToPrint({
    contentRef,
    documentTitle: documentTitle,
    removeAfterPrint: true,
  });

  useEffect(() => {
    if (printing) {
      // const timeout = setTimeout(() => {
      printPdf();
      setPrinting(false);
      // }, 100); // give React time to render the "printing" content

      // return () => clearTimeout(timeout);
    }
  }, [printing, printPdf]);

  return (
    <>
      <ModernSlaveryPage ref={contentRef} printing={printing} />
      <Box
        sx={{
          mt: 5,
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Link to="/partners" style={{ textDecoration: "none" }}>
          <Paper
            elevation={3}
            sx={{
              display: "inline-block",
              px: 4,
              py: 1.5,
              backgroundColor: theme.palette.primary.main,
              color: "#fff",
              fontWeight: 600,
              borderRadius: 2,
              "&:hover": {
                backgroundColor: theme.palette.primary.light,
              },
            }}
          >
            Back to Partner Hub
          </Paper>
        </Link>
        <Link to="/contact" style={{ textDecoration: "none" }}>
          <Paper
            elevation={3}
            sx={{
              display: "inline-block",
              px: 4,
              py: 1.5,
              backgroundColor: theme.palette.primary.main,
              color: "#fff",
              fontWeight: 600,
              borderRadius: 2,
              "&:hover": {
                backgroundColor: theme.palette.primary.light,
              },
            }}
          >
            Start your partner journey
          </Paper>
        </Link>
        <Button variant="outlined" onClick={() => setPrinting(true)}>
          Download as PDF
        </Button>
      </Box>
    </>
  );
}
