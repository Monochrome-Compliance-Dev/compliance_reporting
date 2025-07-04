import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { SendRawEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({ region: "ap-southeast-2" }); // Outbound
const s3 = new S3Client({ region: "us-east-1" }); // Inbound

const getEmailBodyFromS3 = async (bucket, key) => {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3.send(command);

  const streamToString = (stream) =>
    new Promise((resolve, reject) => {
      let data = "";
      stream.on("data", (chunk) => (data += chunk));
      stream.on("end", () => resolve(data));
      stream.on("error", reject);
    });

  if (!response.Body) throw new Error("S3 object Body is empty or unreadable");
  return streamToString(response.Body);
};

function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

function extractSubjectHeader(raw) {
  const match = raw.match(/^Subject:\s*(.+)$/im);
  return match ? match[1].trim() : "";
}

function parseRawHeaders(raw) {
  const headerSection = raw.split(/\r?\n\r?\n/)[0];
  const headers = {};
  const lines = headerSection.split(/\r?\n/);

  let currentHeader = "";
  lines.forEach((line) => {
    if (/^\s/.test(line)) {
      // Folded header value
      headers[currentHeader] += " " + line.trim();
    } else {
      const [key, ...rest] = line.split(":");
      if (key && rest.length) {
        currentHeader = key.trim().toLowerCase();
        headers[currentHeader] = rest.join(":").trim();
      }
    }
  });

  return headers;
}

function extractEmailAddress(headerValue) {
  if (!headerValue) return null;

  const match = headerValue.match(/<([^>]+)>/);
  if (match) {
    return match[1];
  }

  return headerValue.trim();
}

function buildRawMimeEmail({ from, to, subject, htmlBody, attachmentBase64 }) {
  // Using boundary for multipart message
  const boundary = "NextPartBoundary123456";

  return Buffer.from(
    [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset="UTF-8"`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      `${htmlBody}`,
      ``,
      `--${boundary}`,
      `Content-Type: application/pdf; name="ComplianceSummary.pdf"`,
      `Content-Disposition: attachment; filename="ComplianceSummary.pdf"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      `${attachmentBase64}`,
      ``,
      `--${boundary}--`,
      ``,
    ].join("\r\n")
  );
}

async function getAttachmentBase64(bucket, key) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3.send(command);
  const buffer = await streamToBuffer(response.Body);
  return buffer.toString("base64");
}

async function sendEmailWithAttachment({
  from,
  to,
  subject,
  htmlBody,
  attachmentBase64,
}) {
  const rawEmailString = buildRawMimeEmail({
    from,
    to,
    subject,
    htmlBody,
    attachmentBase64,
  });

  const rawEmailBuffer = Buffer.from(rawEmailString, "utf-8");

  const command = new SendRawEmailCommand({
    RawMessage: {
      Data: rawEmailBuffer,
    },
  });

  await ses.send(command);
}

function extractSmtpId(emailRawText) {
  const match = emailRawText.match(/SMTP id ([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

const isAutoReply = (headers) =>
  headers["auto-submitted"]?.toLowerCase() === "auto-replied" ||
  headers["precedence"]?.toLowerCase() === "bulk" ||
  headers["x-autoreply"]?.toLowerCase() === "yes" ||
  headers["x-autorespond"]?.toLowerCase() === "yes";

function extractStructuredBlock(plainText) {
  if (typeof plainText !== "string") return {};

  const structured = {};
  const lines = plainText.split(/\r?\n/);

  for (let line of lines) {
    line = line.replace(/^\*\t/, "").trim();

    // Match: **label:** value or * *label:* value or label: value
    const match = line.match(/^\*?\s*\*?\s*([^:*]+?)\s*\*?\*?:\s*(.*)$/);

    if (match) {
      let rawKey = match[1].trim().toLowerCase(); // e.g., "* *name" => "name"
      let rawValue = match[2].trim(); // e.g., "* John" => "John"

      rawKey = rawKey.replace(/^\*+\s*/, "");
      rawValue = rawValue.replace(/^\*+\s*/, "");

      structured[rawKey] = rawValue;
    }
  }

  return structured;
}

function extractSubjectFromBody(rawBody) {
  if (!rawBody) return null;
  const match = rawBody.match(/^[ \t]*\*+\s*subject\s*:\s*(.+)$/im);

  return match ? match[1].trim() : null;
}

function extractPlainText(raw) {
  const plainMatch = raw.match(
    /Content-Type:\s*text\/plain[^]*?\r?\n\r?\n([^]*?)(?:\r?\n--|\r?\nContent-Type:)/i
  );
  return plainMatch ? plainMatch[1].trim() : raw;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/>/g, "&gt;");
}

const extractField = (body, fieldName) => {
  const regex = new RegExp(`\\*\\s*\\*${fieldName}:\\*\\s*(.*)`, "i");
  const match = body.match(regex);
  return match ? match[1].trim().replace(/^\*?\s*/, "") : "";
};

const isValidEmail = (addr) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr);

function extractTrimmedNumbers(subject) {
  let numbers = subject.replace(/\D/g, "");
  let trimmed = numbers.startsWith("20") ? numbers.slice(2) : numbers;
  return `1-${trimmed}Z`;
}

const fieldInclusionMap = {
  "privacy complaint": ["subject", "message", "name", "email", "company"],
  "technical issue": ["subject", "message", "name", "email", "company"],
  "suggestion for improvement": [
    "subject",
    "message",
    "name",
    "email",
    "company",
  ],
  "request for assistance": ["subject", "message", "name", "email", "company"],
  "general contact": ["subject", "message", "name", "email", "company"],
  "join the waitlist": ["subject", "message", "name", "email", "company"],
  booking: ["subject", "message", "name", "email", "date", "time", "company"],
  "your compliance navigator summary": ["name", "email", "company"],
  "admin user created": ["subject", "name", "email", "company"],
  "user created": ["subject", "name", "email", "company"],
  "ptrs sign up": ["subject", "name", "email", "company"],
  default: ["subject"],
};

function formatStructuredBlockForHtml(structuredBlock, subjectLineRaw) {
  const logoUrl =
    "https://monochrome-assets.s3.ap-southeast-2.amazonaws.com/logo-no-background.png";
  const subjectLine = (subjectLineRaw || "").trim().toLowerCase();
  const allowedFields =
    fieldInclusionMap[subjectLine] || fieldInclusionMap["default"];

  if (typeof structuredBlock !== "object" || !structuredBlock) return "";

  const formattedFields = Object.entries(structuredBlock)
    .filter(([key]) => allowedFields.includes(key.toLowerCase()))
    .map(([key, value]) => {
      const capitalisedLabel = key.charAt(0).toUpperCase() + key.slice(1);
      return `<p style="font-size: 13px; margin: 4px 0;"><strong>${escapeHtml(capitalisedLabel)}:</strong> ${escapeHtml(value)}</p>`;
    })
    .join("");

  return `
    <div style="margin-bottom: 20px;">
      <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 10px;">
        <tr>
          <td>
            <img 
              src="${logoUrl}" 
              alt="Monochrome Logo" 
              width="260" 
              style="display: block; border: 0; width: 260px; height: auto; max-width: 100%;" 
            />
          </td>
        </tr>
      </table>
      ${formattedFields}
    </div>
  `;
}

export const handler = async (event) => {
  console.log("LOG TEST ENTRY");
  console.log("Incoming Event:", JSON.stringify(event, null, 2));
  const allowedOrigins = [
    "https://www.monochrome-compliance.com",
    "http://localhost:3000",
  ];
  const origin = event.headers?.origin || "";
  const corsOrigin = allowedOrigins.includes(origin) ? origin : "";
  // Handle CORS preflight OPTIONS request (API Gateway or Lambda Function URL)
  const method =
    event?.requestContext?.http?.method ||
    event?.requestContext?.method ||
    event?.httpMethod ||
    "";
  console.log("Detected HTTP Method:", method);

  // Log request headers before CORS preflight
  console.log("Received request headers:", event.headers);

  if (method === "OPTIONS") {
    // Log CORS preflight response headers before returning
    console.log("Responding to CORS preflight with headers:", {
      "Access-Control-Allow-Origin": corsOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      Vary: "Origin",
    });
    console.log("Returning from OPTIONS preflight handler.");
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": corsOrigin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        Vary: "Origin",
      },
      body: JSON.stringify({ message: "CORS preflight OK" }),
    };
  }
  try {
    // Handle direct POST to Lambda URL (no event.Records)
    if (event.body && !event.Records) {
      const parsed =
        typeof event.body === "string" ? JSON.parse(event.body) : event.body;
      // Log parsed payload before sending email
      console.log("Parsed payload:", parsed);
      const subject = parsed.subject || "General Contact";
      const name = parsed.name || "there";
      const email = parsed.email || "contact@monochrome-compliance.com";
      const message = parsed.message || "";

      const htmlBody = `
        <html><body>
          <p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <p><strong>Message:</strong><br>${escapeHtml(message)}</p>
        </body></html>
      `;

      const emailParams = {
        Destination: { ToAddresses: ["contact@monochrome-compliance.com"] },
        Message: {
          Body: { Html: { Charset: "UTF-8", Data: htmlBody } },
          Subject: { Charset: "UTF-8", Data: `New Contact Form: ${subject}` },
        },
        Source: "contact@monochrome-compliance.com",
      };

      console.log(
        "Sending email with subject:",
        `New Contact Form: ${subject}`
      );
      await ses.send(new SendEmailCommand(emailParams));
      console.log("SES send successful.");

      console.log("Returning from direct POST handler.");
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": corsOrigin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
          Vary: "Origin",
        },
        body: JSON.stringify("Email sent via Lambda successfully."),
      };
    }
    const record = event.Records?.[0] || {};
    const receipt = record?.ses?.receipt;
    const bucket = record.s3?.bucket?.name;
    const key = decodeURIComponent(record.s3?.object?.key || "");
    const rawBody = (await getEmailBodyFromS3(bucket, key)) || "";
    const plainText = extractPlainText(rawBody);
    //console.log('Plain text:', JSON.stringify(plainText));
    const extractedSubject =
      extractSubjectFromBody(plainText) || extractSubjectHeader(rawBody);
    //console.log('Extracted subject:\n', extractedSubject);
    const smtpId = extractSmtpId(rawBody);
    console.log("SMTP ID:", smtpId);

    const structuredBlock = extractStructuredBlock(plainText);
    console.log("Structured Block:\n", structuredBlock);
    const formattedBlock = formatStructuredBlockForHtml(
      structuredBlock,
      extractedSubject
    );
    const quotedOriginal = `
	  <div style="margin-top:10px">
		<hr>
		<div style="margin-top:10px">
		  <div style="margin-left: 25px; font-family: Arial, sans-serif; color: #333;">
			<p style="font-size: 13px; margin-top: 0;">Original Submission:</p>
			${formattedBlock}
		  </div>
		</div>
	  </div>
	`;
    console.log("Quoted Original:\n", quotedOriginal);

    // Removed PDF extraction and attachmentBase64 logic block as per instructions.
    let attachmentBase64 = undefined;

    const mailInfo = record?.ses?.mail || {};
    // console.log('Mail Info:\n', mailInfo);
    const commonHeaders = parseRawHeaders(rawBody) || {};
    // console.log('Common Headers:\n', commonHeaders);

    const parsedHeaders = parseRawHeaders(rawBody);
    if (isAutoReply(parsedHeaders)) {
      console.log("Detected auto-reply or bulk message — skipping response.");
      console.log("Returning from auto-reply skip handler.");
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": corsOrigin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        },
        body: JSON.stringify("Skipped auto-reply."),
      };
    }

    const originalSubject = extractSubjectHeader(rawBody);
    const service_request_number = extractTrimmedNumbers(originalSubject);
    const fromAddress = extractEmailAddress(commonHeaders.from);
    console.log("From Address:\n", fromAddress);
    const clientemail_ii = isValidEmail(fromAddress)
      ? fromAddress
      : "mitch.pentz@monochrome-compliance.com";
    console.log("Client Email II:\n", clientemail_ii);

    const senderName = (() => {
      const rawFrom = commonHeaders.from || "";
      const encoded = rawFrom.match(/=\?[^?]+\?[Qq]\?([^?]+)\?=/);
      if (encoded) {
        return encoded[1]
          .replace(/_/g, " ")
          .replace(/=([A-Fa-f0-9]{2})/g, (_, h) =>
            String.fromCharCode(parseInt(h, 16))
          );
      }
      const match = rawFrom.match(/^"?([^"<]+)"?\s*</);
      return match ? match[1].trim() : "there";
    })();
    console.log("Sender Name:\n", senderName);

    if (!bucket || !key) {
      throw new Error("Missing S3 bucket or object key info");
    }

    const subject = extractField(rawBody, "subject");
    const message = extractField(rawBody, "message");
    const clientName = structuredBlock.name || senderName;
    console.log("Client Name:\n", clientName);
    const bookingDate = structuredBlock.date;
    console.log("Booking Date:\n", bookingDate);
    const bookingDateFormatted =
      bookingDate && /^\d{4}-\d{2}-\d{2}$/.test(bookingDate)
        ? new Date(bookingDate).toLocaleDateString("en-AU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : bookingDate;
    const bookingTime = structuredBlock.time;
    console.log("Booking Time:\n", bookingTime);
    const clientCompany = extractField(rawBody, "company");
    const fromSource = "contact@monochrome-compliance.com";
    let clientemail = structuredBlock.email || extractField(rawBody, "email");

    if (clientemail) {
      clientemail = clientemail.replace(/[^a-zA-Z0-9@._+-]/g, "").trim();
    }
    console.log("Client Email:\n", clientemail);

    const toAddress = clientemail || clientemail_ii;
    // clientemail || clientemail_ii;
    console.log("To Address:\n", toAddress);

    if (!toAddress || !isValidEmail(toAddress)) {
      throw new Error(
        `Invalid or missing recipient email address: "${toAddress}"`
      );
    }

    let htmlBody = "";
    let emailSubject = "Thank you for contacting Monochrome Compliance";

    const homeLink = "https://monochrome-compliance.com";
    const privacyPolicyLink =
      "https://monochrome-compliance.com/policy-documents/privacy-policy";
    const signUpLink = "https://monochrome-compliance.com/signup"; // Replace with real link
    const bookingLink = "https://monochrome-compliance.com/booking";
    const faqLink = "https://monochrome-compliance.com/faq";
    const processMapLink = "https://monochrome-compliance.com/overview";
    const blogLink = "https://monochrome-compliance.com/blog";
    const communityLink = "https://monochrome-compliance.com/community"; // Replace with real link
    const adminDashyLink = "https://monochrome-compliance.com/admin-dashboard"; // Replace with real link
    const stdDashyLink = "https://monochrome-compliance.com/dashboard"; // Replace with real link

    const emailSignature = `
	  <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 10px;">
		<tr>
		  <td valign="top" style="padding-right: 10px;">
			<img 
			  src="https://monochrome-assets.s3.ap-southeast-2.amazonaws.com/logo_M_only.png" 
			  alt="Monochrome Logo" 
			  width="50" 
			  height="50" 
			  style="display: block;" 
			/>
		  </td>
		  <td valign="top" style="font-family: sans-serif; font-size: 14px; color: #333; line-height: 1.1;">
			<span style="display: inline;">The Monochrome Compliance Team</span><br>
			<span style="display: inline;"><strong>Monochrome Compliance Pty Ltd</strong> | ABN 20687127386</span><br>
			<span style="display: inline;">
			  <a href="${homeLink}" style="color: #0066cc; text-decoration: none;">www.monochrome-compliance.com</a>
			</span>
		  </td>
		</tr>
	  </table>
	`;

    if (fromSource.toLowerCase() === "contact@monochrome-compliance.com") {
      switch (extractedSubject?.trim().toLowerCase()) {
        case "privacy complaint":
          emailSubject =
            "Monochrome Compliance – Privacy Complaint Acknowledgement";
          htmlBody = `
		<html><body>
		  <p>Hi ${clientName},</p>
			<p>Thank you for reaching out to Monochrome Compliance.</p>
			<p>We acknowledge receipt of your privacy complaint, and we want to assure you that it will be treated with the attention and seriousness it deserves. Protecting personal information is a core commitment of our organisation, and we take all concerns related to privacy with the utmost care.</p>
			<p>Your complaint has now been logged and will be reviewed in accordance with the procedures outlined in our <a href="${privacyPolicyLink}">Privacy Policy</a>. We will respond to your complaint within the time frame specified in that policy, and always in compliance with our obligations under the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs). Where relevant, we also align with the Information Privacy Act 2009 (Qld).</p>
			<p>We are committed to investigating your concerns thoroughly and fairly, and to rectifying any issues found without unnecessary delay.</p>
			<p>If you have any supporting information you would like to provide to assist in the review, please feel free to forward it to this address or reply to this email.</p>
			<p>Thank you for bringing this matter to our attention.</p>
			<p>Warm regards,</p>
			${emailSignature}
		  </body>
		</html>
		`;
          htmlBody += quotedOriginal;
          break;

        case "technical issue":
          emailSubject = `Issue Reported: ${service_request_number}`;
          htmlBody = `
		<html><body>
		  <p>Hi ${clientName},</p>
			<p>Thank you for contacting Monochrome Compliance to report a technical issue. We appreciate you taking the time to raise this with us.</p>
			<p>Your report has been received and will be reviewed by our team promptly. It will be triaged and addressed based on its priority, and we are committed to working towards a swift and effective resolution.</p>
			<p>We’ll keep you updated on our progress, and may reach out for further information if needed to assist in replicating, diagnosing or resolving the issue. Your continued patience and collaboration are appreciated while we work to put things right.</p>
			<p>If you have any additional context or updates to share in the meantime, please feel free to reply to this email.</p>
			<p>Warm regards,</p>
			${emailSignature}
		  </body>
		</html>
		`;
          htmlBody += quotedOriginal;
          break;

        case "booking":
          emailSubject = "We’re looking forward to speaking with you";
          htmlBody = `
        <html><body>
          <p>Hi ${clientName},</p>
			<p>Thanks for booking an appointment with us on ${bookingDateFormatted} at ${bookingTime}. We are looking forward to helping you and ${clientCompany} move forward with confidence.</p>
			<p>Your dedicated Compliance Specialist, Mitch Pentz, will be in touch at the scheduled time.</p>
			<p>Mitch is a Chartered Accountant (CAANZ) with over 20 years of experience helping businesses shift from manual, time-consuming processes to smart, streamlined solutions. With a passion for automation and a deep respect for accountability and transparency, Mitch has spent his career championing efficient compliance — with a particular focus on removing unnecessary reporting burdens from finance teams.</p>
			<p>In fact, the PTRS used to be the most tedious part of his own compliance responsibilities — which is exactly why working directly with Australian finance professionals to simplify and automate the process has become such an exciting and meaningful mission for him.</p>
			<p>You can expect your session to be focused, informative, and above all, respectful of your time. If anything changes before your appointment or you need to adjust the time, please don’t hesitate to get in touch.</p>
			<p>We’re here to make PTRS reporting smarter — not harder.</p>
			<p>Warm regards,</p>
			${emailSignature}
		  </body>
		</html>
		`;
          htmlBody += quotedOriginal;
          break;

        case "general contact":
          emailSubject = "Monochrome Compliance – Thanks for Reaching Out";
          htmlBody = `
			  <html><body>
				<p>Hi ${clientName},</p>
				  <p>Thank you for reaching out to <strong>Monochrome Compliance</strong>. A member of our team will review your enquiry and respond personally within one business day.</p>
				  <hr style="border: none; border-top: 1px solid #ccc;" />
				  <h3 style="margin-top: 30px;">Get a head start — open your free account</h3>
				  <p>While you’re waiting, feel free to explore the platform. Creating a free account gives you instant, no obligation access to our step-by-step guide to completing your PTRS reporting, and a dummy company’s report showing how the platform works and streamlines your obligations.</p>
				  <p><strong>👉 <a href="{{Sign Up Link}}">Create your free account</a></strong></p>
				  <hr style="border: none; border-top: 1px solid #ccc;" />
				  <h3 style="margin-top: 30px;">The 30 June 2025 deadline is fast approaching</h3>
				  <p>Most organisations must lodge PTRS reports by <strong>30 June 2025</strong>. To find out whether you have a reporting obligation, complete our quick online navigator:</p>
				  <p><strong>👉 <a href="{{Questionnaire Link}}">Assess your obligation</a></strong></p>
				  <p>Many resources are available on our website, including blogs and FAQ’s. If you still need help, <a href="${bookingLink}" style="color: #0066cc;">book an appointment</a> with one of our compliance specialists. Slots fill quickly as the deadline nears, so reserve yours ASAP.</p>
				  <hr style="border: none; border-top: 1px solid #ccc;" />
				  <h3 style="margin-top: 30px;">We’re here to make PTRS easy</h3>
				  <p>Our step-by-step process walks you through every requirement, ensuring report preparation with confidence, enabling peace of mind submission backed by a complete audit trail that meets or exceeds regulatory requirements.</p>
				  <p>We look forward to helping you meet your PTRS obligations smoothly and on time.</p>
				  <p style="margin-top: 40px;">Warm regards,</p>
				  ${emailSignature}
				</body>
			  </html>
			  `;
          htmlBody += quotedOriginal;
          break;

        case "join the waitlist":
          emailSubject = "Monochrome Compliance – You're on our Waitlist!";
          htmlBody = `
		<html><body>
          <p>Hi ${clientName},</p>
			<p>Thank you for reaching out to <strong>Monochrome Compliance</strong>. A member of our team respond personally within one business day.</p>
			<hr style="border: none; border-top: 1px solid #ccc;" />
			<h3 style="margin-top: 30px;">Get a head start — open your free account</h3>
			<p>While you’re waiting, feel free to explore the platform. Creating a free account gives you instant, no obligation access to our step-by-step guide to completing your PTRS reporting, and a dummy company’s report showing how the platform works and streamlines your obligations.</p>
			<p><strong>👉 <a href="{{Sign Up Link}}">Create your free account</a></strong></p>
			<hr style="border: none; border-top: 1px solid #ccc;" />
			<h3 style="margin-top: 30px;">The 30 June 2025 deadline is fast approaching</h3>
			<p>Most organisations must lodge PTRS reports by <strong>30 June 2025</strong>. To find out whether you have a reporting obligation, complete our quick online navigator:</p>
			<p><strong>👉 <a href="{{Questionnaire Link}}">Assess your obligation</a></strong></p>
			<p>Many resources are available on our website, including blogs and FAQ’s. If you still need help, <a href="${bookingLink}" style="color: #0066cc;">book an appointment</a> with one of our compliance specialists. Slots fill quickly as the deadline nears, so reserve yours ASAP.</p>
			<hr style="border: none; border-top: 1px solid #ccc;" />
			<h3 style="margin-top: 30px;">We’re here to make PTRS easy</h3>
			<p>Our step-by-step process walks you through every requirement, ensuring report preparation with confidence, enabling peace of mind submission backed by a complete audit trail that meets or exceeds regulatory requirements.</p>
			<p>We look forward to helping you meet your PTRS obligations smoothly and on time.</p>
			<p style="margin-top: 40px;">Warm regards,</p>
			${emailSignature}
		  </body>
		</html>
		`;
          htmlBody += quotedOriginal;
          break;

        case "your compliance navigator summary":
          emailSubject = "Monochrome Compliance – PTRS Navigator Responses";
          htmlBody = `
		<html><body>
		  <p>Hi ${clientName},</p>
			<p>Thank you for using the <strong>PTRS Navigator</strong> on the <strong>Monochrome Compliance</strong> platform.</p>
			<p>Attached to this email, you’ll find a PDF summary of your responses, along with our preliminary assessment of your reporting obligations under the PTRS legislation, based on those responses.</p>
			<hr style="border: none; border-top: 1px solid #ccc;">
			<h3 style="margin-top: 20px;">Please read this important note</h3>
			<p>This preliminary assessment is informational only and does not constitute legal advice. The outcome is based entirely on your responses, and we are not responsible for any inaccuracies that may result from incomplete or incorrect inputs.</p>
			<p>If you’re unsure about any of your responses, we strongly recommend seeking independent legal advice. You can also check out our <a href="${faqLink}">FAQs</a> or book an appointment with our team — we're here to support you:<br>
			<p><strong>👉 <a href="${bookingLink}">Book now</a></strong></p>
			<hr style="border: none; border-top: 1px solid #ccc;">
			<h3 style="margin-top: 20px;">Explore your next steps with a free account</h3>
			<p>Create a free account to explore how <strong>Monochrome Compliance</strong> helps you prepare and submit fully compliant PTRS reports. Your free account gives you access to:</p>
			<ul style="margin-top: 0;">
			<li>A clear, step-by-step guide to fulfilling your PTRS obligations</li>
			<li>A dummy company report showing how the platform works</li>
			</ul>
			<p><strong>👉 <a href="${signUpLink}">Create your free account</a></strong></p>
			<hr style="border: none; border-top: 1px solid #ccc;">
			<h3 style="margin-top: 20px;">Confidence in every step</h3>
			<p>At <strong>Monochrome Compliance</strong>, our structured process ensures your reports are prepared with clarity, enabling submissions with confidence — supported by a full audit trail and documentation that meets or exceeds regulatory requirements.</p>
			<p>Warm regards,</p>
			${emailSignature}
		  </body>
		</html>
		`;
          htmlBody += quotedOriginal;
          break;

        case "admin user created":
          emailSubject =
            "Your Admin Access to Monochrome Compliance Is Now Live";
          htmlBody = `
		<html><body>
		  <p>Hi ${clientName},</p>
			<p><strong>Welcome aboard!</strong> We’re excited to have you on the <strong>Monochrome Compliance</strong> platform.</p>
			<p>As an <strong>Administrator</strong>, you play a central role in managing your organisation’s PTRS reporting journey — and the tools at your fingertips are designed to provide both oversight and clarity.</p>
			<hr style="border: none; border-top: 1px solid #ccc;">
			<h3 style="margin-top: 20px;">What’s in your <a href="${adminDashyLink}">admin dashboard?</a></h3>
			<p>Your dashboard includes:</p>
			<ul style="margin-top: 0;">
			<li>The full fee schedule outlining available plans</li>
			<li>User management — add team members via the wizard on the Users page</li>
			<li>Click-through access to the Standard User Dashboard</li>
			</ul>
			<p>Whether you’re overseeing one report or many, these tools help you stay in control while ensuring full compliance.</p>
			<hr style="border: none; border-top: 1px solid #ccc;">
			<h3 style="margin-top: 20px;">Fee schedule, referral credits & early discounts</h3>
			<p>Access the full fee schedule in your dashboard, which includes:</p>
			<ul style="margin-top: 0;">
			<li>Pricing for upgraded features</li>
			<li>A referral program — earn credits for referring others</li>
			<li>Early payment discounts for the first 10 new paying clients each cycle</li>
			</ul>
			<p>Since you’re among the first 10 to open an account this cycle, upgrading now will secure your early discount.</p>
			<hr style="border: none; border-top: 1px solid #ccc;">
			<h3 style="margin-top: 20px;">See the big picture</h3>
			<p>Explore how the reporting process fits together:<br>
			<p><strong>👉 <a href="${processMapLink}">View the process map</a></strong></p>
			<hr style="border: none; border-top: 1px solid #ccc;">
			<p>We’re here to support you and your team at every step — from onboarding users to submitting confident, compliant reports.</p>
			<p>Kind regards,</p>
			${emailSignature}
		  </body>
		</html>
		`;
          break;

        case "user created":
          emailSubject = "Welcome to Your Monochrome Compliance Dashboard";
          htmlBody = `
		<html><body>
		  <p>Hi ${clientName},</p>
			<p><strong>Welcome to Monochrome Compliance!</strong> You now have access to the tools and workflows that make preparing PTRS reports simpler, clearer, and more structured.</p>
			<p>Your <strong>👉 <a href="${stdDashyLink}">User Dashboard</a></strong> is where you’ll manage your reporting progress and access everything you need to get started.</p>
			<hr style="border: none; border-top: 1px solid #ccc;">
			<h3 style="margin-top: 20px;">What you’ll see on your dashboard</h3>
			<ul style="margin-top: 0;">
			<li>The dummy company report — a walkthrough example showing how reports come together</li>
			<li>A button to create a new report using our step-by-step PTRS workflow</li>
			<li>Any in-progress reports you’ve already started, with options to resume or restart</li>
			</ul>
			<p>Everything is designed to keep your workflow intuitive and your compliance process on track.</p>
			<hr style="border: none; border-top: 1px solid #ccc;">
			<h3 style="margin-top: 20px;">Upgrading your account</h3>
			<p>If your organisation is still on a free account, you’ll be able to explore the dummy report and view your dashboard, but starting a new report will prompt an upgrade.</p>
			<p>Just ask your Admin User to review the available plans and approve the upgrade to unlock full access. The fee schedule, referral program, and early client discounts are all available to them on their admin dashboard.</p>
			<hr style="border: none; border-top: 1px solid #ccc;">
			<h3 style="margin-top: 20px;">Need help getting started?</h3>
			<p>Check out our quick guide to how the full process works:<br>
			<p><strong>👉 <a href="${processMapLink}">View the process map</a></strong></p>
			<hr style="border: none; border-top: 1px solid #ccc;">
			<p>We’re here to support you — every report, every step, every time.</p>
			<p>Kind regards,</p>
			${emailSignature}
		  </body>
		</html>
		`;
          htmlBody += quotedOriginal;
          break;

        case "ptrs sign up":
          emailSubject =
            "Monochrome Compliance - Thanks for Expressing your Interest";
          htmlBody = `
		<html><body>
		  <p>Hi ${clientName},</p>
			  <p>Thank you for confirming your interest in the <strong>Monochrome Compliance</strong> platform — it’s great to see your organisation taking proactive steps toward streamlined, confident reporting.</p>

			  <p>We’ll be in touch shortly to guide you through the next steps, but if you’d prefer to secure a time that suits you best, please go ahead and <strong><a href="${bookingLink}">book an onboarding slot</a></strong> with us now.</p>

			  <p>With the reporting deadline approaching fast, we recommend locking in the earliest available time — slots are already filling up, and we want to ensure you have the support you need when you need it.</p>

			  <hr style="border: none; border-top: 1px solid #ccc;" />
			  <h3 style="margin-top: 30px;">Here’s what happens next</h3>
			  <ul style="margin-top: 0;">
				<li>We’ll reach out to finalise your onboarding</li>
				<li>We'll walk you through the platform and help set up your reporting workflow</li>
				<li>You’ll receive guidance tailored to your organisation’s reporting obligations</li>
			  </ul>
			  <p>You've taken the first important step — and it’s not a small one. The PTRS regime is here, the deadlines are real, and regulators are expecting full compliance from every organisation within scope. We're here to make sure you meet that bar with clarity and confidence.</p>
			  <p>We’re excited to help you move forward from here.</p>
			<p>Kind regards,</p>
			${emailSignature}
		  </body>
		</html>
		`;
          htmlBody += quotedOriginal;
          break;

        case "suggestion for improvement":
          emailSubject =
            "Monochrome Compliance – Thank You for Your Suggestion";
          htmlBody = `
		<html><body>
		  <p>Hi ${clientName},</p>
			<p>Thank you for taking the time to share your suggestion with us.</p>
			<p>At <strong>Monochrome Compliance</strong>, we’re committed to making your experience as smooth, intuitive, and effective as possible — and it's thoughtful contributions like yours that help us enhance the platform for everyone.</p>
			<p>Your suggestion has been received and will be carefully considered as part of our ongoing efforts to improve functionality and user experience. While not all ideas can be implemented immediately, every one is reviewed on its merits, and yours is no exception.</p>
			<p>If you're open to it, we’d love your permission to publish your suggestion (anonymously or attributed, as you prefer) to our upcoming <strong>User Suggestions</strong> page. This would allow other users to contribute their thoughts and vote on ideas, helping us prioritise the features that matter most to the community.</p>
			<p>Please feel free to reply with any additional context or detail that might help us better understand your suggestion — and let us know if you’re happy for it to be shared on the page.</p>
			<p>Thanks again for helping us make PTRS reporting better for everyone.</p>
			<p>Warm regards,</p>
			${emailSignature}
		  </body>
		</html>
		`;
          htmlBody += quotedOriginal;
          break;

        case "request for assistance":
          emailSubject = "Monochrome Compliance – Request for Assistance";
          htmlBody = `
		<html><body>
		  <p>Hi ${clientName},</p>
			<p>Thanks for reaching out — we understand that even with a structured process, there can be moments when things just don’t click. We’ve received your request for assistance and want you to know we’re here for you.</p>
			<p>Your message has been passed to our team and will be personally reviewed within the next 24 hours. If your query relates to a technical matter or needs a bit of training or clarification, we’ll get back to you directly with the right support as soon as possible.</p>
			<p>In the meantime, you may find it helpful to check out:</p>
			<ul>
			<li><a href="${faqLink}">Our FAQs</a> – quick answers to common questions</li>
			<li><a href="${blogLink}">Our Blog</a> – useful tips and compliance insights</li>
			</ul>
			<p>If you're still stuck or would prefer a one-on-one walkthrough, you’re always welcome to <a href="${bookingLink}">book an appointment</a> with one of our compliance specialists.</p>
			<p>At <strong>Monochrome Compliance</strong>, we’re fully committed to making your experience seamless and empowering — and that includes making sure help is there when you need it most. We’ll be back in touch shortly.</p>
			<p>Warm regards,</p>
			${emailSignature}
		  </body>
		</html>
		`;
          htmlBody += quotedOriginal;
          break;

        // keeping the text in the line immediately below for when we have a community page. Can place it below the blog link in the above message for request for assistance
        // <li><a href="${communityLink}">Our Community Page</a> – coming soon, this is where users will connect, collaborate, and contribute</li>

        default:
          emailSubject = `Thank you for contacting Monochrome Compliance`;
          htmlBody = `
		<html><body>
		  <p>Hi ${clientName},</p>
			<p>Thank you for your message.</p>
			<p>Our team will review and get back to you shortly.</p>
			<p>Warm regards,</p>
			${emailSignature}
		  </body>
		</html>
		`;
          htmlBody += quotedOriginal;
      }
    } else {
      emailSubject = `Re: ${originalSubject}`;
      htmlBody = `
			<html><body>
			  <p>Hi ${senderName},</p>
				<p>Thanks for reaching out to us at Monochrome Compliance.</p>
				<p>We'll get back to you shortly!</p>
				<p>Warm regards,</p>
				${emailSignature}
			  </body>
			</html>
			`;
    }

    if (
      extractedSubject?.trim().toLowerCase() ===
      "your compliance navigator summary"
    ) {
      try {
        console.log("Sending email with subject:", emailSubject);
        await sendEmailWithAttachment({
          from: "contact@monochrome-compliance.com",
          to: toAddress,
          subject: emailSubject,
          htmlBody,
          attachmentBase64, // will be undefined since extraction is removed
        });
        console.log("SES send successful.");
        console.log(
          "Compliance Navigator Summary email with attachment sent successfully."
        );
      } catch (error) {
        console.error(
          "Error sending Compliance Navigator Summary email:",
          error,
          "\nEvent was:",
          JSON.stringify(event, null, 2)
        );
        throw error;
      }
    } else {
      console.log("Sending email with subject:", emailSubject);
      await ses.send(
        new SendEmailCommand({
          Destination: { ToAddresses: [toAddress] },
          Message: {
            Body: { Html: { Charset: "UTF-8", Data: htmlBody } },
            Subject: { Charset: "UTF-8", Data: emailSubject },
          },
          Source: "contact@monochrome-compliance.com",
        })
      );
      console.log("SES send successful.");
    }

    console.log("Returning from main handler after SES send.");
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": corsOrigin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        Vary: "Origin",
      },
      body: JSON.stringify("Auto-response sent successfully."),
    };
  } catch (error) {
    console.error(
      "Error sending auto-response:",
      error,
      "\nEvent was:",
      JSON.stringify(event, null, 2)
    );
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": corsOrigin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        Vary: "Origin",
      },
      body: JSON.stringify("Failed to send auto-response."),
    };
  }
};
