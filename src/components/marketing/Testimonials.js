import { Box, Container, Grid, Paper, Typography } from "@mui/material";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import PageMeta from "../ui/PageMeta";

const Testimonials = () => {
  return (
    <>
      <PageMeta
        title="Testimonials"
        description="See what compliance leaders are saying about Monochrome Compliance and our practical approach to regulatory obligations."
      />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h3" gutterBottom textAlign="center">
          What People Are Saying
        </Typography>
        <Typography variant="body1" textAlign="center" sx={{ mb: 4 }}>
          Feedback from organisations who trust Monochrome Compliance to handle
          the messy parts of modern regulation.
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: "100%" }}>
              <Box sx={{ mb: 2 }}>
                <FormatQuoteIcon color="primary" />
              </Box>
              <Typography variant="body2">
                “PTRS used to be a mad scramble. Now it's a checklist. The
                system does what the legislation asks — and nothing more.”
              </Typography>
              <Typography variant="subtitle2" sx={{ mt: 2 }}>
                Head of Finance, ASX-listed tech company
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: "100%" }}>
              <Box sx={{ mb: 2 }}>
                <FormatQuoteIcon color="primary" />
              </Box>
              <Typography variant="body2">
                “It’s rare to find software that actually reflects what happens
                in a board meeting. Monochrome’s workflows do.”
              </Typography>
              <Typography variant="subtitle2" sx={{ mt: 2 }}>
                Company Secretary, National advisory firm
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: "100%" }}>
              <Box sx={{ mb: 2 }}>
                <FormatQuoteIcon color="primary" />
              </Box>
              <Typography variant="body2">
                “This is the first compliance tool I’ve used that doesn’t try to
                explain the law to me. It just lets me comply.”
              </Typography>
              <Typography variant="subtitle2" sx={{ mt: 2 }}>
                Legal Counsel, Infrastructure group
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default Testimonials;
