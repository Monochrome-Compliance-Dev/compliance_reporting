const fs = require("fs");
const path = require("path");

const SITE_URL = "https://monochrome-compliance.com";

const BUILD_DIRECTORY = path.resolve(process.cwd(), "build");

const BUILD_INDEX_PATH = path.join(BUILD_DIRECTORY, "index.html");

const DATA_DIRECTORY = path.join(
  BUILD_DIRECTORY,
  "data",
  "regulator-payment-times",
);

const COMPANY_DIRECTORY = path.join(DATA_DIRECTORY, "companies");

const INDUSTRY_DIRECTORY = path.join(DATA_DIRECTORY, "industries");

const INDUSTRY_INDEX_PATH = path.join(DATA_DIRECTORY, "industry-index.json");

function fail(message) {
  throw new Error(`Payment Times Explorer static build failed: ${message}`);
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`Required file not found: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeJsonForHtml(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function formatAbn(abn) {
  const value = String(abn ?? "");

  if (value.length !== 11) {
    return value;
  }

  return [
    value.slice(0, 2),
    value.slice(2, 5),
    value.slice(5, 8),
    value.slice(8),
  ].join(" ");
}

function formatDays(value) {
  if (value === null || value === undefined || value === "") {
    return "Not reported";
  }

  return `${Number(value).toFixed(1)} days`;
}

function formatPercent(value) {
  if (value === null || value === undefined || value === "") {
    return "Not reported";
  }

  return `${Number(value).toFixed(1)}%`;
}

function createUtcDate(dateValue) {
  const match = String(dateValue ?? "").match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
}

function formatMonthYear(dateValue) {
  const date = createUtcDate(dateValue);

  if (!date) {
    return "the latest reporting period";
  }

  return new Intl.DateTimeFormat("en-AU", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function getLatestReport(company) {
  if (!Array.isArray(company.reports) || company.reports.length === 0) {
    return null;
  }

  return [...company.reports].sort((left, right) =>
    String(right.reportingPeriodEndDate).localeCompare(
      String(left.reportingPeriodEndDate),
    ),
  )[0];
}

function replaceTitle(html, title) {
  return html.replace(
    /<title\b[^>]*>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(title)}</title>`,
  );
}

function replaceDescription(html, description) {
  const descriptionTag = `<meta name="description" content="${escapeHtml(
    description,
  )}" />`;

  if (/<meta\b[^>]*name=["']description["'][^>]*>/i.test(html)) {
    return html.replace(
      /<meta\b[^>]*name=["']description["'][^>]*>/i,
      descriptionTag,
    );
  }

  return html.replace("</head>", `  ${descriptionTag}\n</head>`);
}

function injectHeadContent(html, content) {
  return html.replace("</head>", `${content}\n</head>`);
}

function injectBodyContent(html, content) {
  const rootPattern = /<div\s+id=["']root["']\s*><\/div>/i;

  if (!rootPattern.test(html)) {
    fail('Could not find <div id="root"></div> in build/index.html');
  }

  return html.replace(rootPattern, `<div id="root">${content}</div>`);
}

function createDocument({
  template,
  title,
  description,
  canonicalPath,
  body,
  structuredData,
}) {
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;

  let html = template;

  html = replaceTitle(html, title);
  html = replaceDescription(html, description);

  const headContent = [
    `  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
    `  <meta property="og:type" content="website" />`,
    `  <meta property="og:title" content="${escapeHtml(title)}" />`,
    `  <meta property="og:description" content="${escapeHtml(description)}" />`,
    `  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    `  <meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `  <meta name="twitter:description" content="${escapeHtml(
      description,
    )}" />`,
  ];

  if (structuredData) {
    headContent.push(
      `  <script type="application/ld+json">${escapeJsonForHtml(
        structuredData,
      )}</script>`,
    );
  }

  html = injectHeadContent(html, headContent.join("\n"));
  html = injectBodyContent(html, body);

  return html;
}

function writeRouteHtml(routePath, html) {
  const relativePath = routePath.replace(/^\/+/, "");

  const outputDirectory = path.join(BUILD_DIRECTORY, relativePath);

  fs.mkdirSync(outputDirectory, {
    recursive: true,
  });

  fs.writeFileSync(path.join(outputDirectory, "index.html"), html, "utf8");
}

function createCompanyBody(company, latestReport) {
  const reportingPeriod = formatMonthYear(latestReport.reportingPeriodEndDate);

  return [
    "<main>",
    `  <h1>${escapeHtml(company.businessName)}</h1>`,
    `  <p>ABN ${escapeHtml(formatAbn(company.abn))}</p>`,
    company.acnArbn ? `  <p>ACN/ARBN ${escapeHtml(company.acnArbn)}</p>` : "",
    company.industryDivision
      ? `  <p>ANZSIC Industry Division: ${escapeHtml(
          company.industryDivision,
        )}</p>`
      : "",
    `  <p>Published payment performance for the reporting period ending ${escapeHtml(
      reportingPeriod,
    )}.</p>`,
    "  <section>",
    "    <h2>Latest reported payment times</h2>",
    "    <dl>",
    `      <dt>Average payment time</dt><dd>${escapeHtml(
      formatDays(latestReport.averagePaymentTimeDays),
    )}</dd>`,
    `      <dt>Median payment time</dt><dd>${escapeHtml(
      formatDays(latestReport.medianPaymentTimeDays),
    )}</dd>`,
    `      <dt>80th percentile payment time</dt><dd>${escapeHtml(
      formatDays(latestReport.p80PaymentTimeDays),
    )}</dd>`,
    `      <dt>95th percentile payment time</dt><dd>${escapeHtml(
      formatDays(latestReport.p95PaymentTimeDays),
    )}</dd>`,
    "    </dl>",
    "  </section>",
    "  <section>",
    "    <h2>Payment distribution</h2>",
    "    <dl>",
    `      <dt>30 days or less</dt><dd>${escapeHtml(
      formatPercent(latestReport.payments30DaysOrLess),
    )}</dd>`,
    `      <dt>31 to 60 days</dt><dd>${escapeHtml(
      formatPercent(latestReport.payments31To60Days),
    )}</dd>`,
    `      <dt>More than 60 days</dt><dd>${escapeHtml(
      formatPercent(latestReport.paymentsMoreThan60Days),
    )}</dd>`,
    "    </dl>",
    "  </section>",
    "</main>",
  ]
    .filter(Boolean)
    .join("\n");
}

function createCompanyPages(template) {
  if (!fs.existsSync(COMPANY_DIRECTORY)) {
    fail(`Company data directory not found: ${COMPANY_DIRECTORY}`);
  }

  const companyFiles = fs
    .readdirSync(COMPANY_DIRECTORY)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort();

  let generatedCount = 0;

  for (const fileName of companyFiles) {
    const company = readJson(path.join(COMPANY_DIRECTORY, fileName));

    const latestReport = getLatestReport(company);

    if (!company.businessName || !company.slug || !latestReport) {
      fail(`Company data is incomplete in ${fileName}`);
    }

    const title = `${company.businessName} Payment Times | Monochrome Compliance`;

    const description =
      `Published Payment Times Reporting data for ${company.businessName}, ` +
      `including average, median, P80 and P95 payment times and industry comparisons.`;

    const canonicalPath = `/regulator-payment-times/${company.slug}`;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      url: `${SITE_URL}${canonicalPath}`,
      description,
      about: {
        "@type": "Organization",
        name: company.businessName,
        identifier: {
          "@type": "PropertyValue",
          propertyID: "ABN",
          value: company.abn,
        },
      },
    };

    const html = createDocument({
      template,
      title,
      description,
      canonicalPath,
      body: createCompanyBody(company, latestReport),
      structuredData,
    });

    writeRouteHtml(canonicalPath, html);

    generatedCount += 1;
  }

  return generatedCount;
}

function createIndustryDetailBody(industry) {
  const latestCycle =
    Array.isArray(industry.cycles) && industry.cycles.length > 0
      ? industry.cycles[industry.cycles.length - 1]
      : null;

  const companyLinks = (
    Array.isArray(industry.companies) ? industry.companies : []
  )
    .map(
      (company) =>
        `      <li><a href="/regulator-payment-times/${escapeHtml(
          company.slug,
        )}">${escapeHtml(company.businessName)}</a></li>`,
    )
    .join("\n");

  return [
    "<main>",
    `  <h1>${escapeHtml(industry.industryDivision)} payment times</h1>`,
    "  <p>",
    `    Explore published Payment Times Reporting data for reporting entities in the ${escapeHtml(
      industry.industryDivision,
    )} industry.`,
    "  </p>",
    latestCycle
      ? `  <p>Latest reporting cycle: ${escapeHtml(
          latestCycle.reportingCycleName,
        )}. ${escapeHtml(
          latestCycle.reportingEntityCount,
        )} reporting entities were included.</p>`
      : "",
    latestCycle
      ? `  <p>Industry median P95 payment time: ${escapeHtml(
          formatDays(latestCycle.medianP95PaymentTimeDays),
        )}.</p>`
      : "",
    companyLinks
      ? [
          "  <section>",
          "    <h2>Reporting entities in this industry</h2>",
          "    <ul>",
          companyLinks,
          "    </ul>",
          "  </section>",
        ].join("\n")
      : "",
    "</main>",
  ]
    .filter(Boolean)
    .join("\n");
}

function createIndustryPages(template) {
  if (!fs.existsSync(INDUSTRY_DIRECTORY)) {
    fail(`Industry data directory not found: ${INDUSTRY_DIRECTORY}`);
  }

  const industryFiles = fs
    .readdirSync(INDUSTRY_DIRECTORY)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort();

  let generatedCount = 0;

  for (const fileName of industryFiles) {
    const industry = readJson(path.join(INDUSTRY_DIRECTORY, fileName));

    if (!industry.slug || !industry.industryDivision) {
      fail(`Industry data is incomplete in ${fileName}`);
    }

    const title = `${industry.industryDivision} Payment Times | Monochrome Compliance`;

    const description =
      `Explore published Payment Times Reporting data and P95 performance ` +
      `for reporting entities in Australia's ${industry.industryDivision} industry.`;

    const canonicalPath = `/regulator-payment-times/industry/${industry.slug}`;

    const html = createDocument({
      template,
      title,
      description,
      canonicalPath,
      body: createIndustryDetailBody(industry),
    });

    writeRouteHtml(canonicalPath, html);

    generatedCount += 1;
  }

  return generatedCount;
}

function createHomePage(template) {
  const title = "Payment Data & Compliance Solutions | Monochrome Compliance";

  const description =
    "Payment data, compliance, and reporting solutions for organisations operating in complex environments, including Payment Times Reporting. Understand reporting performance before the period closes.";

  const html = createDocument({
    template,
    title,
    description,
    canonicalPath: "/",
    body: [
      "<main>",
      "  <h1>Payment data and compliance solutions</h1>",
      "  <p>",
      "    Monochrome Compliance helps Australian organisations understand payment behaviour, prepare Payment Times Reports and identify reporting issues before the reporting period closes.",
      "  </p>",

      "  <section>",
      "    <h2>Payment Times Reporting</h2>",
      "    <p>",
      "      Prepare accurate and defensible Payment Times Reports while understanding the operational behaviour driving the reported result.",
      "    </p>",
      '    <p><a href="/payment-times-reporting">Explore Payment Times Reporting services</a></p>',
      "  </section>",

      "  <section>",
      "    <h2>Payment Times Explorer</h2>",
      "    <p>",
      "      Search published Australian Payment Times Reporting data, review reported payment performance and compare reporting entities across industries.",
      "    </p>",
      '    <p><a href="/regulator-payment-times">Search the Payment Times Explorer</a></p>',
      '    <p><a href="/regulator-payment-times/industries">Explore payment times by industry</a></p>',
      "  </section>",

      "  <section>",
      "    <h2>Payment behaviour monitoring</h2>",
      "    <p>",
      "      Monitor payment behaviour during the reporting period to identify emerging risks and reporting issues while there is still time to act.",
      "    </p>",
      '    <p><a href="/pricing">View Payment Times Reporting options</a></p>',
      "  </section>",
      "</main>",
    ].join("\n"),
  });

  fs.writeFileSync(BUILD_INDEX_PATH, html, "utf8");
}

function createExplorerIndexPages(template) {
  const industryIndex = readJson(INDUSTRY_INDEX_PATH);

  const explorerTitle = "Payment Times Explorer | Monochrome Compliance";

  const explorerDescription =
    "Search published Australian Payment Times Reporting data and compare payment performance, P95 payment times and industry results.";

  writeRouteHtml(
    "/regulator-payment-times",
    createDocument({
      template,
      title: explorerTitle,
      description: explorerDescription,
      canonicalPath: "/regulator-payment-times",
      body: [
        "<main>",
        "  <h1>Payment Times Explorer</h1>",
        "  <p>",
        "    Search published Australian Payment Times Reporting data by business name or ABN and review reported payment performance over time.",
        "  </p>",

        "  <section>",
        "    <h2>What the Payment Times Explorer shows</h2>",
        "    <p>",
        "      The Explorer brings together Standard reports published in the Australian Government Payment Times Reports Register and makes reporting entity results easier to search and compare.",
        "    </p>",
        "  </section>",

        "  <section>",
        "    <h2>Payment performance beyond the average</h2>",
        "    <p>",
        "      Review average, median, P80 and P95 payment times together with payment distributions and historical reporting results. P95 helps expose the slow-payment tail that averages and medians can hide.",
        "    </p>",
        "  </section>",

        "  <section>",
        "    <h2>Compare payment times by industry</h2>",
        "    <p>",
        "      Industry views group reporting entities across the regulator's 19 ANZSIC Industry Divisions and provide industry-level P95 comparisons and reporting trends.",
        "    </p>",
        '    <p><a href="/regulator-payment-times/industries">Explore payment times by industry</a></p>',
        "  </section>",

        "  <section>",
        "    <h2>About the source data</h2>",
        "    <p>",
        "      Source data is published in the Australian Government Payment Times Reports Register. Rankings, comparisons and industry insights are calculated by Monochrome Compliance from the published data.",
        "    </p>",
        "  </section>",
        "</main>",
      ].join("\n"),
    }),
  );

  const industriesTitle = "Payment Times by Industry | Monochrome Compliance";

  const industriesDescription =
    "Explore Australian Payment Times Reporting data by industry and compare P95 payment performance across reporting entities.";

  const industryLinks = (
    Array.isArray(industryIndex.industries) ? industryIndex.industries : []
  )
    .map(
      (industry) =>
        `    <li><a href="/regulator-payment-times/industry/${escapeHtml(
          industry.slug,
        )}">${escapeHtml(industry.industryDivision)}</a></li>`,
    )
    .join("\n");

  writeRouteHtml(
    "/regulator-payment-times/industries",
    createDocument({
      template,
      title: industriesTitle,
      description: industriesDescription,
      canonicalPath: "/regulator-payment-times/industries",
      body: [
        "<main>",
        "  <h1>Payment Times by industry</h1>",
        "  <p>",
        "    Explore published Australian Payment Times Reporting data across the regulator's 19 ANZSIC Industry Divisions.",
        "  </p>",

        "  <section>",
        "    <h2>Compare payment performance across industries</h2>",
        "    <p>",
        "      Industry views show the number of reporting entities and median P95 payment time for each reporting cycle, helping provide context for reported payment performance.",
        "    </p>",
        "  </section>",

        "  <section>",
        "    <h2>About these industry insights</h2>",
        "    <p>",
        "      These figures are calculated by Monochrome Compliance from publicly available Standard report data published by the Payment Times Reporting Regulator.",
        "    </p>",
        "    <p>",
        "      Industry structures, supplier arrangements and payment practices differ substantially. These results should not be treated as a ranking of industries or as an assessment of legal compliance, financial health or business quality.",
        "    </p>",
        "  </section>",

        "  <section>",
        "    <h2>Explore ANZSIC Industry Divisions</h2>",
        "    <ul>",
        industryLinks,
        "    </ul>",
        "  </section>",
        "</main>",
      ].join("\n"),
    }),
  );
}

function buildStaticPages() {
  if (!fs.existsSync(BUILD_INDEX_PATH)) {
    fail(
      "build/index.html was not found. Run react-scripts build before this script.",
    );
  }

  const template = fs.readFileSync(BUILD_INDEX_PATH, "utf8");

  createExplorerIndexPages(template);

  const industryCount = createIndustryPages(template);
  const companyCount = createCompanyPages(template);

  createHomePage(template);

  console.log(
    `Payment Times Explorer static build complete: ` +
      `${companyCount} company pages and ${industryCount} industry pages generated.`,
  );
}

buildStaticPages();
