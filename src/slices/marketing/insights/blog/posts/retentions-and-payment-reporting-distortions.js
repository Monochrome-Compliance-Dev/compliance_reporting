import { Typography, useTheme } from "@mui/material";

export default function RetentionsAndPaymentReportingDistortions() {
  const theme = useTheme();

  return (
    <>
      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        Retention arrangements are a normal part of construction contracting. A
        portion of a payment is withheld until a later milestone, often linked
        to project completion or the end of a defects liability period. The
        intention is straightforward: to provide assurance that contractual
        obligations will be fulfilled.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        From an operational perspective this structure works well. The majority
        of the payment is released when work is certified, while a smaller
        portion remains outstanding until the agreed milestone is reached.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        When payment reporting frameworks examine the same transactions,
        however, the presence of retentions can introduce timing effects that
        are not immediately obvious.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        Payment reporting frameworks typically measure elapsed time between an
        invoice date and the date on which the associated payment occurs. When a
        payment is split into an initial settlement and a later retention
        release, the dataset begins to contain two different payment events tied
        to the same underlying work.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        The first payment generally reflects the normal operational payment
        cycle. The retention portion, however, may not be released until months
        later depending on the contract terms. When that later payment appears
        in the dataset it introduces a second timing signal that is much longer
        than the operational payment cycle that applied to the original work.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        From a reporting perspective this can produce results that appear
        inconsistent with the way the payment was experienced by the supplier.
        Most of the invoice value may have been paid within the expected
        timeframe, yet the retained portion introduces a second payment event
        that occurs much later.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        In isolation this is simply a contractual feature of construction
        projects. When aggregated across many transactions, however, retention
        releases can influence statistical outcomes in ways that finance teams
        do not always anticipate when reviewing reporting metrics.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        Understanding how these contractual structures appear inside payment
        datasets is an important step in interpreting payment reporting results.
        Once those mechanics are visible, many of the apparent anomalies in
        reporting outcomes become much easier to explain.
      </Typography>
    </>
  );
}
