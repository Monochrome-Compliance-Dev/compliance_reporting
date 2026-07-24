import { Typography, useTheme } from "@mui/material";

export default function WhatIsPTRS() {
  const theme = useTheme();

  return (
    <>
      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        The Payment Times Reporting Scheme (PTRS) is an Australian Government
        initiative designed to improve transparency around how large
        organisations pay small business suppliers.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        Certain large businesses and government enterprises are required to
        report information about their payment practices. This information is
        then published so small businesses, regulators and other stakeholders
        can better understand how quickly reporting entities are paying their
        suppliers.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        The objective of the scheme is simple. Payment timing has a significant
        impact on small business cash flow, and greater transparency encourages
        organisations to understand and improve their payment behaviour over
        time.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        While the scheme is often viewed as a compliance obligation, reporting
        outcomes are rarely driven by payment intent alone. Invoice intake,
        approval workflows, payment runs, shared services processing, dispute
        handling and data quality can all influence reported payment results.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        This is why many organisations are moving beyond simply preparing their
        reports at the end of the reporting period. Instead, they are seeking to
        understand payment behaviour progressively throughout the year so that
        operational issues can be identified before they affect reported
        outcomes.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        In practice, the most successful organisations treat the Payment Times
        Reporting Scheme as both a compliance exercise and an operational
        visibility exercise. The better they understand how invoices move
        through their payment processes, the more predictable their reporting
        outcomes tend to become.
      </Typography>
    </>
  );
}
