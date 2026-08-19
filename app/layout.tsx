import type { Metadata } from "next";
import "./globals.css";

const siteUrl = new URL("https://vfirst-pi.vercel.app");
const title = "VFirst - Pure, Natural, Hygienic Spices";
const description =
  "Premium VFirst natural products and fresh spice blends, packed for pure, hygienic everyday cooking.";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title,
  description,
  applicationName: "VFirst",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: "VFirst",
    locale: "en_IN",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title,
    description
  },
  icons: {
    icon: "https://vfirstindia.com/vfirst-logo.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
