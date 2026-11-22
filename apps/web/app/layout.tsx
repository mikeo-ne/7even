import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "7even — an agent that runs your businesses",
  description:
    "A personal AI agent that lives on your Mac, manages your businesses, and talks to other agents over the open A2A protocol.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
