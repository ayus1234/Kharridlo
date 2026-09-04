import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
