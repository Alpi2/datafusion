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
        {/* `same-runtime` is loaded client-side in `ClientBody` to avoid
            hydration-time DOM mutations that cause React hydration warnings. */}
        {/* Google Analytics (gtag) */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <Script id="gtag-init">{`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');`}</Script>
          </>
        )}
        {/* Content Security Policy from env (NEXT_PUBLIC_CSP) */}
        {process.env.NEXT_PUBLIC_CSP && (
          <meta httpEquiv="Content-Security-Policy" content={process.env.NEXT_PUBLIC_CSP} />
        )}
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
