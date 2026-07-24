import { Typography, useTheme } from "@mui/material";

export default function WhatIsP95() {
  const theme = useTheme();

  return (
    <>
      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        P95 is a percentile measure used to understand how consistently invoices
        are being paid. In simple terms, a P95 of 30 days means that 95% of
        invoices were paid within 30 days.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        Unlike an average, P95 focuses on what is happening across almost the
        entire invoice population. This makes it particularly useful for
        identifying whether payment delays are beginning to spread through a
        broader group of suppliers.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        Consider a business that processes 100 invoices. If its P95 is 30 days,
        it means 95 of those invoices were paid within 30 days. The remaining 5
        invoices may have taken longer.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        The same principle applies at scale. If an organisation processes 1,000
        invoices, a P95 of 30 days means approximately 950 invoices were paid
        within 30 days. That is why even relatively small pockets of delay can
        have a noticeable impact on reported outcomes.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        This is also why average payment times can be misleading. An average may
        still look reasonable even while a growing number of invoices are
        drifting beyond expected payment windows. P95 helps reveal whether those
        delays are becoming widespread.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        The regulator has increasingly focused on P95 because it provides a more
        meaningful view of payment behaviour than headline averages alone. It
        helps distinguish between isolated exceptions and broader operational or
        process issues affecting supplier payments.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        In practice, organisations that monitor P95 throughout the reporting
        period are often able to identify emerging issues much earlier. Rather
        than waiting for reporting results to highlight a problem, they can see
        trends developing and investigate the operational drivers behind them.
      </Typography>
    </>
  );
}
