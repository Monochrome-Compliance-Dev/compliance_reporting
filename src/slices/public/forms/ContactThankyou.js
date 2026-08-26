import { useEffect } from "react";
import { Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router";
import PublicPageLayout from "shared/layouts/PublicPageLayout";
import PageMeta from "shared/ui/PageMeta";
import { PublicPageHero } from "shared/ui";

export function ContactThankyou() {
  const theme = useTheme();

  useEffect(() => {
    if (typeof window.gtag === "function") {
      window.gtag("event", "conversion", {
        send_to: "AW-17266555248/8T3iCJzv7eUcEPDyqgIA",
      });
    }
  }, []);

  return (
    <>
      <PageMeta
        title="Thank You"
        description="Confirmation that Monochrome Compliance has received your contact request."
        path="/thankyou-contact"
        noIndex
      />

      <PublicPageLayout
        sx={{ backgroundColor: theme.palette.background.default }}
      >
        <PublicPageHero
          eyebrow="Message received"
          title="Thank you for getting in touch!"
          description="We’ve received your message and will get back to you shortly."
          sx={{ py: { xs: 5, md: 7 } }}
        >
          <Button variant="outlined" component={RouterLink} to="/">
            Back to Home
          </Button>
        </PublicPageHero>
      </PublicPageLayout>
    </>
  );
}
