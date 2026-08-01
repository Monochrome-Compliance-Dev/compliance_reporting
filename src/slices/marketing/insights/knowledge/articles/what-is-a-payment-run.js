import { Box, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const sectionSpacing = { xs: 3, md: 4 };

function Section({ title, children }) {
  return (
    <Box component="section">
      <Typography component="h2" variant="h4" gutterBottom>
        {title}
      </Typography>
      <Stack spacing={2}>{children}</Stack>
    </Box>
  );
}

export default function WhatIsAPaymentRun() {
  const theme = useTheme();

  return (
    <Stack spacing={sectionSpacing}>
      <Box>
        <Typography variant="overline" color="primary.main">
          Operational drivers
        </Typography>
        <Typography
          component="p"
          variant="h5"
          gutterBottom
          sx={{
            fontSize: { xs: "3rem", md: "4rem" },
            lineHeight: 1.1,
          }}
        >
          What is a payment run?
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Many organisations do not pay invoices continuously throughout the
          month. Instead, they process payments in scheduled batches known as
          payment runs. These cycles are often efficient from an operational
          perspective, but they can have a significant impact on reported
          payment performance.
        </Typography>
      </Box>

      <Section title="How payment runs work">
        <Typography variant="body1">
          A payment run is a scheduled process where approved invoices are
          grouped together and paid on a specific day. Some organisations run
          payments daily, while others pay weekly, fortnightly, or even less
          frequently.
        </Typography>
        <Typography variant="body1">
          Once an invoice has completed approvals and is ready for payment, it
          may still need to wait until the next scheduled payment cycle.
        </Typography>
      </Section>

      <Box
        sx={{
          borderLeft: `4px solid ${theme.palette.primary.main}`,
          pl: 2,
          py: 1,
        }}
      >
        <Typography variant="body1" fontWeight={700} gutterBottom>
          A simple example
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Imagine an invoice is fully approved on a Thursday. If the
          organisation's payment run occurs every Wednesday, that invoice may
          sit for almost a full week before payment is released, even though
          there is nothing wrong with the underlying process.
        </Typography>
      </Box>

      <Section title="Why payment runs affect metrics">
        <Typography variant="body1">
          Payment reporting measures elapsed time, not intent. Every day an
          invoice waits for the next payment cycle contributes to the final
          payment time.
        </Typography>
        <Typography variant="body1">
          As a result, organisations with infrequent payment runs can report
          slower payment performance than organisations with otherwise similar
          approval and processing practices.
        </Typography>
      </Section>

      <Section title="The impact on P95 performance">
        <Typography variant="body1">
          Payment runs often have a disproportionate impact on P95 results. Most
          invoices may still be paid comfortably within target timeframes, but a
          small group can miss a payment cycle and wait several additional days.
        </Typography>
        <Typography variant="body1">
          Those extra days tend to accumulate in the tail of the distribution,
          which is exactly where P95 focuses its attention.
        </Typography>
      </Section>

      <Section title="What good organisations do">
        <Typography variant="body1">
          Organisations with strong payment performance understand the
          relationship between payment runs and reporting outcomes. They monitor
          where invoices are waiting, identify bottlenecks before payment cycles
          close, and review whether payment schedules still align with business
          objectives.
        </Typography>
      </Section>

      <Section title="The takeaway">
        <Typography variant="body1">
          A payment run is not necessarily a problem. However, it is one of the
          most common operational drivers behind slower reported payment times.
          Understanding the timing of payment cycles is often one of the
          quickest ways to explain and improve payment performance.
        </Typography>
      </Section>
    </Stack>
  );
}
