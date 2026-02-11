import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dating Cuba",
  description: "Dating app for Cubans",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
