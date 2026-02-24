import React from "react";
import { Typography } from "@mui/material";
import PolicyDocument from "./PolicyDocument";

const sections = [
  {
    id: "section1",
    title: "1. What Personal Information We Collect",
    content: (
      <>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          We may collect the following types of personal information: - Full
          name, contact details (email, phone, address) - Business details (ABN,
          entity structure, trading names) - Employment information, titles and
          roles - Financial details where necessary for compliance analysis -
          Responses to compliance-related questionnaires and documentation -
          Information collected from cookies, analytics tools, and similar
          technologies We do not collect sensitive information unless directly
          relevant to our services and you have consented.
        </Typography>
      </>
    ),
  },
  {
    id: "section2",
    title: "2. How We Collect Your Information",
    content: (
      <>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          We may collect personal information: - Directly from you (via our
          website forms, email, phone, meetings, or surveys) - From third-party
          referrals with your consent - Through publicly available sources and
          government registers (e.g., ASIC, ABR) - Automatically via our website
          analytics tools (cookies, IP address, usage data)
        </Typography>
      </>
    ),
  },
  {
    id: "section3",
    title: "3. Purpose of Collection and Use",
    content: (
      <>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          We collect and use your personal information for the following
          purposes: - To provide and improve our compliance, reporting, and
          advisory services - To assess your business needs and customise our
          services accordingly - To communicate with you regarding our services
          or legal obligations - To comply with legal and regulatory
          requirements - For internal business operations, research, and
          analytics
        </Typography>
      </>
    ),
  },
  {
    id: "section4",
    title: "4. Disclosure of Personal Information",
    content: (
      <>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          We may disclose your information: - To regulatory or government bodies
          (e.g., the ATO, ASIC) when required - To subcontractors, advisers, or
          software platforms we use (under strict confidentiality) - When
          legally compelled to do so (e.g., court orders) We will never sell or
          rent your personal information.
        </Typography>
      </>
    ),
  },
  {
    id: "section5",
    title: "5. Data Retention and Right to Deletion",
    content: (
      <>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          Personal data is securely stored in Australia or trusted international
          jurisdictions. Where our storage option is selected and paid for,
          Client data is retained for at least 7 years unless otherwise required
          by law. After this period, it will be securely destroyed or
          anonymised. Clients can request deletion by contacting us at
          contact@monochrome-compliance.com. Deletion will be confirmed within
          30 days unless retention is required by law.
        </Typography>
      </>
    ),
  },
  {
    id: "section6",
    title: "6. Security of Your Information",
    content: (
      <>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          We take the security of your personal information seriously and
          implement safeguards including: - Secure access controls and
          authentication - Encryption of data in transit and at rest -
          Restriction of access to authorised personnel - Contractual
          obligations for third-party providers - Staff training and vetting - A
          data breach response plan
        </Typography>
      </>
    ),
  },
  {
    id: "section7",
    title: "7. Access and Correction",
    content: (
      <>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          You may request access to or correction of your personal information
          by contacting contact@monochrome-compliance.com. We will respond
          within 30 days in line with the Australian Privacy Principles (APPs).
        </Typography>
      </>
    ),
  },
  {
    id: "section8",
    title: "8. Cookies and Analytics",
    content: (
      <>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          Our website uses cookies and third-party tools (e.g., Google
          Analytics) to enhance the user experience and track usage data.
          Disabling cookies may impact site functionality.
        </Typography>
      </>
    ),
  },
  {
    id: "section9",
    title: "9. Complaints",
    content: (
      <>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          If you believe we have breached the Privacy Act, contact us at
          contact@monochrome-compliance.com. If unresolved, you may contact the
          Office of the Australian Information Commissioner (OAIC): 1300 363 992
          | https://www.oaic.gov.au
        </Typography>
      </>
    ),
  },
  {
    id: "section10",
    title: "10. Changes to This Policy",
    content: (
      <>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          We may update this Privacy Policy to reflect changes in law or
          operations. The latest version will always be available on our
          website.
        </Typography>
      </>
    ),
  },
];

const PrivacyPolicy = ({ isLoggedIn }) => (
  <PolicyDocument
    title="Privacy Policy"
    lastUpdated="19 May 2025"
    isLoggedIn={isLoggedIn}
    sections={sections}
  />
);

export default PrivacyPolicy;
