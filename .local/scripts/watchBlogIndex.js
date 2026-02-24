const { generateSitemap } = require("./generateSitemap");
const chokidar = require("chokidar");
const path = require("path");
const { generateBlogIndex } = require("./generateBlogIndex");

const blogDir = path.join(__dirname, "../public/blog");

console.log("👀 Watching blog directory for changes...");

const watcher = chokidar.watch(blogDir, {
  ignored: /(^|[/\\])\../, // ignore dotfiles
  persistent: true,
  depth: 0,
});

const triggerUpdate = () => {
  try {
    generateBlogIndex();
    generateSitemap();
  } catch (err) {
    console.error("⚠️ Error during blog index/sitemap update:", err);
  }
};

watcher
  .on("add", triggerUpdate)
  .on("unlink", triggerUpdate)
  .on("ready", () => {
    console.log("✅ Watcher is running.");
  });
