"use client";

import { useEffect } from "react";

const interactiveSelector = "a, button, input, textarea, select, [role='button'], [contenteditable='true']";

export function DemoReadonlyGuard() {
  useEffect(() => {
    const disableFocus = () => {
      document.querySelectorAll<HTMLElement>(interactiveSelector).forEach((element) => {
        element.tabIndex = -1;
        element.setAttribute("aria-disabled", "true");

        if (element.hasAttribute("contenteditable")) {
          element.setAttribute("contenteditable", "false");
        }
      });
    };

    const blockInteraction = (event: Event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
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
