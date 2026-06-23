"use client";

import { useEffect } from "react";

const readonlySelector = "input, textarea, select, [contenteditable='true']";

export function DemoReadonlyGuard() {
  useEffect(() => {
    const syncReadonlyFields = () => {
      document.querySelectorAll<HTMLElement>(readonlySelector).forEach((element) => {
        element.tabIndex = -1;
        element.setAttribute("aria-disabled", "true");
        element.setAttribute("aria-readonly", "true");

        if (element.hasAttribute("contenteditable")) {
          element.setAttribute("contenteditable", "false");
        }
      });
    };

    syncReadonlyFields();

    const observer = new MutationObserver(syncReadonlyFields);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] rounded-full border border-amber-400/30 bg-black/90 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-300 shadow-2xl shadow-black/40">
      Demo somente visual
    </div>
  );
}
