const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const SHEET_NAME = "Standard report";

const ANZSIC_INDUSTRY_DIVISIONS = [
  "Accommodation and Food Services",
  "Administrative and Support Services",
  "Agriculture, Forestry and Fishing",
  "Arts and Recreation Services",
  "Construction",
  "Education and Training",
  "Electricity, Gas, Water and Waste Services",
  "Financial and Insurance Services",
  "Health Care and Social Assistance",
  "Information Media and Telecommunications",
  "Manufacturing",
  "Mining",
  "Other Services",
  "Professional, Scientific and Technical Services",
  "Public Administration and Safety",
  "Rental, Hiring and Real Estate Services",
  "Retail Trade",
  "Transport, Postal and Warehousing",
  "Wholesale Trade",
];

const REQUIRED_COLUMNS = [
  "ReportId",
  "Business Name",
  "ABN",
  "ACN/ARBN",
  "Reporting Period Start Date",
  "Reporting Period End Date",
  "Revised Report",
  "Redacted report",
  "Average Payment Time (days)",
  "Median Payment Time (days)",
  "80th Percentile Payment Time (days)",
  "95th Percentile Payment Time (days)",
  "Payments 30 days or less",
  "Payments 31 - 60 days",
  "Payments more than 60 days",
  "ANZSIC Industry subdivision",
  "Industry Division",
  "Submitted date",
];

const SOURCE_DIRECTORY = path.resolve(
  process.cwd(),
  "source-data",
  "payment-times",
);

const OUTPUT_DIRECTORY = path.resolve(
  process.cwd(),
  "public",
  "data",
  "regulator-payment-times",
);

const COMPANY_OUTPUT_DIRECTORY = path.join(OUTPUT_DIRECTORY, "companies");

const INDUSTRY_OUTPUT_DIRECTORY = path.join(OUTPUT_DIRECTORY, "industries");

const SEARCH_INDEX_PATH = path.join(OUTPUT_DIRECTORY, "search-index.json");

const INDUSTRY_INDEX_PATH = path.join(OUTPUT_DIRECTORY, "industry-index.json");

const IMPORT_SUMMARY_PATH = path.join(OUTPUT_DIRECTORY, "import-summary.json");

const SITE_URL = "https://www.monochrome-compliance.com";

const PAYMENT_TIMES_SITEMAP_PATH = path.resolve(
  process.cwd(),
  "public",
  "sitemap-payment-times.xml",
);

function fail(message) {
  throw new Error(`Regulator Payment Times import failed: ${message}`);
}

function normaliseText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function normaliseAbn(value) {
  const abn = normaliseText(value).replace(/\D/g, "");

  if (!abn) {
    return "";
  }

  if (abn.length !== 11) {
    fail(`Invalid ABN encountered: ${value}`);
  }

  return abn;
}

function normaliseAcnArbn(value) {
  return normaliseText(value).replace(/\D/g, "");
}

function normaliseBoolean(value, fieldName, reportId) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalisedValue = normaliseText(value).toLowerCase();

  if (["yes", "y", "true", "1"].includes(normalisedValue)) {
    return true;
  }

  if (["no", "n", "false", "0", ""].includes(normalisedValue)) {
    return false;
  }

  fail(
    `${fieldName} contains an unsupported value for report ${reportId}: ${value}`,
  );
}

function normaliseNumber(value, fieldName, reportId) {
  if (value === null || value === undefined || value === "") {
    fail(`${fieldName} is missing for report ${reportId}`);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const normalisedValue = normaliseText(value)
    .replace(/,/g, "")
    .replace(/%$/, "");

  const number = Number(normalisedValue);

  if (!Number.isFinite(number)) {
    fail(`${fieldName} is not numeric for report ${reportId}: ${value}`);
  }

  return number;
}

function formatDateParts(year, month, day) {
  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function normaliseDate(value, fieldName, reportId) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      fail(
        `${fieldName} contains an invalid date for report ${reportId}: ${value}`,
      );
    }

    return formatDateParts(
      value.getFullYear(),
      value.getMonth() + 1,
      value.getDate(),
    );
  }

  if (typeof value === "number") {
    const parsedDate = XLSX.SSF.parse_date_code(value);

    if (!parsedDate) {
      fail(
        `${fieldName} contains an invalid Excel date for report ${reportId}`,
      );
    }

    return formatDateParts(parsedDate.y, parsedDate.m, parsedDate.d);
  }

  const normalisedValue = normaliseText(value);
  const isoDateMatch = normalisedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!isoDateMatch) {
    fail(
      `${fieldName} contains an unsupported date for report ${reportId}: ${value}`,
    );
  }

  return normalisedValue;
}

function createTextSlug(value, fieldName) {
  const slug = normaliseText(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  if (!slug) {
    fail(`Unable to create a slug for ${fieldName}`);
  }

  return slug;
}

function createCompanySlug(businessName, abn) {
  const nameSlug = createTextSlug(businessName, `business with ABN ${abn}`);

  return `${nameSlug}-${abn}`;
}

function findWorkbook() {
  const suppliedPath = process.argv[2];

  if (suppliedPath) {
    const resolvedPath = path.resolve(process.cwd(), suppliedPath);

    if (!fs.existsSync(resolvedPath)) {
      fail(`Workbook not found at ${resolvedPath}`);
    }

    return resolvedPath;
  }

  if (!fs.existsSync(SOURCE_DIRECTORY)) {
    fail(`Source directory not found at ${SOURCE_DIRECTORY}`);
  }

  const workbooks = fs
    .readdirSync(SOURCE_DIRECTORY)
    .filter(
      (fileName) =>
        fileName.toLowerCase().endsWith(".xlsx") && !fileName.startsWith("~$"),
    )
    .sort();

  if (workbooks.length === 0) {
    fail(`No Excel workbook found in ${SOURCE_DIRECTORY}`);
  }

  if (workbooks.length > 1) {
    fail(
      `More than one Excel workbook was found in ${SOURCE_DIRECTORY}. ` +
        "Remove the older workbook or pass the required path explicitly.",
    );
  }

  return path.join(SOURCE_DIRECTORY, workbooks[0]);
}

function findHeaderRow(worksheet) {
  const previewRows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  const headerRowIndex = previewRows.findIndex((row) => {
    const values = row.map((value) => normaliseText(value));

    return (
      values.includes("ReportId") &&
      values.includes("Business Name") &&
      values.includes("ABN")
    );
  });

  if (headerRowIndex === -1) {
    fail(`Could not locate the header row in worksheet "${SHEET_NAME}"`);
  }

  return headerRowIndex;
}

function validateColumns(rows) {
  if (rows.length === 0) {
    fail(`Worksheet "${SHEET_NAME}" contains no report rows`);
  }

  const availableColumns = Object.keys(rows[0]);

  const missingColumns = REQUIRED_COLUMNS.filter(
    (column) => !availableColumns.includes(column),
  );

  if (missingColumns.length > 0) {
    fail(`Required columns are missing: ${missingColumns.join(", ")}`);
  }
}

function validateIndustryDivision(industryDivision, reportId) {
  if (!industryDivision) {
    fail(`Industry Division is missing for report ${reportId}`);
  }

  if (!ANZSIC_INDUSTRY_DIVISIONS.includes(industryDivision)) {
    fail(
      `Industry Division contains an unsupported value for report ` +
        `${reportId}: ${industryDivision}`,
    );
  }
}

function compareReports(left, right) {
  if (left.revisedReport !== right.revisedReport) {
    return left.revisedReport ? 1 : -1;
  }

  const submittedDateComparison = left.submittedDate.localeCompare(
    right.submittedDate,
  );

  if (submittedDateComparison !== 0) {
    return submittedDateComparison;
  }

  return left.reportId.localeCompare(right.reportId);
}

function calculatePosition(value, cohortValues) {
  const sortedValues = [...cohortValues].sort((left, right) => left - right);

  const lowerCount = sortedValues.filter(
    (candidate) => candidate < value,
  ).length;

  const equalCount = sortedValues.filter(
    (candidate) => candidate === value,
  ).length;

  const rank = lowerCount + 1;

  const percentile =
    sortedValues.length === 1
      ? 100
      : Number(
          (
            ((sortedValues.length - lowerCount - equalCount) /
              (sortedValues.length - 1)) *
            100
          ).toFixed(1),
        );

  return {
    rank,
    count: sortedValues.length,
    percentile,
  };
}

function calculateAverage(values) {
  if (values.length === 0) {
    fail("Unable to calculate an average for an empty dataset");
  }

  const total = values.reduce((sum, value) => sum + value, 0);

  return Number((total / values.length).toFixed(1));
}

function calculateMedian(values) {
  if (values.length === 0) {
    fail("Unable to calculate a median for an empty dataset");
  }

  const sortedValues = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(sortedValues.length / 2);

  if (sortedValues.length % 2 === 0) {
    return Number(
      ((sortedValues[midpoint - 1] + sortedValues[midpoint]) / 2).toFixed(1),
    );
  }

  return Number(sortedValues[midpoint].toFixed(1));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function createSitemapUrl({
  location,
  lastModified,
  changeFrequency,
  priority,
}) {
  const lines = ["  <url>", `    <loc>${escapeXml(location)}</loc>`];

  if (lastModified) {
    lines.push(`    <lastmod>${escapeXml(lastModified)}</lastmod>`);
  }

  if (changeFrequency) {
    lines.push(`    <changefreq>${escapeXml(changeFrequency)}</changefreq>`);
  }

  if (priority !== undefined) {
    lines.push(`    <priority>${priority}</priority>`);
  }

  lines.push("  </url>");

  return lines.join("\n");
}

function writePaymentTimesSitemap(searchIndex, industryIndex) {
  const sitemapEntries = [
    createSitemapUrl({
      location: `${SITE_URL}/regulator-payment-times`,
      changeFrequency: "monthly",
      priority: "0.8",
    }),
    ...industryIndex.map((industry) =>
      createSitemapUrl({
        location:
          `${SITE_URL}/regulator-payment-times/industry/` + industry.slug,
        lastModified: industry.latestReportingPeriodEndDate,
        changeFrequency: "monthly",
        priority: "0.7",
      }),
    ),
    ...searchIndex.map((company) =>
      createSitemapUrl({
        location: `${SITE_URL}/regulator-payment-times/${company.slug}`,
        lastModified: company.latestReportingPeriodEndDate,
        changeFrequency: "monthly",
        priority: "0.6",
      }),
    ),
  ];

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemapEntries,
    "</urlset>",
    "",
  ].join("\n");

  fs.writeFileSync(PAYMENT_TIMES_SITEMAP_PATH, sitemap, "utf8");
}

function clearJsonDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, {
    recursive: true,
  });

  for (const fileName of fs.readdirSync(directoryPath)) {
    if (fileName.endsWith(".json")) {
      fs.rmSync(path.join(directoryPath, fileName));
    }
  }
}

function prepareOutputDirectories() {
  clearJsonDirectory(COMPANY_OUTPUT_DIRECTORY);
  clearJsonDirectory(INDUSTRY_OUTPUT_DIRECTORY);
}

function createIndustryOutputs(publishedReports) {
  const reportsByIndustry = new Map();

  for (const report of publishedReports) {
    if (!reportsByIndustry.has(report.industryDivision)) {
      reportsByIndustry.set(report.industryDivision, []);
    }

    reportsByIndustry.get(report.industryDivision).push(report);
  }

  const industries = [];

  for (const industryDivision of ANZSIC_INDUSTRY_DIVISIONS) {
    const industryReports = reportsByIndustry.get(industryDivision);

    if (!industryReports || industryReports.length === 0) {
      continue;
    }

    const slug = createTextSlug(
      industryDivision,
      `industry division ${industryDivision}`,
    );

    const reportsByPeriod = new Map();

    for (const report of industryReports) {
      if (!reportsByPeriod.has(report.reportingPeriodEndDate)) {
        reportsByPeriod.set(report.reportingPeriodEndDate, []);
      }

      reportsByPeriod.get(report.reportingPeriodEndDate).push(report);
    }

    const history = [...reportsByPeriod.entries()]
      .map(([reportingPeriodEndDate, periodReports]) => {
        const p95Values = periodReports.map(
          (report) => report.p95PaymentTimeDays,
        );

        return {
          reportingPeriodEndDate,
          reportingEntityCount: periodReports.length,
          averageP95PaymentTimeDays: calculateAverage(p95Values),
          medianP95PaymentTimeDays: calculateMedian(p95Values),
          minimumP95PaymentTimeDays: Math.min(...p95Values),
          maximumP95PaymentTimeDays: Math.max(...p95Values),
        };
      })
      .sort((left, right) =>
        left.reportingPeriodEndDate.localeCompare(right.reportingPeriodEndDate),
      );

    industries.push({
      slug,
      industryDivision,
      history,
      reportsByPeriod,
    });
  }

  const medianValuesByPeriod = new Map();

  for (const industry of industries) {
    for (const period of industry.history) {
      if (!medianValuesByPeriod.has(period.reportingPeriodEndDate)) {
        medianValuesByPeriod.set(period.reportingPeriodEndDate, []);
      }

      medianValuesByPeriod
        .get(period.reportingPeriodEndDate)
        .push(period.medianP95PaymentTimeDays);
    }
  }

  for (const industry of industries) {
    for (const period of industry.history) {
      period.position = calculatePosition(
        period.medianP95PaymentTimeDays,
        medianValuesByPeriod.get(period.reportingPeriodEndDate),
      );
    }
  }

  const industryIndex = [];

  for (const industry of industries) {
    const latestPeriod = industry.history[industry.history.length - 1];

    const latestPeriodReports = industry.reportsByPeriod.get(
      latestPeriod.reportingPeriodEndDate,
    );

    const companies = latestPeriodReports
      .map((report) => ({
        businessName: report.businessName,
        abn: report.abn,
        slug: createCompanySlug(report.businessName, report.abn),
        p95PaymentTimeDays: report.p95PaymentTimeDays,
        industryP95Position: report.industryP95Position,
      }))
      .sort((left, right) => {
        const p95Comparison =
          left.p95PaymentTimeDays - right.p95PaymentTimeDays;

        if (p95Comparison !== 0) {
          return p95Comparison;
        }

        return left.businessName.localeCompare(right.businessName);
      });

    const industryOutput = {
      slug: industry.slug,
      industryDivision: industry.industryDivision,
      latestReportingPeriodEndDate: latestPeriod.reportingPeriodEndDate,
      reportingEntityCount: latestPeriod.reportingEntityCount,
      latestPeriod,
      history: industry.history,
      companies,
    };

    writeJson(
      path.join(INDUSTRY_OUTPUT_DIRECTORY, `${industry.slug}.json`),
      industryOutput,
    );

    industryIndex.push({
      slug: industry.slug,
      industryDivision: industry.industryDivision,
      latestReportingPeriodEndDate: latestPeriod.reportingPeriodEndDate,
      reportingEntityCount: latestPeriod.reportingEntityCount,
      averageP95PaymentTimeDays: latestPeriod.averageP95PaymentTimeDays,
      medianP95PaymentTimeDays: latestPeriod.medianP95PaymentTimeDays,
      minimumP95PaymentTimeDays: latestPeriod.minimumP95PaymentTimeDays,
      maximumP95PaymentTimeDays: latestPeriod.maximumP95PaymentTimeDays,
      position: latestPeriod.position,
    });
  }

  industryIndex.sort((left, right) => {
    const p95Comparison =
      left.medianP95PaymentTimeDays - right.medianP95PaymentTimeDays;

    if (p95Comparison !== 0) {
      return p95Comparison;
    }

    return left.industryDivision.localeCompare(right.industryDivision);
  });

  return industryIndex;
}

function importRegulatorPaymentTimes() {
  const workbookPath = findWorkbook();

  const workbook = XLSX.readFile(workbookPath, {
    cellDates: true,
    raw: true,
  });

  const worksheet = workbook.Sheets[SHEET_NAME];

  if (!worksheet) {
    fail(`Worksheet "${SHEET_NAME}" was not found`);
  }

  const headerRowIndex = findHeaderRow(worksheet);

  const rows = XLSX.utils.sheet_to_json(worksheet, {
    range: headerRowIndex,
    defval: null,
    raw: true,
  });

  validateColumns(rows);

  const reportIds = new Set();
  const candidateReports = [];

  let excludedMissingAbnCount = 0;
  let excludedNonStandardCount = 0;

  for (const row of rows) {
    const reportId = normaliseText(row.ReportId);

    if (!reportId) {
      continue;
    }

    if (reportIds.has(reportId)) {
      fail(`Duplicate ReportId encountered: ${reportId}`);
    }

    reportIds.add(reportId);

    if (
      Object.prototype.hasOwnProperty.call(row, "Type") &&
      normaliseText(row.Type) &&
      normaliseText(row.Type).toLowerCase() !== "standard"
    ) {
      excludedNonStandardCount += 1;
      continue;
    }

    const abn = normaliseAbn(row.ABN);

    if (!abn) {
      excludedMissingAbnCount += 1;
      continue;
    }

    const businessName = normaliseText(row["Business Name"]);

    if (!businessName) {
      fail(`Business Name is missing for report ${reportId}`);
    }

    const industryDivision = normaliseText(row["Industry Division"]);

    validateIndustryDivision(industryDivision, reportId);

    candidateReports.push({
      reportId,
      businessName,
      abn,
      acnArbn: normaliseAcnArbn(row["ACN/ARBN"]),
      reportingPeriodStartDate: normaliseDate(
        row["Reporting Period Start Date"],
        "Reporting Period Start Date",
        reportId,
      ),
      reportingPeriodEndDate: normaliseDate(
        row["Reporting Period End Date"],
        "Reporting Period End Date",
        reportId,
      ),
      revisedReport: normaliseBoolean(
        row["Revised Report"],
        "Revised Report",
        reportId,
      ),
      redactedReport: normaliseBoolean(
        row["Redacted report"],
        "Redacted report",
        reportId,
      ),
      averagePaymentTimeDays: normaliseNumber(
        row["Average Payment Time (days)"],
        "Average Payment Time (days)",
        reportId,
      ),
      medianPaymentTimeDays: normaliseNumber(
        row["Median Payment Time (days)"],
        "Median Payment Time (days)",
        reportId,
      ),
      p80PaymentTimeDays: normaliseNumber(
        row["80th Percentile Payment Time (days)"],
        "80th Percentile Payment Time (days)",
        reportId,
      ),
      p95PaymentTimeDays: normaliseNumber(
        row["95th Percentile Payment Time (days)"],
        "95th Percentile Payment Time (days)",
        reportId,
      ),
      payments30DaysOrLess: normaliseNumber(
        row["Payments 30 days or less"],
        "Payments 30 days or less",
        reportId,
      ),
      payments31To60Days: normaliseNumber(
        row["Payments 31 - 60 days"],
        "Payments 31 - 60 days",
        reportId,
      ),
      paymentsMoreThan60Days: normaliseNumber(
        row["Payments more than 60 days"],
        "Payments more than 60 days",
        reportId,
      ),
      industrySubdivision: normaliseText(row["ANZSIC Industry subdivision"]),
      industryDivision,
      submittedDate: normaliseDate(
        row["Submitted date"],
        "Submitted date",
        reportId,
      ),
    });
  }

  const latestReportByCompanyPeriod = new Map();

  for (const report of candidateReports) {
    const companyPeriodKey = [
      report.abn,
      report.reportingPeriodStartDate,
      report.reportingPeriodEndDate,
    ].join(":");

    const existingReport = latestReportByCompanyPeriod.get(companyPeriodKey);

    if (!existingReport || compareReports(existingReport, report) < 0) {
      latestReportByCompanyPeriod.set(companyPeriodKey, report);
    }
  }

  const publishedReports = [...latestReportByCompanyPeriod.values()];

  const p95ValuesByPeriod = new Map();
  const p95ValuesByPeriodAndIndustry = new Map();

  for (const report of publishedReports) {
    const periodKey = report.reportingPeriodEndDate;

    const industryKey = [periodKey, report.industryDivision].join(":");

    if (!p95ValuesByPeriod.has(periodKey)) {
      p95ValuesByPeriod.set(periodKey, []);
    }

    if (!p95ValuesByPeriodAndIndustry.has(industryKey)) {
      p95ValuesByPeriodAndIndustry.set(industryKey, []);
    }

    p95ValuesByPeriod.get(periodKey).push(report.p95PaymentTimeDays);

    p95ValuesByPeriodAndIndustry
      .get(industryKey)
      .push(report.p95PaymentTimeDays);
  }

  for (const report of publishedReports) {
    const periodKey = report.reportingPeriodEndDate;

    const industryKey = [periodKey, report.industryDivision].join(":");

    report.overallP95Position = calculatePosition(
      report.p95PaymentTimeDays,
      p95ValuesByPeriod.get(periodKey),
    );

    report.industryP95Position = calculatePosition(
      report.p95PaymentTimeDays,
      p95ValuesByPeriodAndIndustry.get(industryKey),
    );
  }

  const reportsByAbn = new Map();

  for (const report of publishedReports) {
    if (!reportsByAbn.has(report.abn)) {
      reportsByAbn.set(report.abn, []);
    }

    reportsByAbn.get(report.abn).push(report);
  }

  prepareOutputDirectories();

  const searchIndex = [];

  for (const [abn, reports] of reportsByAbn.entries()) {
    reports.sort((left, right) => {
      const reportingPeriodComparison =
        right.reportingPeriodEndDate.localeCompare(left.reportingPeriodEndDate);

      if (reportingPeriodComparison !== 0) {
        return reportingPeriodComparison;
      }

      return right.submittedDate.localeCompare(left.submittedDate);
    });

    const latestReport = reports[0];

    const slug = createCompanySlug(latestReport.businessName, abn);

    const industrySlug = createTextSlug(
      latestReport.industryDivision,
      `industry division ${latestReport.industryDivision}`,
    );

    const company = {
      slug,
      businessName: latestReport.businessName,
      abn,
      acnArbn: latestReport.acnArbn,
      industryDivision: latestReport.industryDivision,
      industrySlug,
      industrySubdivision: latestReport.industrySubdivision,
      latestReportingPeriodEndDate: latestReport.reportingPeriodEndDate,
      reports: reports.map(
        ({ businessName, abn: reportAbn, ...report }) => report,
      ),
    };

    writeJson(path.join(COMPANY_OUTPUT_DIRECTORY, `${slug}.json`), company);

    searchIndex.push({
      businessName: company.businessName,
      abn: company.abn,
      slug: company.slug,
      industryDivision: company.industryDivision,
      industrySlug: company.industrySlug,
      industrySubdivision: company.industrySubdivision,
      latestReportingPeriodEndDate: company.latestReportingPeriodEndDate,
    });
  }

  searchIndex.sort((left, right) =>
    left.businessName.localeCompare(right.businessName),
  );

  const industryIndex = createIndustryOutputs(publishedReports);

  const summary = {
    generatedAt: new Date().toISOString(),
    sourceWorkbook: path.basename(workbookPath),
    sourceWorksheet: SHEET_NAME,
    sourceRowCount: rows.length,
    candidateStandardReportCount: candidateReports.length,
    publishedReportCount: publishedReports.length,
    companyCount: reportsByAbn.size,
    industryCount: industryIndex.length,
    excludedMissingAbnCount,
    excludedNonStandardCount,
    supersededReportCount: candidateReports.length - publishedReports.length,
    outputs: {
      searchIndex: path.relative(process.cwd(), SEARCH_INDEX_PATH),
      companyDirectory: path.relative(process.cwd(), COMPANY_OUTPUT_DIRECTORY),
      industryIndex: path.relative(process.cwd(), INDUSTRY_INDEX_PATH),
      industryDirectory: path.relative(
        process.cwd(),
        INDUSTRY_OUTPUT_DIRECTORY,
      ),
      paymentTimesSitemap: path.relative(
        process.cwd(),
        PAYMENT_TIMES_SITEMAP_PATH,
      ),
      importSummary: path.relative(process.cwd(), IMPORT_SUMMARY_PATH),
    },
  };

  writeJson(SEARCH_INDEX_PATH, searchIndex);
  writeJson(INDUSTRY_INDEX_PATH, industryIndex);
  writePaymentTimesSitemap(searchIndex, industryIndex);
  writeJson(IMPORT_SUMMARY_PATH, summary);

  console.log("Regulator Payment Times import completed successfully.");

  console.log(JSON.stringify(summary, null, 2));
}

try {
  importRegulatorPaymentTimes();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
