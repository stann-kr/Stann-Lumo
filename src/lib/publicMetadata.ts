import type { Metadata } from 'next';

const SITE_URL = new URL('https://lumo.stann.kr');

interface PublicMetadataInput {
  title: string;
  description: string;
  path: string;
}

/** Builds route-specific discoverability metadata without exposing admin data. */
export function createPublicMetadata({ title, description, path }: PublicMetadataInput): Metadata {
  const url = new URL(path, SITE_URL).toString();

  return {
    metadataBase: SITE_URL,
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: 'STANN LUMO',
      title: `${title} | STANN LUMO`,
      description,
      url,
    },
    twitter: {
      card: 'summary',
      title: `${title} | STANN LUMO`,
      description,
    },
  };
}
