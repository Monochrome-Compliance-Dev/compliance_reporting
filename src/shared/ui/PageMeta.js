import { Helmet } from "react-helmet-async";

const PageMeta = ({ title, description, image, url: overrideUrl }) => {
  const fullTitle = title
    ? `${title} | Monochrome Compliance`
    : "Monochrome Compliance | Payment Data & Compliance";

  const metaDescription =
    description ||
    "Payment data, compliance, and reporting solutions for complex organisations, including Payment Times Reporting (PTRS). Improve visibility, manage risk, and strengthen payment performance.";

  // Fallback image used when a page does not provide an `image` prop.
  // This should be a publicly accessible absolute URL so LinkedIn/Twitter can fetch it.
  const defaultImage =
    "https://monochrome-compliance.com/images/landing-page/expertise-compliance.jpg";

  const metaImage = image || defaultImage;

  const currentUrl =
    overrideUrl ||
    (typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}`
      : "https://monochrome-compliance.com/");

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={currentUrl} />

      <meta property="og:site_name" content="Monochrome Compliance" />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
      <meta name="twitter:image:alt" content={fullTitle} />
    </Helmet>
  );
};

export default PageMeta;
