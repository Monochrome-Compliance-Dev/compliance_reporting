const fs = require("fs");
const path = require("path");

function generateSitemap() {
  const baseUrl = "https://monochrome-compliance.com";
  const indexPath = path.join(__dirname, "../public/blog/index.json");
  const outputPath = path.join(__dirname, "../public/sitemap.xml");

  let blogPaths = [];
  try {
    const index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    blogPaths = index.map((entry) => `/blog/${entry.slug}`);
  } catch (err) {
    console.error("⚠️ Failed to read blog index:", err);
    return;
  }

  const staticRoutes = ["/", "/blog"];
  const allPaths = [...staticRoutes, ...blogPaths];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    allPaths
      .map((route) => `  <url><loc>${baseUrl}${route}</loc></url>`)
      .join("\n") +
    `\n</urlset>`;

  fs.writeFileSync(outputPath, xml);
  console.log(`✅ Sitemap written to: ${outputPath}`);
}

module.exports = { generateSitemap };
