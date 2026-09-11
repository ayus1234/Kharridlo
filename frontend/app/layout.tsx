import type { Metadata } from "next";
import { Inter, Hanken_Grotesk, Roboto_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kharridlo — From AI intent to trusted transactions.",
  description: "AI-native commerce platform for bounded, explainable Razorpay transactions. From AI intent to trusted transactions.",
  icons: {
    icon: "/assets/kharridlo-icon.png",
    shortcut: "/assets/kharridlo-icon.png",
    apple: "/assets/kharridlo-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${hankenGrotesk.variable} ${robotoMono.variable}`}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
