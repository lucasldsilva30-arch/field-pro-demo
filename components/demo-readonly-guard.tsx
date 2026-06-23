"use client";

import { useEffect } from "react";

const blockedSelector = "button, input, textarea, select, [role='button'], [contenteditable='true']";
const allowedSelector = "[data-demo-nav='true'], [data-demo-allow='true'], a[href]";

export function DemoReadonlyGuard() {
  useEffect(() => {
    const disableFocus = () => {
      document.querySelectorAll<HTMLElement>(blockedSelector).forEach((element) => {
        if (element.matches(allowedSelector) || element.closest(allowedSelector)) {
          element.removeAttribute("aria-disabled");
          if (element.tabIndex < 0) {
            element.tabIndex = 0;
          }
          return;
        }

        element.tabIndex = -1;
        element.setAttribute("aria-disabled", "true");

        if (element.hasAttribute("contenteditable")) {
          element.setAttribute("contenteditable", "false");
        }
      });
    };

    const blockInteraction = (event: Event) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      const target = event.target.closest(allowedSelector);

      if (target) {
        return;
      }

      const interactiveElement = event.target.closest(blockedSelector);

      if (interactiveElement) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      const labelElement = event.target.closest("label");

      if (labelElement && !labelElement.matches(allowedSelector) && !labelElement.closest(allowedSelector)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    const blockKeyboardInteraction = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      blockInteraction(event);
    };

    disableFocus();

    const observer = new MutationObserver(disableFocus);
    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener("click", blockInteraction, true);
    document.addEventListener("dblclick", blockInteraction, true);
    document.addEventListener("submit", blockInteraction, true);
    document.addEventListener("input", blockInteraction, true);
    document.addEventListener("change", blockInteraction, true);
    document.addEventListener("keydown", blockKeyboardInteraction, true);

    return () => {
      observer.disconnect();
      document.removeEventListener("click", blockInteraction, true);
      document.removeEventListener("dblclick", blockInteraction, true);
      document.removeEventListener("submit", blockInteraction, true);
      document.removeEventListener("input", blockInteraction, true);
      document.removeEventListener("change", blockInteraction, true);
      document.removeEventListener("keydown", blockKeyboardInteraction, true);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] rounded-full border border-amber-400/30 bg-black/90 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-300 shadow-2xl shadow-black/40">
      Demo somente visual
    </div>
  );
}
