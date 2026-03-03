import { Typography, useTheme } from "@mui/material";

export default function WhySopaComplianceDoesntGuaranteeStrongPtrsResults() {
  const theme = useTheme();

  return (
    <>
      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        In construction environments, it is increasingly common to see
        organisations that are fully compliant with Security of Payment
        legislation yet report comparatively weak small business payment
        performance under the Payment Times Reporting framework.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        At first glance, that looks contradictory. If a business is meeting its
        statutory obligations, why do its published payment metrics suggest
        underperformance?
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        The answer often lies not in behaviour, but in measurement. Security of
        Payment legislation and Payment Times Reporting operate on different
        clocks. Security of Payment regulates maximum time after a valid payment
        claim is submitted. Payment Times Reporting measures elapsed days
        between invoice date and payment date. In construction, those clocks
        frequently diverge.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        Progress claims are commonly submitted on fixed monthly cycles.
        Contracts may operate on 30 days end-of-month terms. Certification and
        approval workflows can introduce structured timing stages before payment
        runs occur. Retention amounts may be released separately from primary
        invoice settlements. Payment runs may occur weekly or fortnightly rather
        than immediately upon approval.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        None of this necessarily breaches Security of Payment requirements.
        However, when Payment Times Reporting calculates elapsed days using
        invoice dates rather than payment claim validation dates, the resulting
        metrics can appear materially weaker than the operational reality would
        suggest.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        This is not a question of compliance failure. It is a question of
        structural alignment. When payment mechanics are not modelled prior to
        reporting, organisations may find themselves explaining outcomes that
        are technically correct but contextually misleading.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        Construction payment environments are inherently complex, but complexity
        can be mapped, modelled and managed. The emerging challenge is not
        simply to prepare reports, but to understand how payment data behaves
        under different frameworks so compliance and optics stay aligned rather
        than drifting into tension.
      </Typography>
    </>
  );
}
