import type { Metadata } from "next";
import { Fredoka, Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "./editor.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wisker",
  description:
    "Your intelligent study companion - create notes, flashcards, and learning tools powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="light">
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
      </head>
      <body
        className={`${fredoka.variable} ${poppins.variable} antialiased font-fredoka bg-background text-foreground`}
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
