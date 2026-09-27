import { useEffect } from "react";

type Props = {
  data: Record<string, unknown>;
};

/**
 * Injects a single application/ld+json script for the current view.
 * Replaces prior injections from this component on update/unmount.
 */
export function JsonLd({ data }: Props) {
  const payload = JSON.stringify(data);

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.veniJsonLd = "true";
    script.text = payload;
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [payload]);

  return null;
}
