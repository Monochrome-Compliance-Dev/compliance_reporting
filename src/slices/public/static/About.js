import { Container, Typography, Paper } from "@mui/material";
import Grid from "@mui/material/Grid";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import GavelIcon from "@mui/icons-material/Gavel";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import PageMeta from "shared/ui/PageMeta";

export const About = () => {
  return (
    <>
      <PageMeta
        title="About"
        description={`Helping organisations strengthen payment data, reporting, and compliance outcomes, including Payment Times Reporting (PTRS), with calm delivery and clear audit trails.`}
      />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h3" gutterBottom textAlign="center">
          About Monochrome Compliance
        </Typography>
        <Typography variant="body1" paragraph textAlign="center">
          Monochrome Compliance helps Australian organisations strengthen
          payment data, reporting, and compliance outcomes without unnecessary
          complexity or internal disruption.
        </Typography>
        <Typography variant="body1" paragraph textAlign="center">
          We specialise in taking raw payment data from accounting systems and
          exports, turning it into defensible datasets, accurate metrics, and
          submission-ready reporting outputs that stand up to board and
          regulatory scrutiny.
        </Typography>

        <Grid container spacing={4} sx={{ mt: 4 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <GavelIcon fontSize="large" color="primary" />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Built for complex payment reporting
              </Typography>
              <Typography variant="body2">
                Purpose-built processes and tooling aligned with Payment Times
                Reporting and broader Australian regulatory reporting
                expectations.
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <VerifiedUserIcon fontSize="large" color="primary" />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Trusted and Transparent
              </Typography>
              <Typography variant="body2">
                We believe in audit-ready reporting, tamper-proof records, and
                crystal-clear workflows that your governance team can rely on.
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <AccountCircleIcon fontSize="large" color="primary" />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Built by People Who Get It
              </Typography>
              <Typography variant="body2">
                Our platform is designed by people who understand operational
                pressure, compliance accountability, and the realities of messy
                source data.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default About;
