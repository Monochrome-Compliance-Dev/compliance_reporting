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

export default function HowArePaymentTimesCalculated() {
  const theme = useTheme();

  return (
    <Stack spacing={sectionSpacing}>
      <Box>
        <Typography variant="overline" color="primary.main">
          Payment calculations
        </Typography>
        <Typography component="p" variant="h5" gutterBottom>
          How are payment times calculated?
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Payment time sounds simple: when did the invoice arrive, and when was
          it paid? In practice, the answer depends on which dates are available,
          how the organisation records them, and whether the payment process
          reflects the supplier experience or just the internal accounting
          workflow.
        </Typography>
      </Box>

      <Section title="The basic idea">
        <Typography variant="body1">
          Payment time is usually measured as the number of elapsed calendar
          days between the start date for the invoice and the date the supplier
          was paid. Under payment times reporting, that calculation matters
          because it feeds directly into the organisation&apos;s reported
          payment performance.
        </Typography>
        <Typography variant="body1">
          The calculation is not just a technical detail. A few days difference
          in the starting point can change whether a payment appears to fall
          inside or outside a 30-day threshold, especially for organisations
          that process large payment volumes.
        </Typography>
      </Section>

      <Section title="The dates that usually matter">
        <Typography variant="body1">
          Most organisations have several invoice-related dates in their
          systems. These can include the invoice issue date, the invoice receipt
          date, the document entry date, the due date, and the actual payment
          date.
        </Typography>
        <Typography variant="body1">
          The payment date is usually the easier end of the calculation. The
          harder question is which date should be treated as the start. If the
          system only records when an invoice was entered into the finance
          platform, that may be later than when the supplier issued it or when
          the organisation first received it.
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
          If an invoice is received on 1 July and paid on 31 July, the elapsed
          payment time is 30 days. If the same invoice is only entered into the
          system on 8 July and the organisation measures from entry date, the
          internal process may show 23 days instead. Same supplier. Same
          payment. Very different story.
        </Typography>
      </Box>

      <Section title="Why operational workflows matter">
        <Typography variant="body1">
          Payment calculations are heavily affected by operational workflow. If
          invoices are held outside the finance system, entered late, routed
          slowly for approval, or paid only during scheduled payment runs, the
          reported timing can quickly drift away from what the supplier actually
          experienced.
        </Typography>
        <Typography variant="body1">
          This is why payment performance analysis should look beyond the final
          metric. A poor result may reflect supplier behaviour, internal
          approval delays, master data issues, invoice matching problems,
          payment run timing, or a combination of all of them.
        </Typography>
      </Section>

      <Section title="What good analysis looks for">
        <Typography variant="body1">
          Good payment analysis starts by checking the source dates and the
          rules used to calculate elapsed time. It should confirm whether the
          data is using invoice issue date, receipt date, document date, entry
          date, due date, or another system-specific field.
        </Typography>
        <Typography variant="body1">
          From there, the analysis should look for patterns. Are late payments
          concentrated in particular business units, supplier groups, payment
          terms, approver queues, or payment cycles? Those patterns usually tell
          a more useful story than the headline average.
        </Typography>
      </Section>

      <Section title="The takeaway">
        <Typography variant="body1">
          Payment times are not just calculated by subtracting one date from
          another. They are shaped by the way the organisation captures
          invoices, approves them, schedules payments, and records the
          underlying data.
        </Typography>
        <Typography variant="body1">
          For PTRS reporting, the calculation needs to be clear, consistent, and
          defensible. For improvement work, it also needs to be practical enough
          to show where payment delays are really coming from.
        </Typography>
      </Section>
    </Stack>
  );
}
