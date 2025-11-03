import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Dress My Style - AI-Powered Closet Management",
  description: "Organize your wardrobe with AI assistance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="font-sans bg-[theme(colors.bg-default)] text-[theme(colors.primary)]"
      >
        <AuthProvider>
          <div className="max-w-xl md:max-w-6xl mx-auto">
            <Header />
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
