import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Localization QA — Translation & Scoring Pipeline",
  description:
    "A context-aware translation and objective quality-scoring prototype, built for Voxiis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
