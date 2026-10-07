import type { PropertyType } from './types';

export const site = {
  name: 'Imperium Realtors',
  tagline: 'Land & Plot Specialists',
  legalName: 'Imperium Realtors Pvt. Ltd.',
  city: 'Chennai',
  state: 'Tamil Nadu',
  since: 2015,
  phone: '+91 79041 95484',
  phoneAlt: '+91 73970 89859',
  phoneAlt2: '+91 90949 49447',
  phoneHref: 'tel:+917904195484',
  whatsapp: '917397089859',
  email: 'imperiumrealtorsinfo@gmail.com',
  address: 'East Coast Road, Paavakkam, Sholinganallur, Chennai – 600115, Tamil Nadu',
  addressLines: ['East Coast Road, Paavakkam,', 'Sholinganallur, Chennai – 600115, Tamil Nadu'],
  mapQuery: '12.963565,80.256223',
  reraId: 'TN/29/Layout/0418/2024',
};

/**
 * Categories the public site currently sells. Apartment, villa and commercial
 * records stay in the dataset so they can be switched back on by adding the
 * type here — nothing needs to be re-imported.
 */
export const ACTIVE_CATEGORIES: PropertyType[] = ['Plot'];

export const isActiveCategory = (type: PropertyType) => ACTIVE_CATEGORIES.includes(type);

export const whatsappLink = (message: string) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
