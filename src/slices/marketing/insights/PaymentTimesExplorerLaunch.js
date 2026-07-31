import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import { Link as RouterLink } from "react-router";
import PublicPageLayout from "shared/layouts/PublicPageLayout";
import PageMeta from "shared/ui/PageMeta";
import PublicPageHero from "shared/ui/public/PublicPageHero";
import PublicPageSection from "shared/ui/public/PublicPageSection";

export default function PaymentTimesExplorerLaunch() {
  const theme = useTheme();

  return (
    <>
      <PageMeta
        title="Introducing the Payment Times Explorer | Monochrome Compliance"
        description="Explore Australia’s published Payment Times Reporting data by organisation, reporting period and industry."
        image="/images/og/og-industry-insights.jpg"
      />

      <PublicPageLayout
        sx={{
          backgroundColor: theme.palette.background.default,
        }}
      >
        <PublicPageHero
          eyebrow="Insights & analysis"
          title="Introducing the Payment Times Explorer"
          description="A clearer way to explore Australia’s published Payment Times Reporting data."
          metadata="27 July 2026 · Monochrome Compliance"
        />

        <PublicPageSection>
          <Stack spacing={3}>
            <Typography variant="body1">
              Australia’s published Payment Times Reporting data contains an
              enormous amount of useful information about how large
              organisations pay their small business suppliers. The challenge
              has never been the availability of the data; it has been how
              difficult it can be to explore and make sense of it.
            </Typography>

            <Typography variant="body1">
              Finding a particular organisation is only the first step.
              Comparing reporting periods, understanding how payment behaviour
              has changed over time or seeing how one organisation performs
              against others in the same industry has often meant working
              through multiple spreadsheets and piecing the story together
              yourself.
            </Typography>

            <Typography variant="body1">
              We found ourselves doing exactly that while preparing Payment
              Times Reporting submissions and analysing published results. After
              spending more hours than we would care to admit navigating the
              data, we decided there had to be a better way.
            </Typography>

            <Typography variant="body1">
              The result is the Payment Times Explorer. It brings together
              Australia’s published Payment Times Reporting data into a single,
              searchable experience, making it easier to explore organisations,
              compare results over time and understand the payment behaviour
              behind the numbers.
            </Typography>
          </Stack>
        </PublicPageSection>

        <PublicPageSection
          sx={{
            pt: 0,
          }}
        >
          <Box
            component="img"
            src="/images/insights/payment-times-explorer/hero.jpg"
            alt="Payment Times Explorer showing average, median, P80 and P95 payment times, payment distribution and industry position"
            sx={{
              display: "block",
              width: "100%",
              height: "auto",
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
            }}
          />
        </PublicPageSection>

        <PublicPageSection
          eyebrow="Explore the data"
          title="Find the organisation you are looking for"
          introduction="Start by searching for a business name or ABN. From there, you can jump directly into its published Payment Times Reporting history."
        >
          <Stack spacing={3}>
            <Typography variant="body1">
              The Explorer is designed to help you find organisations quickly
              without working through spreadsheets or scrolling through
              published registers. As you type, matching organisations are
              returned instantly, making it easy to locate the reporting entity
              you're interested in.
            </Typography>

            <Typography variant="body1">
              Selecting a result opens that organisation's profile, where you
              can explore its published payment performance, compare reporting
              periods and see how it sits within its industry. Whether you're
              researching a customer, supplier or your own organisation, the
              information is only a few clicks away.
            </Typography>
          </Stack>

          <Box
            component="img"
            src="/images/insights/payment-times-explorer/search-results.jpg"
            alt="Payment Times Explorer search results"
            sx={{
              display: "block",
              width: "75%",
              alignSelf: "center",
              //   height: "75%",
              //   maxWidth: 920,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
            }}
          />
        </PublicPageSection>

        <PublicPageSection
          eyebrow="See the wider picture"
          title="Explore payment behaviour by industry"
          introduction="Company results become more useful when they can be viewed in the context of the industry in which the organisation operates."
        >
          <Stack spacing={3}>
            <Typography variant="body1">
              The industry pages group reporting entities using their published
              industry classification and show how payment behaviour is
              distributed within each sector. This creates a more meaningful
              reference point than comparing organisations that operate in
              completely different commercial environments.
            </Typography>

            <Typography variant="body1">
              You can explore the number of reporting entities within an
              industry, review typical P95 performance and open individual
              company profiles for a closer look. The aim is not to create a
              league table across unrelated industries, but to provide useful
              context for the results already being reported.
            </Typography>
          </Stack>

          <Box
            component="img"
            src="/images/insights/payment-times-explorer/industry-overview.jpg"
            alt="Payment Times Explorer industry overview"
            sx={{
              display: "block",
              width: "100%",
              height: "auto",
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
            }}
          />
        </PublicPageSection>

        <PublicPageSection
          eyebrow="Understanding the numbers"
          title="The average does not always tell the full story"
          introduction="Payment performance can look reasonable at first glance while a smaller group of invoices takes much longer to reach payment."
        >
          <Stack spacing={3}>
            <Typography variant="body1">
              That is why the Explorer presents several measures rather than
              relying on a single headline number. Average and median payment
              times describe the centre of the result, while P80 and P95 show
              what is happening further into the slower end of the payment
              distribution.
            </Typography>

            <Typography variant="body1">
              This matters because organisations do not usually improve their
              reporting outcomes by making every payment one day faster. The
              larger opportunities often sit within the invoices delayed by
              approval pathways, payment runs, invoice recognition problems or
              other operational exceptions.
            </Typography>

            <Typography variant="body1">
              We will explore these measures in more detail through a series of
              practical articles, including why P95 matters, how payment cycles
              affect reported outcomes and what organisations can learn from
              changes in their own reporting history.
            </Typography>
          </Stack>
        </PublicPageSection>

        <PublicPageSection
          eyebrow="A practical starting point"
          title="Explore, compare and understand"
          introduction="The Payment Times Explorer is designed to make published payment data easier to work with, whether you are researching another organisation or reviewing your own results."
        >
          <Stack spacing={3}>
            <Typography variant="body1">
              It is not a replacement for the underlying published data, and it
              does not attempt to turn every result into a simple judgement.
              Payment behaviour is shaped by operating models, commercial
              arrangements, invoice processes and the realities of large and
              complex organisations.
            </Typography>

            <Typography variant="body1">
              What the Explorer does provide is a clearer place to begin. You
              can find the organisation, follow the reporting history, examine
              the measures that matter and place the result within its industry
              context.
            </Typography>

            <Box sx={{ pt: 1 }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                component={RouterLink}
                to="/regulator-payment-times"
              >
                Explore the Payment Times Explorer
              </Button>
            </Box>
          </Stack>
        </PublicPageSection>
      </PublicPageLayout>
    </>
  );
}
