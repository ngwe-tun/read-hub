// app/read/[id]/BookReaderClient.tsx
'use client'; // This is now the Client Component

import dynamic from 'next/dynamic';

// We moved the dynamic import here
const BookReaderWithNoSSR = dynamic(
  () => import('./BookReader'), 
  { 
    ssr: false, // This is allowed in a Client Component
    loading: () => <p style={{ padding: '20px' }}>Loading your book...</p> 
  }
);

// This component receives the bookId as a prop
export default function BookReaderClient({ bookId }: { bookId: string }) {
  return <BookReaderWithNoSSR bookId={bookId} />;
}