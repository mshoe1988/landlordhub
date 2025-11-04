import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://landlordhubapp.com'
  const now = new Date()

  const publicRoutes = [
    { url: '/', changeFrequency: 'weekly', priority: 1.0 },
    { url: '/login', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/signup', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/pricing', changeFrequency: 'weekly', priority: 0.9 },
    { url: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
  ] as const

  return publicRoutes.map((r) => ({
    url: `${baseUrl}${r.url}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))
}


