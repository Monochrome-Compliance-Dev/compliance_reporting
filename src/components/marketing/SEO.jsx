import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { adminService } from "../../services/admin/admin";

const StaticPageViewer = () => {
  const { slug } = useParams();
  const [content, setContent] = useState("");
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const data = await adminService.getBySlug(slug);
        const { content, title, ...rest } = data;

        setContent(content);
        setMeta({ title, ...rest });
        setError(false);
      } catch (err) {
        setError(true);
        setContent("");
        setMeta({});
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [slug]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading content.</div>;

  return (
    <div>
      <h1>{meta.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
};

export default StaticPageViewer;
