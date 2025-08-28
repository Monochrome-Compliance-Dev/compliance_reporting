import { Box, Button, Paper, useTheme } from "@mui/material";
import { useRef } from "react";
import { Link } from "react-router";
import { useReactToPrint } from "react-to-print";

export default function BrochureButtons(PrintableContent) {
  console.log("BrochureButtons(PrintableContent)", PrintableContent);
  const documentTitle = "Partner Brochure";
  const theme = useTheme();
  const contentRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: documentTitle,
    removeAfterPrint: true,
  });

  return (
    <>
      <PrintableContent ref={contentRef} />
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
        <Button variant="outlined" onClick={handlePrint}>
          Download as PDF
        </Button>
      </Box>
    </>
  );
}
