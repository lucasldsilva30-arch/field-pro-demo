import "./globals.css";

export const metadata = {
  title: "Sistema Ayronex",
  description: "Dashboard gerencial Ayronex",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
