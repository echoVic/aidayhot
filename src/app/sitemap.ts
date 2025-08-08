import { MetadataRoute } from 'next';

const BASE_URL = 'https://www.dayhot.top';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '', 
    '/subscription', 
    '/subscription/success', 
    '/subscription/error'
  ];

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'monthly',
    priority: route === '' ? 1.0 : 0.8,
  }));
}
