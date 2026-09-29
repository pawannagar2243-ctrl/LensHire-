import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { setDocumentSEO } from '../../utils/seo';

const pageMetadata = {
  '/': {
    title: 'LensHire | Rent Cameras, Lenses and Film Gear',
    description: 'Rent professional cameras, lenses and filmmaking gear online. Browse equipment, compare daily prices and book your next shoot with LensHire.',
  },
  '/cameras': {
    title: 'Rent Cameras and Lenses Online | LensHire',
    description: 'Browse DSLR, mirrorless and cinema cameras for rent. Compare camera features and daily rental prices at LensHire.',
  },
  '/categories': {
    title: 'Camera Rental Categories | LensHire',
    description: 'Explore camera, lens and photography gear rental categories to find the right equipment for your shoot.',
  },
  '/search': {
    title: 'Search Cameras and Lenses | LensHire',
    description: 'Search LensHire camera and lens rentals by name, brand or model.',
    noIndex: true,
  },
  '/about': {
    title: 'About LensHire | Camera and Film Gear Rental',
    description: 'Learn about LensHire and our camera, lens and filmmaking equipment rental service for photographers and filmmakers.',
  },
  '/contact': {
    title: 'Contact LensHire | Camera Rental Support',
    description: 'Contact LensHire for help choosing camera rental equipment, questions about bookings or support with an existing rental.',
  },
  '/login': { title: 'Sign In | LensHire', description: 'Sign in to your LensHire account.', noIndex: true },
  '/register': { title: 'Create an Account | LensHire', description: 'Create a LensHire account to book camera and filmmaking gear.', noIndex: true },
  '/my-bookings': { title: 'My Bookings | LensHire', description: 'View your LensHire camera rental bookings.', noIndex: true },
  '/profile': { title: 'Your Profile | LensHire', description: 'Manage your LensHire account profile.', noIndex: true },
};

const SEOManager = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const metadata = pageMetadata[pathname]
      || (pathname.startsWith('/booking/')
        ? { title: 'Camera Booking | LensHire', description: 'Book camera rental equipment with LensHire.', noIndex: true }
        : pathname.startsWith('/cameras/')
          ? { title: 'Camera Rental | LensHire', description: 'View camera specifications, rental price and availability on LensHire.' }
          : { title: 'LensHire | Camera Rental', description: 'Rent cameras, lenses and filmmaking gear with LensHire.', noIndex: true });

    setDocumentSEO(metadata, pathname);
  }, [pathname]);

  return null;
};

export default SEOManager;