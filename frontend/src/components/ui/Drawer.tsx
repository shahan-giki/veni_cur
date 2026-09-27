import { useEffect, useId, useRef, type ReactNode } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Accessible name; also shown as heading unless `showTitle` is false. */
  title: string;
  showTitle?: boolean;
  /** Optional content in the head row (e.g. search beside Close). */
  headerContent?: ReactNode;
  side?: "left" | "right";
  children: ReactNode;
};

/** Side tray. Unmounts when closed so it can never obscure focus behind it. */
export function Drawer({
  open,
  onClose,
  title,
  showTitle = true,
  headerContent,
  side = "left",
  children,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Held in a ref so a caller's inline onClose can't retrigger the focus effect
  // on every parent render, which would steal focus out of fields as you type.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const preferred =
      panel?.querySelector<HTMLElement>(".drawer__head input, .drawer__head button[type='submit']") ??
      panel?.querySelector<HTMLElement>(`.drawer__body ${FOCUSABLE}`);
    (preferred ?? panel?.querySelector<HTMLElement>(FOCUSABLE))?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open) return null;

  const headClass = [
    "drawer__head",
    !showTitle && "drawer__head--minimal",
    headerContent && "drawer__head--with-content",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="drawer-scrim" onClick={onClose}>
      <div
        ref={panelRef}
        className={`drawer drawer--${side}`}
        role="dialog"
        aria-modal="true"
        {...(showTitle
          ? { "aria-labelledby": titleId }
          : { "aria-label": title })}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={headClass}>
          {showTitle ? (
            <h2 id={titleId} className="drawer__title">
              {title}
            </h2>
          ) : null}
          {headerContent ? (
            <div className="drawer__head-content">{headerContent}</div>
          ) : null}
          <button
            type="button"
            className="drawer__close"
            onClick={onClose}
            aria-label={`Close ${title}`}
          >
            ×
          </button>
        </div>
        <div className="drawer__body">{children}</div>
      </div>
    </div>
  );
}
