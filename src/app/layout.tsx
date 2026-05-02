import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gharzaroor.pk - Karachi Shared Flats",
  description: "Find verified shared flats near KU, IBA, NED. Phone‑verified owners, instant contact reveal, zero spam.",
  metadataBase: new URL("https://gharzaroor.pk"),
  openGraph: {
    title: "Gharzaroor.pk - Find Your Perfect Shared Flat in Karachi",
    description: "Find verified shared flats near KU, IBA, NED. Phone‑verified owners, instant contact reveal, zero spam.",
    url: "https://gharzaroor.pk",
    siteName: "Gharzaroor.pk",
    locale: "en_PK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gharzaroor.pk - Karachi Shared Flats",
    description: "Find verified shared flats near KU, IBA, NED. Phone‑verified owners, instant contact reveal.",
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
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}