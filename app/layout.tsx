import type { Metadata } from "next";
import { appBranding } from "@/lib/branding";
import "./globals.css";

export const metadata: Metadata = {
  title: appBranding.name,
  description: appBranding.tagline,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
