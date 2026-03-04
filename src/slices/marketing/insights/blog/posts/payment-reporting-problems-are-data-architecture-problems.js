import { Typography, useTheme } from "@mui/material";

export default function PaymentReportingProblemsAreDataArchitectureProblems() {
  const theme = useTheme();

  return (
    <>
      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        In many organisations, Payment Times Reporting is treated as a reporting
        exercise. Data is extracted from accounting systems, fields are mapped
        into the reporting template, and the final submission is assembled
        shortly before the reporting deadline. When the numbers look
        uncomfortable, attention often turns to supplier terms, approval
        behaviour or payment performance.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        In many cases, however, the underlying issue sits somewhere else
        entirely. It sits in the payment data architecture.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        Payment reporting frameworks rarely measure the same operational events
        that internal systems record. Payment Times Reporting, for example,
        calculates elapsed days between invoice date and payment date. Yet many
        financial systems capture additional stages in the lifecycle of a
        payable transaction: progress claims, certification, dispute resolution,
        retention releases and structured payment runs.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        Each of those stages introduces timing signals into the data. If those
        signals are not understood or normalised before reporting calculations
        occur, the final metrics can tell a story that only partially reflects
        operational reality.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        This is why reporting surprises often appear late in the cycle. The
        reporting logic itself is usually correct, but the underlying dataset
        carries structural timing characteristics that were never modelled
        against the reporting framework.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        In other words, the issue is not necessarily payment behaviour. It is
        the architecture of the payment data itself.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        Organisations that treat reporting as a downstream activity often
        encounter these surprises repeatedly. By contrast, organisations that
        analyse payment mechanics earlier in the data lifecycle can usually
        anticipate how those mechanics will behave under reporting rules.
      </Typography>

      <Typography
        variant="body1"
        sx={{ lineHeight: 1.8, mb: theme.spacing(3) }}
      >
        Once that relationship is understood, reporting outcomes tend to become
        far more predictable. The closer an organisation gets to understanding
        its payment data architecture, the fewer reporting surprises it tends to
        encounter.
      </Typography>
    </>
  );
}
