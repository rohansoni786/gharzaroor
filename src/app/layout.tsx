import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gharzaroor.pk - Karachi Shared Flats",
  description: "Find verified shared flats near KU, IBA, NED. Phone‑verified owners, instant contact reveal, zero spam.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className + " bg-gray-50 text-gray-900 antialiased"}>
        {children}
      </body>
    </html>
  );
}