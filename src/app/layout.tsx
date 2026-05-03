import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gharzaroor.pk - Karachi Shared Flats | Find Verified Rooms",
  description:
    "Find verified shared flats near KU, IBA, NED. Phone‑verified owners, instant contact reveal, zero spam. Karachi's trusted platform for students and professionals.",
  openGraph: {
    title: "Gharzaroor.pk - Karachi Shared Flats",
    description: "Find verified shared flats near KU, IBA, NED.",
    type: "website",
    locale: "en_PK",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gharzaroor.pk",
    description: "Karachi's trusted shared flats platform",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className + " bg-gray-50 text-gray-900 antialiased"}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}