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

export default function OperationalDelayVsBehaviouralDelay() {
  const theme = useTheme();

  return (
    <>
      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        When payment metrics begin deteriorating, the immediate assumption is
        often that the organisation has become a slower payer or is deliberately
        extending supplier payment timing to preserve cashflow.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        Sometimes that assumption is correct. Quite often, however, the
        underlying drivers are far more operational than people expect.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        This is where the distinction between operational delay and behavioural
        delay becomes important.
      </Typography>

      <BlogImage
        src="/images/insights/The-difference-between-operational-delay-and-behavioural-delay-matters.png"
        alt="Comparison of operational delay and behavioural delay in payment reporting"
      />

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        Behavioural delay is generally what people think of first when
        discussing poor payment performance. It usually reflects deliberate
        payment practices such as extending settlement timing, preserving
        working capital, or prioritising certain supplier groups over others.
        These decisions are typically strategic or financially driven and tend
        to attract the greatest external scrutiny because they directly
        influence supplier experience and payment culture.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        Operational delay is different.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        In large organisations, reported payment outcomes can also be heavily
        influenced by workflow complexity, fragmented systems, approval
        bottlenecks, invoice batching, intake delays, weekly payment runs,
        shared services processing, and inconsistent invoice recognition
        practices. None of these mechanics necessarily indicate deliberate poor
        payment behaviour on their own.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        In many cases, they exist because the organisation has evolved over time
        through acquisitions, decentralised operations, changing systems, or
        layers of financial governance and operational control.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        The challenge is that payment reporting frameworks continue measuring
        elapsed time while all of these processes occur in the background.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        An invoice may spend time waiting for operational approval, sitting
        inside a processing queue, moving between systems, or missing a payment
        cut-off before payment is eventually released. Individually, those
        delays may appear relatively minor. Across thousands of transactions,
        however, the cumulative effect can materially distort reported outcomes
        and create the impression of slower payment behaviour than the
        organisation internally believes exists.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        This distinction matters because the remediation pathway for each
        problem is entirely different.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        An organisation experiencing behavioural delay may need to review
        payment strategy, supplier treatment practices, or cashflow management
        approaches. An organisation experiencing operational delay may instead
        need to focus on workflow timing, approval structures, invoice handling
        processes, or system alignment sitting quietly beneath the reporting
        outcomes.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        Confusing one for the other can lead organisations toward corrective
        actions that fail to address the real source of deterioration.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        As payment reporting attracts greater scrutiny and percentile measures
        such as P95 carry more weight, understanding the operational mechanics
        sitting behind reported outcomes is becoming just as important as
        understanding the metrics themselves.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        At Monochrome Compliance, we work with organisations to help identify
        the structural and operational drivers influencing payment outcomes so
        that reported performance can be interpreted more clearly and addressed
        more effectively.
      </Typography>
    </>
  );
}
