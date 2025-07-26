import React from "react";
import {
  Box,
  Typography,
  Paper,
  useTheme,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Link } from "react-router";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { EmailQRCode, WebsiteQRCode } from "../../static/QRCodes";

const PrintableContent = React.forwardRef(
  function PrintableContent(props, ref) {
    const theme = useTheme();
    return (
      <Box ref={ref} sx={{ maxWidth: "100%", overflowX: "hidden", mt: 2 }}>
        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            mb: 4,
            minHeight: { xs: 180, sm: 220, md: 300 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundImage: `url('/images/solutions/ms/modern-slavery.jpg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              inset: 0,
              zIndex: 1,
            }}
          />
          <Box sx={{ zIndex: 2, px: 2, textAlign: "center" }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
                color: "#fff",
                mb: 2,
              }}
            >
              Modern Slavery Compliance — Done For You
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "#fff", maxWidth: 800, mx: "auto" }}
            >
              A simple, partner-ready solution for automating Modern Slavery
              Statements and compliance.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ px: { xs: 2, sm: 4, md: 8 }, py: 4 }}>
          <Typography variant="h6" gutterBottom>
            What is it?
          </Typography>
          <Typography variant="body2" paragraph>
            Our Modern Slavery solution streamlines the preparation, review, and
            submission of required statements — without manual spreadsheets or
            legal consultants. Designed to meet Australian regulatory
            requirements, it includes task assignment, evidence logging, and
            templated statement generation.
          </Typography>

          <Typography variant="h6" sx={{ mt: 4 }} gutterBottom>
            Key Features
          </Typography>
          <ul>
            <li>
              <Typography variant="body2">
                Templated, editable statement generator
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Track suppliers and risks across reporting periods
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Audit trail logging and task assignment
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Export-ready board summaries
              </Typography>
            </li>
          </ul>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              See It In Action
            </Typography>
            <Typography variant="body2" paragraph>
              A quick preview of key elements of the Modern Slavery solution,
              including the statement generator, supplier tracking, and
              board-ready exports.
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
                alignItems: "center",
                mt: 2,
              }}
            >
              <Box
                component="img"
                src="/images/screens/ms-dashboard.png"
                alt="Dashboard Overview"
                sx={{
                  maxWidth: "100%",
                  borderRadius: 2,
                  boxShadow: 2,
                }}
              />
              <Typography variant="caption" color="textSecondary">
                Dashboard overview with compliance status and upcoming
                deadlines.
              </Typography>

              <Box
                component="img"
                src="/images/screens/ms-statement-editor.png"
                alt="Statement Generator"
                sx={{
                  maxWidth: "100%",
                  borderRadius: 2,
                  boxShadow: 2,
                }}
              />
              <Typography variant="caption" color="textSecondary">
                Statement generator with live editing and export preview.
              </Typography>

              <Box
                component="img"
                src="/images/screens/ms-supplier-risk.png"
                alt="Supplier Risk Tracking"
                sx={{
                  maxWidth: "100%",
                  borderRadius: 2,
                  boxShadow: 2,
                }}
              />
              <Typography variant="caption" color="textSecondary">
                Supplier risk tracking with historical comparisons.
              </Typography>
            </Box>
          </Box>

          <Typography variant="h6" sx={{ mt: 4 }} gutterBottom>
            Who is it for?
          </Typography>
          <Typography variant="body2" paragraph>
            Compliance officers, ESG leads, procurement consultants, and
            external advisors who want a fast, repeatable solution.
          </Typography>

          <Typography variant="h6" sx={{ mt: 4 }} gutterBottom>
            Partner Benefits
          </Typography>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Built for Resale
            </Typography>
            <Typography variant="body2">
              White-label ready with your logo and branding on all client-facing
              portals and exports. No infrastructure needed — just onboard your
              clients and go.
            </Typography>
          </Paper>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Attractive Margins
            </Typography>
            <Typography variant="body2">
              Resell the solution directly, embed it into your managed services,
              or refer it and earn. Partner tiers available.
            </Typography>
          </Paper>

          <Typography variant="h6" sx={{ mt: 4 }} gutterBottom>
            Why Partner With Us?
          </Typography>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Compliance-as-a-Service — without the Overhead
            </Typography>
            <Typography variant="body2">
              We handle infrastructure, updates, and client support — you focus
              on growing your business. No legal complexity, no technical lift.
            </Typography>
          </Paper>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Built for Your Brand
            </Typography>
            <Typography variant="body2">
              Offer a polished, white-labelled portal under your brand. Add
              value to your service offering and keep clients engaged with your
              ecosystem.
            </Typography>
          </Paper>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Real Margins, Not Pocket Change
            </Typography>
            <Typography variant="body2">
              Whether you refer or resell, partners typically earn 30–50% per
              client per month. Volume discounts and tier upgrades available.
            </Typography>
          </Paper>

          <Typography variant="h6" sx={{ mt: 4 }} gutterBottom>
            How it Works
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2">1. Join the Program</Typography>
              <Typography variant="body2">
                We’ll onboard you in minutes with a branded portal and
                go-to-market kit.
              </Typography>
            </Paper>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2">
                2. Invite Your Clients
              </Typography>
              <Typography variant="body2">
                Clients log in via your link and begin onboarding using our
                prebuilt content.
              </Typography>
            </Paper>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2">
                3. Monitor, Grow, Earn
              </Typography>
              <Typography variant="body2">
                Track engagement, compliance progress, and monthly recurring
                revenue from your dashboard.
              </Typography>
            </Paper>
          </Box>

          <Box sx={{ mt: 6 }}>
            <Typography variant="h6" gutterBottom>
              Trusted by Compliance Leaders
            </Typography>
            <Typography variant="body2" paragraph>
              Used by ESG consultants, legal advisors, and procurement teams
              across Australia.
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
              <img
                src="/images/clients/logo1.png"
                alt="Client 1"
                style={{ height: 32 }}
              />
              <img
                src="/images/clients/logo2.png"
                alt="Client 2"
                style={{ height: 32 }}
              />
              <img
                src="/images/clients/logo3.png"
                alt="Client 3"
                style={{ height: 32 }}
              />
            </Box>
          </Box>

          <Typography variant="h6" sx={{ mt: 6 }} gutterBottom>
            Frequently Asked Questions
          </Typography>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Is this white-label or co-branded?
            </Typography>
            <Typography variant="body2">
              Your call — we offer both. Use your logo and messaging, or
              leverage our compliance credibility with subtle co-branding.
            </Typography>
          </Paper>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              What onboarding support is available?
            </Typography>
            <Typography variant="body2">
              Partners receive a launch kit, training resources, and onboarding
              assistance for the first three clients.
            </Typography>
          </Paper>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Is there a minimum commitment?
            </Typography>
            <Typography variant="body2">
              No minimums or lock-ins — pay per active client month-to-month.
            </Typography>
          </Paper>

          <Typography variant="h6" sx={{ mt: 6 }} gutterBottom>
            How We Compare
          </Typography>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>
                    <strong>Our Solution</strong>
                  </TableCell>
                  <TableCell>Spreadsheets</TableCell>
                  <TableCell>Big 4 Consulting</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <strong>Setup Time</strong>
                  </TableCell>
                  <TableCell>Minutes</TableCell>
                  <TableCell>Hours</TableCell>
                  <TableCell>Weeks</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <strong>Statement Generator</strong>
                  </TableCell>
                  <TableCell>Built-in, live editor</TableCell>
                  <TableCell>Manual templates</TableCell>
                  <TableCell>Word document delivery</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <strong>Supplier Risk Tracking</strong>
                  </TableCell>
                  <TableCell>Interactive dashboard</TableCell>
                  <TableCell>Manual entries</TableCell>
                  <TableCell>Custom reports</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <strong>Ongoing Support</strong>
                  </TableCell>
                  <TableCell>Included</TableCell>
                  <TableCell>DIY</TableCell>
                  <TableCell>Billable hours</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <strong>Monthly Cost</strong>
                  </TableCell>
                  <TableCell>$950</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>$5,000+</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" sx={{ mt: 6 }} gutterBottom>
            Pricing Snapshot
          </Typography>
          <Typography variant="body2" paragraph>
            Pricing starts at $950/month per client, with volume discounts and
            partner tier incentives available.
          </Typography>
          <Typography variant="body2" paragraph>
            Typical partner margins: 30–50%.
          </Typography>

          <Box sx={{ textAlign: "center", mt: 6 }}>
            <Typography variant="h6" gutterBottom>
              Want to learn more?
            </Typography>
            <Box
              sx={{ display: "flex", justifyContent: "center", gap: 4, mt: 2 }}
            >
              <EmailQRCode style={{ height: 100 }} />
              <WebsiteQRCode style={{ height: 100 }} />
            </Box>
          </Box>

          <Box
            sx={{
              mt: 6,
              pt: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
              textAlign: "center",
            }}
          >
            <Typography variant="caption" color="textSecondary">
              © Monochrome Compliance. Powered by AWS. Compliant with the
              Modern Slavery Act 2018 (Cth).
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }
);

export default function PartnerModernSlaveryCopy() {
  const theme = useTheme();
  const contentRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: "Modern Slavery Brochure",
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
