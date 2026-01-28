import React, { useEffect, useRef } from "react";

/**
 * Lightweight accessible modal.
 * - Escape closes
 * - Clicking backdrop closes
 * - Focuses first focusable element in content
 */

// PUBLIC_INTERFACE
export default function Modal({ title, children, isOpen, onClose, footer }) {
  /** Generic modal dialog. */
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);

    // focus management
    const t = setTimeout(() => {
      const el = panelRef.current;
      if (!el) return;
      const focusable = el.querySelector(
        'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable) focusable.focus();
    }, 0);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearTimeout(t);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="sn-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="sn-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={panelRef}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="sn-modal__header">
          <div className="sn-modal__title">{title}</div>
          <button className="sn-btn sn-btn--ghost" onClick={onClose} aria-label="Close dialog">
            Close
          </button>
        </div>

        <div className="sn-modal__body">{children}</div>

        {footer ? <div className="sn-modal__footer">{footer}</div> : null}
      </div>
    </div>
  );
}

