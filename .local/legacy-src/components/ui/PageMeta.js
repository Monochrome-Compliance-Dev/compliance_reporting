import { Helmet } from "react-helmet-async";

const PageMeta = ({ title, description }) => {
  const fullTitle = title
    ? `${title} | Monochrome Compliance`
    : "Monochrome Compliance";

  const metaDescription =
    description ||
    "Simplify Payment Times Reporting, Modern Slavery, and compliance obligations with Monochrome Compliance.";

  const url = typeof window !== "undefined" ? window.location.href : "";

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
    </Helmet>
  );
};

export default PageMeta;
