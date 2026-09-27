import { useEffect } from "react";

type Props = {
  title: string;
  description?: string;
};

/** Sets document title and optional meta description for SPA routes. */
export function DocumentTitle({ title, description }: Props) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · Veni` : "Veni";
    let meta = document.querySelector('meta[name="description"]');
    if (description) {
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", description);
    }
    return () => {
      document.title = previous;
    };
  }, [title, description]);

  return null;
}
