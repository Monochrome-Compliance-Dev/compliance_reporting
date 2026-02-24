import { Typography } from "@mui/material";
import PolicyDocument from "./PolicyDocument";

const sections = [
  {
    id: "section1",
    title: "1. Engagement and Scope of Services",
    content: (
      <>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          1.1 This Agreement sets forth the terms and conditions under which our
          firm ("Service Provider") agrees to provide professional services
          ("Services") to you ("Client").
        </Typography>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          1.2 The scope of Services shall be detailed in the attached engagement
          letter, including any deliverables, timelines, and milestones. Any
          additional services beyond the scope must be agreed upon in writing.
        </Typography>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          1.3 We will perform the Services with due professional care, skill,
          and diligence in accordance with industry standards.
        </Typography>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          1.4 We do not guarantee any specific results or outcomes from the
          Services.
        </Typography>
      </>
    ),
  },
  {
    id: "section2",
    title: "2. Client Responsibilities",
    content: (
      <>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          2.1 The Client agrees to provide all necessary information,
          documentation, and access required for the performance of the Services
          in a timely manner.
        </Typography>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          2.2 The Client is responsible for the accuracy and completeness of any
          information provided to the Service Provider.
        </Typography>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          2.3 The Client shall cooperate fully and promptly respond to any
          requests or inquiries from the Service Provider.
        </Typography>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          2.4 Failure to meet these responsibilities may result in delays or
          additional fees.
        </Typography>
      </>
    ),
  },
  {
    id: "section3",
    title: "3. Fees and Payment",
    content: (
      <>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          3.1 Fees for Services will be charged as specified in the engagement
          letter, typically based on hourly rates or fixed fees.
        </Typography>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          3.2 Expenses incurred in connection with the Services, such as travel
          or third-party costs, will be billed separately.
        </Typography>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          3.3 Invoices will be issued monthly and are payable within 30 days of
          the invoice date.
        </Typography>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          3.4 Late payments may incur interest charges at the rate permitted by
          law.
        </Typography>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          3.5 The Service Provider reserves the right to suspend Services if
          payments are overdue.
        </Typography>
      </>
    ),
  },
  {
    id: "section4",
    title: "4. Term and Termination",
    content: (
      <>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          4.1 This Agreement commences on the effective date stated in the
          engagement letter and continues until completion of Services or
          termination.
        </Typography>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          4.2 Either party may terminate this Agreement with 30 days’ written
          notice.
        </Typography>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          4.3 Upon termination, the Client shall pay for all Services performed
          and expenses incurred up to the termination date.
        </Typography>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          4.4 Termination does not affect any accrued rights or obligations.
        </Typography>
      </>
    ),
  },
  {
    id: "section5",
    title: "5. Confidentiality",
    content: (
      <>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          5.1 Both parties agree to keep confidential all proprietary or
          sensitive information disclosed during the engagement.
        </Typography>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          5.2 Confidential information shall not be disclosed to third parties
          without prior written consent, except as required by law.
        </Typography>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          5.3 This confidentiality obligation survives termination of this
          Agreement.
        </Typography>
      </>
    ),
  },
  {
    id: "section6",
    title: "6. Governing Law and Dispute Resolution",
    content: (
      <>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          6.1 This Agreement shall be governed by the laws of the jurisdiction
          where the Service Provider is located, without regard to conflict of
          law principles.
        </Typography>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          6.2 Any disputes arising out of or relating to this Agreement shall be
          resolved by binding arbitration under the rules of the relevant
          arbitration association.
        </Typography>
      </>
    ),
  },
  {
    id: "section7",
    title: "7. Intellectual Property",
    content: (
      <>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          7.1 All intellectual property rights in materials developed or
          provided by the Service Provider in connection with the Services shall
          remain the property of the Service Provider unless otherwise agreed.
        </Typography>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          7.2 The Client is granted a non-exclusive, non-transferable license to
          use such materials solely for the purposes intended under this
          Agreement.
        </Typography>
      </>
    ),
  },
  {
    id: "section8",
    title: "8. Limitation of Liability",
    content: (
      <>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          8.1 To the maximum extent permitted by law, the Service Provider’s
          liability arising out of or related to this Agreement shall be limited
          to the fees paid by the Client for the Services.
        </Typography>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          8.2 The Service Provider shall not be liable for any indirect,
          incidental, special, or consequential damages.
        </Typography>
      </>
    ),
  },
  {
    id: "section9",
    title: "9. Indemnification",
    content: (
      <>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          9.1 The Client agrees to indemnify and hold harmless the Service
          Provider from any claims, losses, or damages arising from the Client’s
          breach of this Agreement or negligence.
        </Typography>
      </>
    ),
  },
  {
    id: "section10",
    title: "10. Force Majeure",
    content: (
      <>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          10.1 Neither party shall be liable for delays or failure to perform
          due to causes beyond their reasonable control, including but not
          limited to acts of God, war, or government actions.
        </Typography>
      </>
    ),
  },
  {
    id: "section11",
    title: "11. Notices",
    content: (
      <>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          11.1 All notices under this Agreement shall be in writing and
          delivered to the addresses specified in the engagement letter or as
          otherwise notified.
        </Typography>
      </>
    ),
  },
  {
    id: "section12",
    title: "12. Entire Agreement and Amendments",
    content: (
      <>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          12.1 This Agreement, together with the engagement letter, constitutes
          the entire understanding between the parties.
        </Typography>
        <Typography paragraph sx={{ whiteSpace: "pre-line" }}>
          12.2 Any amendments or modifications must be in writing and signed by
          both parties.
        </Typography>
      </>
    ),
  },
];

const ClientServiceAgreement = ({ isLoggedIn }) => {
  return (
    <PolicyDocument
      title="Client Service Agreement"
      lastUpdated="June 2024"
      isLoggedIn={isLoggedIn}
      sections={sections}
    />
  );
};

export default ClientServiceAgreement;
