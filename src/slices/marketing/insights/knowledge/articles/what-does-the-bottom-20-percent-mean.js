import { Typography, useTheme } from "@mui/material";

export default function WhatDoesTheBottom20PercentMean() {
  const theme = useTheme();

  return (
    <>
      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        The bottom 20% refers to the slowest-paying organisations within a
        particular industry group. It is a comparative measure used by the
        regulator to understand how organisations perform relative to their
        peers rather than in isolation.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        One of the most common misunderstandings is the belief that the bottom
        20% means that 20% of invoices are paid late. That is not what the
        measure represents. Instead, it compares organisations against others
        operating within the same industry classification.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        For example, if 100 organisations exist within an industry group, the 20
        organisations with the weakest payment performance would sit within the
        bottom 20%. The exact thresholds will vary depending on the payment
        behaviour of the industry as a whole.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        This comparison is important because different industries operate in
        different ways. A construction business, for example, may face very
        different payment mechanics from a professional services firm. Comparing
        organisations against industry peers creates a more meaningful point of
        reference.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        While the bottom 20% attracts attention, many organisations are now
        focusing more heavily on P95 performance. The regulator has indicated
        that organisations achieving a P95 below 30 days are operating within a
        safe harbour position, making that measure a particularly useful
        operational target.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        An organisation can therefore improve its position by understanding the
        operational drivers behind payment delays. Payment runs, approval
        bottlenecks, invoice intake processes, shared services environments, and
        data quality issues can all influence reported outcomes.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        In practice, the bottom 20% should be viewed as a benchmarking measure.
        It helps organisations understand where they sit relative to peers, but
        it is often most useful when considered alongside broader indicators
        such as P95 and overall payment behaviour trends.
      </Typography>
    </>
  );
}
