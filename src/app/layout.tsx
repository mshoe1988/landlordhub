import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import { Analytics } from '@vercel/analytics/react';
import GoogleAnalytics from "@/components/GoogleAnalytics";
import StructuredData from "@/components/StructuredData";
import "./register-sw";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://landlordhubapp.com'),
  applicationName: 'LandlordHub',
  title: {
    default: 'LandlordHub | Property Management Software for Small Landlords (1–20 Units)',
    template: '%s | LandlordHub'
  },
  description: 'Simplify rent collection, expense tracking, and maintenance in one dashboard. LandlordHub helps landlords with 1–20 units save 10+ hours a month — start free today.',
  keywords: [
    'property management software',
    'landlord software',
    'rental property management',
    'rent tracking',
    'expense tracking',
    'maintenance scheduling',
    'tax reports',
    'real estate software',
    'proptech'
  ],
  authors: [{ name: 'LandlordHub' }],
  creator: 'LandlordHub',
  publisher: 'LandlordHub',
  category: 'Real Estate',
  alternates: {
    canonical: '/'
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16.ico', sizes: '16x16', type: 'image/x-icon' },
      { url: '/favicon-32.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/Favicon.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/Favicon.png' },
    ],
  },
  openGraph: {
    title: 'LandlordHub: Simplify Life. Maximize Rentals.',
    description: 'Simplify rent collection, expenses, and maintenance in one app. LandlordHub makes property management easy for small landlords — start free today.',
    type: 'website',
    locale: 'en_US',
    url: 'https://landlordhubapp.com/',
    siteName: 'LandlordHub',
    images: [
      {
        url: '/landlord-hub-logo.png',
        width: 1200,
        height: 630,
        alt: 'LandlordHub'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LandlordHub: Simplify Life. Maximize Rentals.',
    description: 'Simplify rent collection, expenses, and maintenance in one app. LandlordHub makes property management easy for small landlords — start free today.',
    site: '@landlordhubapp',
    creator: '@landlordhubapp',
    images: ['/landlord-hub-logo.png']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1
    }
  },
  verification: {
    google: '90VRHnRDFeaKUCplraNlwJheZ9hKsuNNzifff2G5N8I'
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
        <html lang="en">
          <head>
            <link rel="icon" href="/favicon.ico?v=9" type="image/x-icon" />
            <link rel="icon" href="/favicon-16.ico?v=9" sizes="16x16" type="image/x-icon" />
            <link rel="icon" href="/favicon-32.ico?v=9" sizes="32x32" type="image/x-icon" />
            <link rel="icon" href="/Favicon.png?v=9" type="image/png" />
            <link rel="icon" href="/favicon.svg?v=9" type="image/svg+xml" />
            <link rel="shortcut icon" href="/favicon.ico?v=9" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LandlordHub" />
        <link rel="apple-touch-icon" href="/Favicon.png?v=9" />
            {/* Google Search Console Verification */}
            <meta name="google-site-verification" content="90VRHnRDFeaKUCplraNlwJheZ9hKsuNNzifff2G5N8I" />
          </head>
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            {/* Schema.org Structured Data */}
            <StructuredData />
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
              <Analytics />
              <GoogleAnalytics />
            </AuthProvider>
          </body>
        </html>
  );
}
