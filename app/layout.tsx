import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "7even — Distribution & label tools",
  description:
    "Ship your music to every major store, track streams and earnings in one place, and get paid in mobile money or USD.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
