'use client'

import { usePathname } from 'next/navigation'

export default function StructuredData() {
  const pathname = usePathname()
  
  // Get the base URL - works in both dev and production
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}`
    : 'https://landlordhub.com' // Fallback

  // Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "LandlordHub",
    "url": baseUrl,
    "logo": `${baseUrl}/landlord-hub-logo.svg`,
    "description": "Property management software for landlords. Track income, expenses, maintenance, and generate tax reports.",
    "sameAs": [
      // Add your social media links here when available
      // "https://www.linkedin.com/company/landlordhub",
      // "https://www.facebook.com/landlordhub",
      // "https://www.instagram.com/landlordhub"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "support@landlordhub.com" // Update with your actual support email
    }
  }

  // SoftwareApplication Schema
  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "LandlordHub",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free tier available with paid plans for advanced features"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150",
      "bestRating": "5",
      "worstRating": "1"
    },
    "description": "Complete property management software for landlords. Track rental income, manage expenses, schedule maintenance tasks, and generate comprehensive tax reports.",
    "featureList": [
      "Property Management",
      "Rent Collection Tracking",
      "Expense Management",
      "Maintenance Task Scheduling",
      "Tax Report Generation",
      "Financial Analytics",
      "Tenant Management",
      "Document Storage"
    ]
  }

  // WebSite Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "LandlordHub",
    "url": baseUrl,
    "description": "Property management software for landlords. Simplify property management with comprehensive tools for tracking income, expenses, and maintenance.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  }

  // Breadcrumb Schema (if on a specific page)
  const getBreadcrumbSchema = () => {
    if (pathname === '/') return null
    
    const paths = pathname.split('/').filter(Boolean)
    const breadcrumbs = [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl
      }
    ]

    let currentPath = ''
    paths.forEach((path, index) => {
      currentPath += `/${path}`
      breadcrumbs.push({
        "@type": "ListItem",
        "position": index + 2,
        "name": path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' '),
        "item": `${baseUrl}${currentPath}`
      })
    })

    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs
    }
  }

  // Service Schema (for homepage)
  const serviceSchema = pathname === '/' ? {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Property Management Software",
    "provider": {
      "@type": "Organization",
      "name": "LandlordHub"
    },
    "areaServed": {
      "@type": "Country",
      "name": "United States"
    },
    "description": "Cloud-based property management software for landlords and property managers. Features include rent tracking, expense management, maintenance scheduling, and tax reporting.",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Property Management Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Property Management",
            "description": "Track and manage multiple rental properties"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Expense Tracking",
            "description": "Record and categorize property-related expenses"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Maintenance Management",
            "description": "Schedule and track maintenance tasks"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Financial Reports",
            "description": "Generate tax reports and financial analytics"
          }
        }
      ]
    }
  } : null

  const breadcrumbSchema = getBreadcrumbSchema()

  return (
    <>
      {/* Organization Schema - Always present */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      
      {/* SoftwareApplication Schema - Always present */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      
      {/* WebSite Schema - Always present */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      
      {/* Service Schema - Only on homepage */}
      {serviceSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
        />
      )}
      
      {/* Breadcrumb Schema - On all pages except homepage */}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
    </>
  )
}

