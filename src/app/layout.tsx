import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const ui = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
});

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
    <html lang="en" className={ui.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
