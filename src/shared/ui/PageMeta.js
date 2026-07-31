import { Helmet } from "react-helmet-async";

const SITE_NAME = "Monochrome Compliance";
const SITE_URL = "https://monochrome-compliance.com";
const DEFAULT_IMAGE_PATH = "/images/og/og-industry-insights.jpg";
const DEFAULT_DESCRIPTION =
  "Payment data, compliance, and reporting solutions for complex organisations, including Payment Times Reporting (PTRS). Improve visibility, manage risk, and strengthen payment performance.";

function formatTitle(title) {
  if (!title) {
    return `${SITE_NAME} | Payment Data & Compliance`;
  }

  return title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
}

function normalisePath(value) {
  if (!value || value === "/") {
    return "/";
  }

  return `/${value.replace(/^\/+|\/+$/g, "")}`;
}

function getPathname(path, url) {
  if (path) {
    return normalisePath(path);
  }

  if (url) {
    try {
      return normalisePath(new URL(url, SITE_URL).pathname);
    } catch {
      return normalisePath(url);
    }
  }

  return normalisePath(
    typeof window !== "undefined" ? window.location.pathname : "/",
  );
}

function getAbsoluteAssetUrl(assetPath) {
  return new URL(assetPath || DEFAULT_IMAGE_PATH, SITE_URL).href;
}

const PageMeta = ({
  title,
  description,
  image,
  imageAlt,
  path,
  url,
  type = "website",
  noIndex = false,
}) => {
  const fullTitle = formatTitle(title);

  const metaDescription = description || DEFAULT_DESCRIPTION;

  const metaImage = getAbsoluteAssetUrl(image);
  const metaImageAlt = imageAlt || fullTitle;
  const canonicalUrl = `${SITE_URL}${getPathname(path, url)}`;

  const robots = noIndex
    ? "noindex, nofollow"
    : process.env.REACT_APP_ROBOTS || "index, follow";

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:image:alt" content={metaImageAlt} />

      {/* Twitter */}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
      <meta name="twitter:image:alt" content={metaImageAlt} />
    </Helmet>
  );
};

export default PageMeta;
