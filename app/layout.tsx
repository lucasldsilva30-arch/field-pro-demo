import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { DemoReadonlyGuard } from "@/components/demo-readonly-guard";
import "./globals.css";

export const metadata: Metadata = {
  title: "Field Pro Demo",
  description: "Demonstração de ERP operacional Field Pro",
  manifest: "/manifest.json",
  applicationName: "Field Pro",
  appleWebApp: {
    capable: true,
    title: "Field Pro",
    statusBarStyle: "black-translucent",
  },
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "apple-touch-icon", url: "/icon-192.png" },
  ],
};

export const viewport: Viewport = {
  themeColor: "#f5b900",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#f5b900" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Field Pro" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body data-demo-readonly suppressHydrationWarning>
        <DemoReadonlyGuard />
        <Script id="fieldpro-theme-bootstrap" strategy="beforeInteractive">{`
          (function () {
            try {
              var key = 'fieldpro-theme-v1';
              var raw = localStorage.getItem(key);
              var theme = raw ? JSON.parse(raw) : { mode: 'dark', accent: '#f5b900', fontScale: 1 };
              var mode = theme && theme.mode === 'light' ? 'light' : 'dark';
              document.documentElement.dataset.theme = mode;
              document.documentElement.classList.toggle('dark', mode === 'dark');
              if (theme && theme.accent) document.documentElement.style.setProperty('--erp-accent', theme.accent);
              if (theme && theme.fontScale) document.documentElement.style.setProperty('--erp-font-scale', String(theme.fontScale));
            } catch (error) {}
          })();
        `}</Script>
        <Script id="fieldpro-pwa-register" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
              navigator.serviceWorker.register('/sw.js').catch(function () {});
            });
          }
        `}</Script>
        {children}
      </body>
    </html>
  );
}
