import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Jungfrau Wallet",
  description: "Closed-loop tourism wallet MVP for the Jungfrau Region"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
