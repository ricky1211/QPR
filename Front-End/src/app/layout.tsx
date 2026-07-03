import "./globals.css";

export const metadata = {
  title: "MTM Quality Problem Report (QPR) Portal",
  description: "Astra Otoparts Group - PT. Menara Terus Makmur Quality Problem Report (QPR) Management Portal.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-slate-50">{children}</body>
    </html>
  );
}
