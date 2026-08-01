import { Box, Grid, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PublicPageLayout from "shared/layouts/PublicPageLayout";
import PageMeta from "shared/ui/PageMeta";
import { PublicCard, PublicPageHero, PublicPageSection } from "shared/ui";

const principles = [
  {
    title: "Built for complex payment reporting",
    description:
      "Purpose-built processes and tooling aligned with Payment Times Reporting and broader Australian regulatory reporting expectations.",
  },
  {
    title: "Trusted and Transparent",
    description:
      "We believe in audit-ready reporting, tamper-proof records, and crystal-clear workflows that your governance team can rely on.",
  },
  {
    title: "Built by People Who Get It",
    description:
      "Our platform is designed by people who understand operational pressure, compliance accountability, and the realities of messy source data.",
  },
];

export const About = () => {
  const theme = useTheme();

  return (
    <>
      <PageMeta
        title="About"
        description="Helping organisations strengthen payment data, reporting, and compliance outcomes, including Payment Times Reporting (PTRS), with calm delivery and clear audit trails."
      />

      <PublicPageLayout
        sx={{ backgroundColor: theme.palette.background.default }}
      >
        <PublicPageHero
          eyebrow="About Monochrome Compliance"
          title="Clearer payment data. More defensible reporting."
          description="Monochrome Compliance helps Australian organisations strengthen payment data, reporting, and compliance outcomes without unnecessary complexity or internal disruption."
          sx={{
            "&&": {
              paddingBottom: {
                xs: theme.spacing(2),
                md: theme.spacing(3),
              },
            },
          }}
        >
          <Box
            component="img"
            src="/images/brand/expertise-compliance.jpg"
            alt="Monochrome Compliance boardroom overlooking a complex construction and commercial environment"
            loading="lazy"
            sx={{
              display: "block",
              width: "100%",
              aspectRatio: { xs: "16 / 9", md: "21 / 7" },
              objectFit: "cover",
              objectPosition: "center",
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: theme.layout.public.borderRadius,
            }}
          />
        </PublicPageHero>

        <PublicPageSection
          title="Practical expertise for demanding reporting environments"
          sx={{
            "&&": {
              paddingTop: { xs: theme.spacing(3), md: theme.spacing(4) },
              paddingBottom: {
                xs: theme.spacing(5),
                md: theme.spacing(7),
              },
            },
          }}
          contentSx={{
            "& > .MuiStack-root": {
              gap: { xs: theme.spacing(2.5), md: theme.spacing(3) },
            },
          }}
        >
          <Typography
            variant="body1"
            sx={{
              maxWidth: theme.layout.public.textWidth,
              color: theme.palette.text.secondary,
              lineHeight: 1.8,
            }}
          >
            We specialise in taking raw payment data from accounting systems and
            exports, turning it into defensible datasets, accurate metrics, and
            submission-ready reporting outputs that stand up to board and
            regulatory scrutiny.
          </Typography>

          <Grid container spacing={3} alignItems="stretch">
            {principles.map(({ title, description }, index) => (
              <Grid
                key={title}
                size={{ xs: 12, md: 4 }}
                sx={{ display: "flex" }}
              >
                <PublicCard
                  title={title}
                  titleComponent="h3"
                  titleVariant="h6"
                  description={description}
                  contentSx={{ gap: 1.25 }}
                >
                  <Typography
                    variant="overline"
                    aria-hidden="true"
                    sx={{
                      order: -1,
                      color: theme.palette.primary.main,
                      fontWeight: 800,
                      letterSpacing: 1.4,
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </Typography>
                </PublicCard>
              </Grid>
            ))}
          </Grid>
        </PublicPageSection>
      </PublicPageLayout>
    </>
  );
};

export default About;
