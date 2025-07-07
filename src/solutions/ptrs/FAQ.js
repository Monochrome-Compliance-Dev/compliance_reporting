import React from "react";
import {
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const faqs = [
  {
    question: "1. Who is required to report under the new PTRS scheme?",
    answer:
      "Only entities that meet the new definition of a reporting entity under the Payment Times Reporting Act 2020 are required to report. This includes the highest-level entity in a corporate group that meets consolidated revenue and control criteria.",
  },
  {
    question: "2. What payments need to be included in a report?",
    answer:
      "Entities must report payments made under trade credit arrangements to Australian small businesses, excluding payments to government or employees, and subject to specific rules around credit cards and ABNs.",
  },
  {
    question: "3. How is the SBI Tool used?",
    answer:
      "The SBI Tool must be used after each reporting period to identify small business suppliers based on the calendar year in which the reporting period ended. It is only available via the PTRS Portal.",
  },
  {
    question: "4. What if a report is submitted using the old CSV template?",
    answer:
      "Reports submitted using the CSV template for periods commencing after 1 July 2024 will be rejected. The new scheme requires reports to be submitted through the Portal's webform interface.",
  },
  {
    question: "5. When is a report due?",
    answer:
      "Reports must be submitted within 3 months of the end of the reporting period. Most entities will report biannually based on their financial year.",
  },
  {
    question:
      "6. What if an entity is acquired or loses control of another entity?",
    answer:
      "You must report on payments by all entities you control at the end of the reporting period. If data is not accessible, section 15 of the Rules allows exclusions with disclosures.",
  },
  {
    question: "7. Are credit card payments required to be reported?",
    answer:
      "Yes, if they meet the criteria of a trade credit arrangement, exceed $100 (incl. GST), and are not excluded under a genuinely enforced policy or other exceptions.",
  },
  {
    question: "8. Can more time be requested to submit a report?",
    answer:
      "Yes, via the Portal. Extensions of up to 28 days require a reason, while longer extensions need supporting documentation.",
  },
  {
    question: "9. Do supporting datasets need to be submitted?",
    answer:
      "No, but you must retain them for seven years. The TCP and SBTCP datasets are essential for calculating required metrics.",
  },
  {
    question: "10. What support is available if someone gets stuck?",
    answer:
      "You're not alone — our platform is designed to guide you through each step with clarity and confidence. Clear instructions, integrated tips, and contextual help are built into the platform, so you can move forward without needing to leave the platform.",
  },
];

export default function FAQ() {
  return (
    <>
      <Box sx={{ maxWidth: 800, mx: "auto", my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Frequently Asked Questions – Top 10 Issues
        </Typography>
        {faqs.map((faq, index) => (
          <Accordion key={index}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">{faq.question}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2">{faq.answer}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </>
  );
}
