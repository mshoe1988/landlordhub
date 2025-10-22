import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LandlordHub - Property Management Suite",
  description: "Manage your rental properties with ease. Track income, expenses, maintenance, and generate tax reports.",
  keywords: "property management, rental properties, landlord, real estate, tax reporting, expense tracking",
  authors: [{ name: "LandlordHub" }],
  openGraph: {
    title: "LandlordHub - Property Management Suite",
    description: "Manage your rental properties with ease. Track income, expenses, maintenance, and generate tax reports.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "LandlordHub - Property Management Suite",
    description: "Manage your rental properties with ease. Track income, expenses, maintenance, and generate tax reports.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
        <html lang="en">
          <head>
            <link rel="icon" href="/favicon.ico" />
          </head>
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            <AuthProvider>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </AuthProvider>
          </body>
        </html>
  );
}
