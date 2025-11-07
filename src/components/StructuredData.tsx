export default function StructuredData() {
  const baseUrl = 'https://landlordhubapp.com'

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "LandlordHub",
    "url": baseUrl,
    "logo": `${baseUrl}/logo_trans.svg`,
    "description": "Property management software for landlords. Track income, expenses, maintenance, and generate tax reports.",
    "sameAs": [
      "https://www.linkedin.com/company/landlordhub",
      "https://www.facebook.com/landlordhubapp",
      "https://www.instagram.com/landlordhubapp/"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "support@landlordhubapp.com"
    }
  }

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

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "LandlordHub",
    "url": baseUrl,
    "description": "Property management software for landlords. Simplify property management with comprehensive tools for tracking income, expenses, and maintenance."
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
    </>
  )
}

