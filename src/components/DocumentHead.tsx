import { useEffect } from 'react';

interface DocumentHeadProps {
  title: string;
  description?: string;
}

export function DocumentHead({ title, description = 'CC Trace Viewer - Analyze and explore trace data' }: DocumentHeadProps) {
  useEffect(() => {
    document.title = `${title} | CC Trace Viewer`;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = description;
      document.head.appendChild(meta);
    }
  }, [title, description]);

  return null;
}