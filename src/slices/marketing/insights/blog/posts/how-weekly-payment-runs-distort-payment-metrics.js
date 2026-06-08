import { Box, Typography, useTheme } from "@mui/material";

function BlogImage({ src, alt }) {
  const theme = useTheme();

  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      sx={{
        display: "block",
        width: "100%",
        borderRadius: 2,
        my: theme.spacing(4),
      }}
    />
  );
}

export default function HowWeeklyPaymentRunsDistortPaymentMetrics() {
  const theme = useTheme();

  return (
    <>
      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        A lot of organisations are surprised when their reported payment metrics
        come back looking worse than expected because internally, the payment
        process itself may not feel particularly problematic.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        One of the more common reasons for this is something fairly ordinary:
        weekly payment runs.
      </Typography>

      <BlogImage
        src="/images/insights/how-weekly-payment-runs-distort-payment-metrics-hero.png"
        alt="Payment operations dashboard showing reporting metrics and payment performance analysis"
      />

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        From an operational perspective, weekly payment cycles often make
        complete sense. They help organisations manage cashflow, maintain
        financial controls, reduce processing overhead, and create predictable
        treasury rhythms across large finance environments. The issue is not
        necessarily the existence of the payment run itself. The problem is the
        way elapsed reporting time continues accumulating while invoices wait
        for the next cycle.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        An invoice approved on a Tuesday may only wait a few additional days
        before payment is released. An invoice approved shortly after a Friday
        cut-off, however, may effectively sit for another full week before
        settlement occurs. Individually, those delays may not feel particularly
        significant. Across thousands of invoices, the cumulative impact can
        materially alter reported payment outcomes.
      </Typography>

      <BlogImage
        src="/images/insights/how-weekly-payment-runs-distort-payment-metrics-timeline.png"
        alt="Illustration comparing two weekly payment run scenarios and their effect on elapsed reporting time"
      />

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        This becomes even more pronounced in large organisations where payment
        runs interact with other operational mechanics such as approval queues,
        invoice batching, shared services processing, intake delays, or
        fragmented finance systems. By the time an invoice reaches the point
        where payment can actually be released, a substantial amount of elapsed
        time may already have accumulated in the background.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        The tricky part is that many of these mechanics feel completely normal
        internally. Nobody necessarily believes the organisation is paying
        suppliers poorly. The published metrics, however, may end up telling a
        very different story once reporting periods close and percentile
        calculations begin highlighting tail-payment behaviour.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        This is one of the reasons payment reporting outcomes are often more
        operationally complex than the headline numbers initially suggest. In
        many cases, organisations are not simply dealing with “good” or “bad”
        payment culture. They are dealing with structural timing effects that
        have gradually evolved across systems, workflows, approval structures,
        and finance operations over many years.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        Understanding those operational mechanics is becoming increasingly
        important as payment reporting attracts greater scrutiny and metrics
        such as P95 begin carrying more weight across regulatory and
        reputational discussions.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        At Monochrome Compliance, we work with organisations to help identify
        and interpret the operational drivers sitting behind reported payment
        outcomes so that payment performance can be understood more clearly and
        addressed more confidently.
      </Typography>
    </>
  );
}
