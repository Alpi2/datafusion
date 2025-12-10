import type { Metadata } from "next";
import "./globals.css";
import ClientBody from "./ClientBody";
import { Header } from "../components/navigation/Header";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Inflectiv - Transform Data ",
  description:
    "Generate enterprise-grade synthetic datasets with AI. Earn $INFL tokens every time someone uses your data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          crossOrigin="anonymous"
          src="//unpkg.com/same-runtime/dist/index.global.js"
        />
      </head>
      <body
        suppressHydrationWarning
        className="dark antialiased bg-background text-foreground"
      >
        <ClientBody>
          <Header />
          {children}
        </ClientBody>
      </body>
    </html>
  );
}
