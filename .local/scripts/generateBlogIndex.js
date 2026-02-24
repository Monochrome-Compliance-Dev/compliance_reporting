const fs = require("fs");
const path = require("path");

function generateBlogIndex() {
  const blogDir = path.join(__dirname, "../public/blog");
  const outputPath = path.join(blogDir, "index.json");

  const files = fs.readdirSync(blogDir);
  const posts = files
    .filter((file) => file.endsWith(".md") && file !== "blog-template.md")
    .map((file) => ({
      slug: path.basename(file, ".md"),
    }));

  fs.writeFileSync(outputPath, JSON.stringify(posts, null, 2));
  console.log(`✅ Blog index written to: ${outputPath}`);
}

module.exports = { generateBlogIndex };
