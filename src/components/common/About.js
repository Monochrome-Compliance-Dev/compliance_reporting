import { Box, Container, Typography, Grid, Paper } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import GavelIcon from "@mui/icons-material/Gavel";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import PageMeta from "../ui/PageMeta";

const About = () => {
  return (
    <>
      <PageMeta
        title="About"
        description="Learn about Monochrome Compliance — an Australian SaaS company helping organisations meet their compliance obligations with speed and confidence."
      />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h3" gutterBottom textAlign="center">
          About Monochrome Compliance
        </Typography>
        <Typography variant="body1" paragraph textAlign="center">
          Monochrome Compliance is a specialised SaaS platform built to help
          Australian organisations meet their regulatory obligations without
          complexity, spreadsheets, or legalese.
        </Typography>
        <Typography variant="body1" paragraph textAlign="center">
          Founded by compliance and tech professionals, our mission is to reduce
          the burden of reporting obligations while increasing transparency,
          consistency, and trust.
        </Typography>

        <Grid container spacing={4} sx={{ mt: 4 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <GavelIcon fontSize="large" color="primary" />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Built for Compliance
              </Typography>
              <Typography variant="body2">
                Purpose-built tools for PTRS, Modern Slavery, Director
                Obligations and more — fully aligned with Australian regulatory
                frameworks.
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
