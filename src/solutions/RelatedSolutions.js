import { Box, Typography, Grid, Card } from "@mui/material";
import { Link } from "react-router";

const SOLUTIONS = [
  {
    id: "ptrs",
    title: "Payment Times Reporting",
    path: "/payment-times-reporting",
    description:
      "Meet your PTRS obligations with automated enrichment, rules-based logic, and full report generation.",
  },
  {
    id: "ms",
    title: "Modern Slavery",
    path: "/modern-slavery",
    description:
      "Conduct risk assessments and prepare structured statements for Modern Slavery Act compliance.",
  },
  {
    id: "wb",
    title: "Whistleblower Compliance",
    path: "/whistleblower-compliance",
    description:
      "Enable secure, anonymous reporting and track case resolution in compliance with the Corporations Act.",
  },
  {
    id: "do",
    title: "Director Obligations",
    path: "/director-obligations",
    description:
      "Track disclosures and compliance attestations across your board and executive team.",
  },
  {
    id: "rr",
    title: "Risk Register",
    path: "/risk-register",
    description:
      "Replace your spreadsheet risk register with a structured, reviewable, audit-friendly workflow.",
  },
  {
    id: "wc",
    title: "Working Capital Analysis",
    path: "/working-capital",
    description:
      "Uncover insights from payment terms and supplier cash flow behaviour using structured analysis and exportable metrics.",
  },
  {
    id: "esg",
    title: "ESG Reporting",
    path: "/esg-reporting",
    description:
      "Track and publish ESG metrics, structure annual reports, and align with frameworks like TCFD and SASB.",
  },
];

export default function RelatedSolutions({ exclude }) {
  const related = SOLUTIONS.filter((s) => s.id !== exclude);

  return (
    <Box sx={{ mt: 8 }}>
      <Typography variant="h6" gutterBottom>
        You might also be interested in…
      </Typography>
      <Grid container spacing={2}>
        {related.map((solution) => (
          <Grid item xs={12} sm={6} md={4} key={solution.id}>
            <Card
              component={Link}
              to={solution.path}
              sx={{
                textDecoration: "none",
                p: 2,
                height: "100%",
                display: "block",
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {solution.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {solution.description}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
