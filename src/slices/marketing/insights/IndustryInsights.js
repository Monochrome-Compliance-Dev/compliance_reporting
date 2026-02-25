import {
  Box,
  Card,
  CardContent,
  Divider,
  Typography,
  useTheme,
  Button,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { useNavigate } from "react-router";
import PageMeta from "shared/ui/PageMeta";

export default function IndustryInsights() {
  const theme = useTheme();
  const navigate = useNavigate();

  const contentMaxWidth = 980;

  const pdfHref =
    "/insights/Industry_Insight_Series_01_Construction_Payment_Times.pdf";

  const insights = [
    {
      title:
        "Industry Insight Series #1 – Construction Payment Times: Compliance vs Optics",
      description:
        "Why construction entities governed by Security of Payment legislation can appear slow in PTRS reporting even when operating within contractual and statutory frameworks.",
      cta: "Download PDF",
      href: pdfHref,
    },
  ];

  return (
    <>
      <PageMeta
        title="Industry Insights | Monochrome Compliance"
        description="Practical Payment Times Reporting insights for complex environments — especially construction progress-claim workflows — focused on accuracy, defensibility, and outcomes."
        image="/images/og/og-industry-insights.jpg"
      />

      <Box
        sx={{
          px: { xs: theme.spacing(3), md: theme.spacing(8) },
          py: theme.spacing(6),
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Box sx={{ maxWidth: contentMaxWidth, mx: "auto" }}>
          <Typography
            variant="h3"
            sx={{ fontWeight: 700, mb: theme.spacing(1) }}
          >
            Industry Insights
          </Typography>

          <Typography
            variant="h6"
            color={theme.palette.text.secondary}
            sx={{ mb: theme.spacing(3), lineHeight: 1.5 }}
          >
            Practical analysis for reporting entities operating in complex
            environments. We focus on structural drivers that influence Payment
            Times Reporting outcomes and how to improve accuracy and
            defensibility.
          </Typography>
        </Box>

        <Divider sx={{ my: theme.spacing(4) }} />

        <Box sx={{ maxWidth: contentMaxWidth, mx: "auto" }}>
          <Grid container spacing={3}>
            {insights.map((insight, index) => (
              <Grid key={index} size={{ xs: 12 }}>
                <Card
                  elevation={0}
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.paper,
                  }}
                >
                  <CardContent>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                      {insight.title}
                    </Typography>

                    <Typography
                      variant="body1"
                      color={theme.palette.text.secondary}
                      sx={{ mb: theme.spacing(2) }}
                    >
                      {insight.description}
                    </Typography>

                    <Button
                      variant="outlined"
                      color="primary"
                      component="a"
                      href={insight.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {insight.cta}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </>
  );
}
