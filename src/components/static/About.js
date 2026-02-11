import { Container, Typography, Grid, Paper } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import GavelIcon from "@mui/icons-material/Gavel";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import PageMeta from "../ui/PageMeta";

const About = () => {
  return (
    <>
      <PageMeta
        title="About"
        description={`Helping organisations meet Payment Times Reporting obligations with calm,
   defensible reporting and clear audit trails.`}
      />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h3" gutterBottom textAlign="center">
          About Monochrome Compliance
        </Typography>
        <Typography variant="body1" paragraph textAlign="center">
          Monochrome Compliance helps Australian organisations meet their
          Payment Times Reporting obligations without unnecessary complexity or
          internal disruption.
        </Typography>
        <Typography variant="body1" paragraph textAlign="center">
          We specialise in taking raw payment data from accounting systems and
          exports, turning it into accurate metrics and submission-ready reports
          that stand up to board and regulatory scrutiny.
        </Typography>

        <Grid container spacing={4} sx={{ mt: 4 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <GavelIcon fontSize="large" color="primary" />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Built for Payment Times Reporting
              </Typography>
              <Typography variant="body2">
                Purpose-built processes and tooling aligned with the Payment
                Times Reporting Scheme and Australian regulatory guidance.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
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
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <AccountCircleIcon fontSize="large" color="primary" />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Built by People Who Get It
              </Typography>
              <Typography variant="body2">
                Our platform is designed by people who’ve sat in your chair —
                product managers, compliance officers, engineers, and board
                members.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default About;
