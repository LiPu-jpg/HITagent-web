import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HITA Agent",
  description: "HIT Agent Web Client",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
