import { publicService } from "../../services/";

export async function sendSummaryByEmail({
  pdfBlob,
  recordId,
  contactData,
  answers,
  setAlert,
  from = "contact@monochrome-compliance.com",
  subject = "Your Compliance Navigator Summary",
  fileName = "compliance-navigator-report.pdf",
  email,
  html,
  message,
}) {
  try {
    const contact = contactData || answers?.contactDetails || {};
    const to = contact.email || "";
    const name = contact.name || "";
    const company = contact.company || "";
    const position = contact.position || "";

    const formData = new FormData();
    formData.append("to", to);
    formData.append("name", name);
    formData.append("from", from);
    formData.append("email", contactData.email);
    formData.append("subject", subject);
    formData.append("company", company);

    // Prefer explicit html/message if provided, else fallback to default html
    if (html) {
      formData.append("html", html);
    } else if (message) {
      formData.append("message", message);
    } else {
      formData.append(
        "html",
        `<p>Hi ${name},</p>
        <p>Thank you for using the PTRS Compliance Navigator. Attached is your summary.</p>
        <p><strong>Company:</strong> ${company}<br/><strong>Position:</strong> ${position}</p>
        <p><strong>Reference:</strong> ${recordId}</p>`
      );
    }

    // Append date string to fileName in yyyy-mm-dd format
    const dateStr = new Date().toISOString().slice(0, 10);
    const datedFileName = fileName.replace(/\.pdf$/, `-${dateStr}.pdf`);

    if (pdfBlob instanceof Blob) {
      const file = new File([pdfBlob], datedFileName, {
        type: "application/pdf",
      });
      formData.append("attachment", file);
    } else {
      console.error("Invalid or missing pdfBlob:", pdfBlob);
      if (setAlert) {
        setAlert({
          type: "error",
          message: "PDF generation failed. Please try again.",
        });
      }
      return;
    }

    await publicService.sendAttachmentEmail(formData, true);
    if (setAlert) {
      setAlert({
        type: "success",
        message: "Your summary should be in your inbox shortly.",
      });
    }
  } catch (error) {
    console.error("Failed to email summary", error);
    if (setAlert) {
      setAlert({
        type: "error",
        message: "Failed to send email. Please try again.",
      });
    }
  }
}
