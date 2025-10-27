// app/read/[id]/page.tsx

// This tells Next.js to always render this page on-demand
export const dynamic = 'force-dynamic'; 

import BookReaderClient from './BookReaderClient';

// 1. Mark the component as async
// 2. Change the type: 'params' is a Promise that will resolve to { id: string }
export default async function ReadPage({ params }: { params: Promise<{ id: string }> }) {

  // 3. AWAIT the 'params' prop to get the resolved object
  const resolvedParams = await params;
  const bookId = resolvedParams.id; 

  // 4. Pass the ID as a prop to the client component
  return (
    <div>
      <BookReaderClient bookId={bookId} />
    </div>
  );
}