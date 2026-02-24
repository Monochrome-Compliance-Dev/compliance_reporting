import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Utility to load an image as base64
export async function loadImage(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

// Main PDF generator
export async function handlePdf(recordId, answers, flowQuestions) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const marginLeft = 20;
  const marginTop = 20;
  const lineHeight = 7;
  let y = marginTop;

  const date = new Date().toLocaleString();
  const companyName = "Monochrome Compliance";
  const subtitleLine1 = "Compliance Navigator Summary";
  const subtitleLine2 = "Payment Times Reporting Scheme (PTRS)";
  const logoPath = "/images/logos/logo-light-m.png";

  const determineReportingRequirement = (answers) => {
    if (answers.charity === "Yes") {
      return {
        required: false,
        reason:
          "As a registered charity, the entity probably does not need to report. For more information, refer to Section 6(1)(e) of the Payment Times Reporting Act 2020.",
      };
    }
    if (answers.section7 !== "Yes") {
      return {
        required: false,
        reason:
          "As the entity has not been assessed under Section 7 of the Payment Times Reporting Act 2020, we are unable to provide guidance. For more information, refer to Section 6(1)(e) of the Payment Times Reporting Act 2020.",
      };
    }
    if (
      !answers.connectionToAustralia ||
      answers.connectionToAustralia.includes("None of the above")
    ) {
      return {
        required: false,
        reason:
          "The entity does not appear to have a sufficient connection to Australia to necessiate submitting a report. We recommend consulting with your legal or compliance team for further guidance, in conjunction with reviewing the Guidance Note from the Regulator.",
      };
    }
    if (answers.controlled === "Yes") {
      return {
        required: false,
        reason:
          "The entity is controlled by another reporting entity and should be included in their report.",
      };
    }
    if (answers.cce === "Yes" && answers.revenue === "Yes") {
      return {
        required: true,
        reason:
          "The entity is a Constitutionally Covered Entity with revenue over A$100M; PTRS reporting is required.",
      };
    }
    return {
      required: false,
      reason:
        "Based on your responses, PTRS reporting likely not required. We strongly recommend consulting with your legal or compliance team for further guidance, in conjunction with reviewing the Guidance Note from the Regulator.",
    };
  };

  const result = determineReportingRequirement(answers);

  // Background
  doc.setFillColor("#eceff1");
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Header: logo + title
  try {
    const logo = await loadImage(logoPath);
    doc.addImage(logo, "PNG", marginLeft, y, 25, 25);
  } catch (e) {
    doc.setFontSize(14);
    doc.setTextColor("#4d4d4d");
    doc.text("[Logo]", marginLeft, y + 10);
  }

  doc.setFontSize(18);
  doc.setTextColor("#141414");
  doc.text(companyName, marginLeft + 30, y + 8);
  doc.setFontSize(12);
  doc.text(subtitleLine1, marginLeft + 30, y + 16);
  doc.text(subtitleLine2, marginLeft + 30, y + 22);
  y += 36;

  // Intro context
  doc.setFontSize(10);
  doc.setTextColor("#4d4d4d");
  const introText =
    "This document provides a summary of the answers submitted through the Compliance Navigator tool on our website. It is intended to assist you in determining your organisation’s obligations under the Payment Times Reporting Scheme (PTRS).";
  const wrappedIntro = doc.splitTextToSize(
    introText,
    pageWidth - marginLeft * 2
  );
  doc.text(wrappedIntro, marginLeft, y);
  y += wrappedIntro.length * lineHeight;

  // Report reference and navigator outcome with reason replaced by metadata table
  const metadataTable = [
    ["PTR Submission Required", result.required ? "Yes" : "No"],
    ["Assessment Summary", result.reason],
    ["Reference", `${recordId} on ${date}`],
  ];

  autoTable(doc, {
    head: [["Summary of Navigator Assessment", ""]],
    body: metadataTable,
    startY: y + 10,
    styles: {
      fontSize: 9,
      cellPadding: 2,
      valign: "top",
    },
    headStyles: {
      fillColor: [77, 77, 77],
      textColor: 255,
      fontStyle: "bold",
      halign: "left",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 60 },
      1: { cellWidth: pageWidth - marginLeft * 2 - 60 },
    },
    margin: { left: marginLeft, right: marginLeft },
    tableWidth: "wrap",
    didDrawCell: function (data) {
      if (data.section === "head" && data.column.index === 0) {
        data.cell.colSpan = 2;
      }
    },
  });

  if (doc.previousAutoTable) {
    y = doc.previousAutoTable.finalY + 20;
  }

  // Section: Summary Table
  const tableData = flowQuestions.map((q) => {
    const question =
      q.key === "entityDetails" ? "Entity details provided" : q.question;
    let answer = "No answer";

    if (q.key === "contactDetails") {
      const contactDetails = answers.contactDetails || {};
      answer = Object.entries(contactDetails)
        .map(([key, value]) => {
          const field = q.fields?.find((f) => f.name === key);
          return `${field?.label || key}: ${value || "—"}`;
        })
        .join("\n");
    } else if (q.key === "entityDetails") {
      answer = Object.entries(answers.entityDetails || {})
        .map(([key, value]) => {
          const field = q.fields?.find((f) => f.name === key);
          return `${field?.label || key}: ${value || "—"}`;
        })
        .join("\n");
    } else if (Array.isArray(answers[q.key])) {
      answer = answers[q.key].join(", ");
    } else if (typeof answers[q.key] === "object" && answers[q.key] !== null) {
      answer = Object.entries(answers[q.key])
        .map(([k, v]) => `${k}: ${v || "—"}`)
        .join("\n");
    } else {
      answer = answers[q.key] || "No answer";
    }

    return [question, answer];
  });

  // CTA
  const ctaText =
    "For a full assessment and to receive tailored reporting guidance, please contact our team at contact@monochrome-compliance.com.";
  const wrappedCTA = doc.splitTextToSize(ctaText, pageWidth - marginLeft * 2);
  doc.setFontSize(10);
  doc.setTextColor("#4d4d4d");
  doc.text(wrappedCTA, marginLeft, y - 2);
  y += wrappedCTA.length * lineHeight + 40;

  doc.setFontSize(11);
  doc.setTextColor("#141414");
  doc.text("Summary of Responses", marginLeft, y);
  const tableStartY = y + 6;

  autoTable(doc, {
    head: [["Question", "Answer"]],
    body: tableData,
    startY: tableStartY,
    styles: {
      fontSize: 9,
      cellPadding: 2,
      valign: "top",
    },
    headStyles: {
      fillColor: [77, 77, 77],
      textColor: 255,
      halign: "left",
    },
    bodyStyles: {
      lineColor: 240,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 85 },
      1: { cellWidth: pageWidth - marginLeft * 2 - 85 },
    },
    margin: { left: marginLeft, right: marginLeft },
    tableWidth: "wrap",
  });

  if (doc.previousAutoTable) {
    y = doc.previousAutoTable.finalY + 20;
  }

  const disclaimer =
    "This report is informational only and does not constitute legal advice. Final determination of reporting obligations should be made in consultation with your legal or compliance team.";
  const wrappedDisclaimer = doc.splitTextToSize(
    disclaimer,
    pageWidth - marginLeft * 2
  );
  doc.setFontSize(8);
  doc.setTextColor("#4d4d4d");
  doc.text(wrappedDisclaimer, marginLeft, y + 100);
  y += wrappedDisclaimer.length * lineHeight + 5;

  // Footer on all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor("#4d4d4d");
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - marginLeft - 30,
      pageHeight - 5
    );
  }

  doc.setFontSize(9);
  doc.setTextColor("#4d4d4d");
  doc.text(
    "© 2025 Monochrome Compliance | ABN 20687127386",
    marginLeft,
    pageHeight - 5
  );

  const pdfBlob = await doc.output("blob");
  return Promise.resolve(pdfBlob);
}
