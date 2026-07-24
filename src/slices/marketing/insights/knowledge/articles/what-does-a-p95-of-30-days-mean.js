import { Typography, useTheme } from "@mui/material";

export default function WhatDoesAP95Of30DaysMean() {
  const theme = useTheme();

  return (
    <>
      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        A P95 of 30 days means that 95% of invoices were paid within 30 days.
        Put another way, only 5% of invoices took longer than 30 days to pay.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        While that sounds simple, it is one of the most important concepts in
        Payment Times Reporting because it focuses on consistency rather than
        averages. It tells us how the vast majority of invoices are performing,
        not just what the overall average happens to be.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        Consider an organisation that processes 100 invoices during a reporting
        period. A P95 of 30 days means that 95 of those invoices were paid
        within 30 days. Only the slowest 5 invoices fell outside that window.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        The same principle applies to larger organisations. If 10,000 invoices
        are processed during a reporting period, a P95 of 30 days means that
        approximately 9,500 invoices were paid within 30 days. The remaining 500
        invoices may have taken longer.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        This is why P95 can be challenging to improve once delays begin
        spreading through a broader invoice population. Fixing a handful of late
        invoices may make little difference if hundreds or thousands of other
        invoices are also drifting beyond the 30-day mark.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        The regulator has indicated that organisations achieving a P95 below 30
        days are operating within a safe harbour position. As a result, many
        organisations now view a P95 of 30 days as an important practical
        benchmark rather than simply another reporting metric.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        Importantly, a P95 above 30 days does not automatically mean an
        organisation has a payment culture problem. In many cases, the causes
        are operational. Payment runs, approval bottlenecks, invoice intake
        delays, shared services processing, and fragmented systems can all add
        elapsed time that accumulates quietly in the background.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        That is why organisations increasingly monitor P95 throughout the
        reporting period. Understanding what is driving the result early is far
        easier than trying to explain an unexpected outcome after reporting has
        closed.
      </Typography>
    </>
  );
}
