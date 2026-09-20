import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "./editor.css";

// Display face: headings, buttons, numerals.
const fredoka = Fredoka({
  variable: "--nf-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Body face: paragraphs, labels, form text.
const nunito = Nunito_Sans({
  variable: "--nf-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wisker",
  description:
    "Your intelligent study companion - create notes, flashcards, and learning tools powered by AI",
  other: {
    "google-site-verification": "4143521375584293",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FFF9F2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`light ${fredoka.variable} ${nunito.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Force light mode - prevent system dark mode from being applied
              document.documentElement.classList.remove('dark');
              document.documentElement.classList.add('light');
              document.documentElement.style.colorScheme = 'light';
            `,
          }}
        />
        <meta name="color-scheme" content="light only" />
        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4143521375584293"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body
        className="antialiased font-sans bg-background text-foreground"
        suppressHydrationWarning
      >
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-8BNJV7KG36"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-8BNJV7KG36');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
