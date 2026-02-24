import React from "react";
import { Typography } from "@mui/material";
import PolicyDocument from "./PolicyDocument";

const sections = [
  {
    id: "section1",
    title: "1. Nature of Information Provided",
    content: (
      <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
        All information made available through our website, communications,
        publications, and tools is provided for general informational and
        guidance purposes only. It does not constitute legal, financial, or
        regulatory advice unless explicitly provided in a formal advisory
        engagement. Monochrome Compliance does not warrant that any content,
        data, or materials provided are appropriate or applicable to your
        individual circumstances without independent verification.
      </Typography>
    ),
  },
  {
    id: "section2",
    title: "2. No Guarantee of Outcomes",
    content: (
      <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
        While we apply best practices and diligence to ensure the integrity and
        accuracy of our services, we do not guarantee that the use of our
        services will result in regulatory compliance, avoidance of penalties,
        or successful outcomes. You remain responsible for verifying the
        suitability of our services for your specific business needs and for
        seeking independent legal or professional advice as necessary.
      </Typography>
    ),
  },
  {
    id: "section3",
    title: "3. No Professional Relationship Without Formal Engagement",
    content: (
      <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
        Accessing this website or communicating with us does not, by itself,
        establish a client, fiduciary, or professional advisory relationship. A
        formal engagement agreement is required before any professional services
        or specific advice is deemed to have been provided by us.
      </Typography>
    ),
  },
  {
    id: "section4",
    title: "4. Responsibility for Compliance Reports",
    content: (
      <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
        Where clients formally engage Monochrome Compliance to assist with
        Payment Times Reporting Scheme (PTRS) obligations or other regulatory
        filings: It is acknowledged and agreed that ultimate responsibility for
        the accuracy, completeness, and submission of any final report to the
        regulator rests exclusively with the client. A nominated representative
        of the client must review and approve the final report before
        submission. Monochrome Compliance acts solely in an assistance and
        facilitation role and shall not be held liable for any regulatory,
        financial, or reputational consequences arising from the final report
        submitted by or on behalf of the client.
      </Typography>
    ),
  },
  {
    id: "section5",
    title: "5. Client Obligations",
    content: (
      <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
        Clients and users of our services agree to: - Provide accurate, current,
        and complete information as required for the delivery of our services. -
        Review all drafts, reports, and advice delivered before taking action. -
        Seek independent verification of critical decisions or compliance
        outcomes. - Maintain responsibility for implementing any advice
        received.
      </Typography>
    ),
  },
  {
    id: "section6",
    title: "6. Limitation of Liability",
    content: (
      <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
        To the fullest extent permitted by law, Monochrome Compliance excludes
        all liability for: - Any loss or damage arising directly or indirectly
        from the use of our website or services; - Errors, omissions, or delays
        in information provided; - Reliance on information that was inaccurate,
        misleading, or incomplete due to client-supplied data; - Loss of
        business, contracts, revenue, goodwill, or anticipated savings. Where
        liability cannot be excluded by law, our liability is limited to the
        re-supply of services or the amount paid for the service, whichever is
        lower.
      </Typography>
    ),
  },
  {
    id: "section7",
    title: "7. Indemnity",
    content: (
      <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
        You agree to indemnify and hold harmless Monochrome Compliance and its
        directors, officers, employees, and agents from any claims, liabilities,
        damages, costs, or expenses (including legal fees) arising out of: -
        Your use or misuse of our services or website; - Inaccurate, incomplete,
        or misleading information provided by you. Each party indemnifies the
        other for losses caused by their own breach or misconduct.
      </Typography>
    ),
  },
  {
    id: "section8",
    title: "8. Intellectual Property",
    content: (
      <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
        All content, materials, systems, and methodologies used in connection
        with our services and website are the intellectual property of
        Monochrome Compliance unless otherwise noted. You may not reproduce,
        distribute, publicly display, or create derivative works from our
        materials without our express written consent.
      </Typography>
    ),
  },
  {
    id: "section9",
    title: "9. Confidentiality",
    content: (
      <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
        Any non-public information shared with us by clients will be treated as
        confidential and handled in accordance with applicable privacy laws and
        professional confidentiality obligations. However, confidentiality
        obligations do not apply to information: - Already in the public domain;
        - Rightfully obtained by third parties; - Required to be disclosed by
        law or regulation.
      </Typography>
    ),
  },
  {
    id: "section10",
    title: "10. Third-Party Tools and Integrations",
    content: (
      <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
        We may use third-party platforms or integrations to facilitate service
        delivery. We are not responsible for the content, functionality, or data
        handling practices of these external providers. Users should review the
        privacy and legal terms of any such third parties.
      </Typography>
    ),
  },
  {
    id: "section11",
    title: "11. Force Majeure",
    content: (
      <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
        We are not liable for any failure or delay in performance due to
        circumstances beyond our reasonable control, including natural
        disasters, network failures, third-party service outages, cyberattacks,
        pandemics, regulatory changes, or government actions.
      </Typography>
    ),
  },
  {
    id: "section12",
    title: "12. Termination of Access",
    content: (
      <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
        We reserve the right to suspend or terminate access to our website or
        services without notice if we believe a user has violated these terms or
        is engaged in unlawful activity.
      </Typography>
    ),
  },
  {
    id: "section13",
    title: "13. Governing Law and Jurisdiction",
    content: (
      <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
        These terms are governed by the laws of Queensland, Australia. Any
        disputes shall be resolved exclusively in the courts of Queensland. If
        any provision is found to be unenforceable, the remainder will continue
        in full force.
      </Typography>
    ),
  },
  {
    id: "section14",
    title: "14. Amendments to This Disclaimer",
    content: (
      <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
        We may revise this Legal Disclaimer at any time. Updates will be
        published on our website, and continued use of our services constitutes
        acceptance of any changes.
      </Typography>
    ),
  },
];

const LegalDisclaimer = ({ isLoggedIn }) => (
  <PolicyDocument
    title="Legal Disclaimer"
    lastUpdated="19 May 2025"
    isLoggedIn={isLoggedIn}
    sections={sections}
  />
);

export default LegalDisclaimer;
