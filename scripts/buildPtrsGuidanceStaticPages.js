const fs = require("fs");
const path = require("path");

const SITE_URL = "https://monochrome-compliance.com";

const BUILD_DIRECTORY = path.resolve(process.cwd(), "build");

const BUILD_INDEX_PATH = path.join(BUILD_DIRECTORY, "index.html");

const GUIDANCE_CONTENT_PATH = path.resolve(
  process.cwd(),
  "src",
  "slices",
  "marketing",
  "ptrsGuidance",
  "ptrsGuidanceContent.js",
);

const PUBLIC_SITEMAP_DIRECTORY = path.resolve(
  process.cwd(),
  "public",
  "sitemaps",
);

const BUILD_SITEMAP_DIRECTORY = path.join(BUILD_DIRECTORY, "sitemaps");

const PUBLIC_SITEMAP_PATH = path.join(
  PUBLIC_SITEMAP_DIRECTORY,
  "sitemap-ptrs-guidance.xml",
);

const BUILD_SITEMAP_PATH = path.join(
  BUILD_SITEMAP_DIRECTORY,
  "sitemap-ptrs-guidance.xml",
);

function fail(message) {
  throw new Error(`PTRS Guidance static build failed: ${message}`);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeXml(value) {
  return escapeHtml(value);
}

function escapeJsonForHtml(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function replaceTitle(html, title) {
  return html.replace(
    /<title\b[^>]*>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(title)}</title>`,
  );
}

function replaceRobotsMeta(html) {
  const robotsTag = '<meta name="robots" content="index, follow" />';

  if (/<meta\b[^>]*name=["']robots["'][^>]*>/i.test(html)) {
    return html.replace(/<meta\b[^>]*name=["']robots["'][^>]*>/i, robotsTag);
  }

  return html.replace("</head>", `  ${robotsTag}\n</head>`);
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
  html = replaceRobotsMeta(html);

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

async function loadGuidanceContent() {
  if (!fs.existsSync(GUIDANCE_CONTENT_PATH)) {
    fail(`Guidance content not found: ${GUIDANCE_CONTENT_PATH}`);
  }

  const source = fs.readFileSync(GUIDANCE_CONTENT_PATH, "utf8");

  const moduleUrl = `data:text/javascript;base64,${Buffer.from(
    source,
    "utf8",
  ).toString("base64")}`;

  const guidanceModule = await import(moduleUrl);

  if (!Array.isArray(guidanceModule.default)) {
    fail("ptrsGuidanceContent.js did not export a guidance array.");
  }

  return guidanceModule.default;
}

function formatReference(reference) {
  const details = [];

  if (reference.paragraphs?.length) {
    details.push(
      `Paragraph${reference.paragraphs.length > 1 ? "s" : ""}: ${reference.paragraphs.join(
        ", ",
      )}`,
    );
  }

  if (reference.examples?.length) {
    details.push(
      `Example${reference.examples.length > 1 ? "s" : ""}: ${reference.examples.join(
        ", ",
      )}`,
    );
  }

  if (reference.pages?.length) {
    details.push(
      `Page${reference.pages.length > 1 ? "s" : ""}: ${reference.pages.join(
        ", ",
      )}`,
    );
  }

  if (reference.reference) {
    details.push(`Reference: ${reference.reference}`);
  }

  return [
    "    <li>",
    `      <strong>${escapeHtml(reference.source)}</strong>`,
    reference.section
      ? `      <div>${escapeHtml(reference.section)}</div>`
      : "",
    details.length ? `      <div>${escapeHtml(details.join(" · "))}</div>` : "",
    "    </li>",
  ]
    .filter(Boolean)
    .join("\n");
}

function createGuidanceBody(guidance, guidanceContent) {
  const sourceReferences = guidance.sourceReferences
    .map(formatReference)
    .join("\n");

  const relatedGuidance = guidance.related
    .map((relatedSlug) =>
      guidanceContent.find((item) => item.slug === relatedSlug),
    )
    .filter(Boolean);

  const relatedLinks = relatedGuidance
    .map(
      (item) =>
        `      <li><a href="/ptrs-guidance/${escapeHtml(
          item.slug,
        )}">${escapeHtml(item.title)}</a></li>`,
    )
    .join("\n");

  return [
    "<main>",
    `  <p><a href="/ptrs-guidance">PTRS Guidance Explorer</a></p>`,
    `  <p>${escapeHtml(guidance.category)} · ${escapeHtml(guidance.type)}</p>`,
    `  <h1>${escapeHtml(guidance.title)}</h1>`,

    "  <section>",
    "    <h2>Quick answer</h2>",
    `    <p>${escapeHtml(guidance.shortAnswer)}</p>`,
    "  </section>",

    "  <section>",
    "    <h2>What does this mean?</h2>",
    `    <p>${escapeHtml(guidance.explanation)}</p>`,
    "  </section>",

    guidance.practicalNote
      ? [
          "  <section>",
          "    <h2>Practical point</h2>",
          `    <p>${escapeHtml(guidance.practicalNote)}</p>`,
          "  </section>",
        ].join("\n")
      : "",

    guidance.sourceNote
      ? [
          "  <section>",
          "    <h2>About this interpretation</h2>",
          `    <p>${escapeHtml(guidance.sourceNote)}</p>`,
          "  </section>",
        ].join("\n")
      : "",

    "  <section>",
    "    <h2>Official sources</h2>",
    "    <ul>",
    sourceReferences,
    "    </ul>",
    "  </section>",

    relatedLinks
      ? [
          "  <section>",
          "    <h2>Related guidance</h2>",
          "    <ul>",
          relatedLinks,
          "    </ul>",
          "  </section>",
        ].join("\n")
      : "",

    "  <section>",
    "    <h2>Preparing a Payment Times Report?</h2>",
    "    <p>",
    "      Monochrome Compliance can help with the data preparation, validation, reconciliation and reporting process.",
    "    </p>",
    '    <p><a href="/contact">Get in touch</a></p>',
    "  </section>",

    "  <aside>",
    "    <p>",
    "      This information is general in nature and is not legal, financial or professional advice. It is based on published Payment Times Reporting Regulator guidance and should be read together with the official guidance, applicable legislation and your organisation's own circumstances.",
    "    </p>",
    "  </aside>",
    "</main>",
  ]
    .filter(Boolean)
    .join("\n");
}

function createGuidancePages(template, guidanceContent) {
  let generatedCount = 0;

  for (const guidance of guidanceContent) {
    if (
      !guidance.slug ||
      !guidance.title ||
      !guidance.shortAnswer ||
      !guidance.explanation ||
      !guidance.seoTitle ||
      !guidance.seoDescription
    ) {
      fail(`Guidance record is incomplete: ${guidance.slug || "unknown slug"}`);
    }

    if (!Array.isArray(guidance.sourceReferences)) {
      fail(`Guidance record has no sourceReferences: ${guidance.slug}`);
    }

    const canonicalPath = `/ptrs-guidance/${guidance.slug}`;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: guidance.seoTitle,
      url: `${SITE_URL}${canonicalPath}`,
      description: guidance.seoDescription,
      mainEntity: {
        "@type": "Question",
        name: guidance.title,
        acceptedAnswer: {
          "@type": "Answer",
          text: guidance.shortAnswer,
        },
      },
      publisher: {
        "@type": "Organization",
        name: "Monochrome Compliance",
        url: SITE_URL,
      },
    };

    const html = createDocument({
      template,
      title: guidance.seoTitle,
      description: guidance.seoDescription,
      canonicalPath,
      body: createGuidanceBody(guidance, guidanceContent),
      structuredData,
    });

    writeRouteHtml(canonicalPath, html);

    generatedCount += 1;
  }

  return generatedCount;
}

function createGuidanceIndexPage(template, guidanceContent) {
  const title = "PTRS Guidance Explorer | Monochrome Compliance";

  const description =
    "Search plain-English answers to common Payment Times Reporting questions, grounded in the Regulator's published guidance and worked examples.";

  const guidanceLinks = guidanceContent
    .map(
      (guidance) =>
        `      <li><a href="/ptrs-guidance/${escapeHtml(
          guidance.slug,
        )}">${escapeHtml(guidance.title)}</a></li>`,
    )
    .join("\n");

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    url: `${SITE_URL}/ptrs-guidance`,
    description,
    publisher: {
      "@type": "Organization",
      name: "Monochrome Compliance",
      url: SITE_URL,
    },
  };

  const body = [
    "<main>",
    "  <h1>PTRS Guidance Explorer</h1>",
    "  <p>",
    "    Plain-English answers to common Payment Times Reporting questions, grounded in the Regulator's published guidance and worked examples.",
    "  </p>",

    "  <section>",
    "    <h2>Search Payment Times Reporting guidance</h2>",
    "    <p>",
    "      Explore common questions about trade credit, payments, exclusions, calculations and preparing a Payment Times Report.",
    "    </p>",
    "    <ul>",
    guidanceLinks,
    "    </ul>",
    "  </section>",

    "  <section>",
    "    <h2>About this guidance</h2>",
    "    <p>",
    "      Monochrome Compliance summarises and explains published Payment Times Reporting Regulator material to make common reporting questions easier to understand and navigate.",
    "    </p>",
    "    <p>",
    "      Individual guidance pages identify the Regulator guidance paragraphs, examples, pages or worked-example references used as their source.",
    "    </p>",
    "  </section>",

    "  <aside>",
    "    <p>",
    "      This information is general in nature and is not legal, financial or professional advice. It should be read together with the official guidance, applicable legislation and your organisation's own circumstances.",
    "    </p>",
    "  </aside>",
    "</main>",
  ].join("\n");

  writeRouteHtml(
    "/ptrs-guidance",
    createDocument({
      template,
      title,
      description,
      canonicalPath: "/ptrs-guidance",
      body,
      structuredData,
    }),
  );
}

function createSitemap(guidanceContent) {
  const paths = [
    "/ptrs-guidance",
    ...guidanceContent.map((guidance) => `/ptrs-guidance/${guidance.slug}`),
  ];

  const urls = paths
    .map((urlPath) =>
      [
        "  <url>",
        `    <loc>${escapeXml(`${SITE_URL}${urlPath}`)}</loc>`,
        "  </url>",
      ].join("\n"),
    )
    .join("\n");

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    "",
  ].join("\n");

  fs.mkdirSync(PUBLIC_SITEMAP_DIRECTORY, {
    recursive: true,
  });

  fs.mkdirSync(BUILD_SITEMAP_DIRECTORY, {
    recursive: true,
  });

  fs.writeFileSync(PUBLIC_SITEMAP_PATH, sitemap, "utf8");
  fs.writeFileSync(BUILD_SITEMAP_PATH, sitemap, "utf8");
}

async function buildStaticPages() {
  if (!fs.existsSync(BUILD_INDEX_PATH)) {
    fail(
      "build/index.html was not found. Run react-scripts build before this script.",
    );
  }

  const template = fs.readFileSync(BUILD_INDEX_PATH, "utf8");

  const guidanceContent = await loadGuidanceContent();

  createGuidanceIndexPage(template, guidanceContent);

  const guidanceCount = createGuidancePages(template, guidanceContent);

  createSitemap(guidanceContent);

  console.log(
    `PTRS Guidance static build complete: ${guidanceCount} guidance pages generated.`,
  );
}

buildStaticPages().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
