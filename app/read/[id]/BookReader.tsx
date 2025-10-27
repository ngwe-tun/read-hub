// app/read/[id]/page.tsx
'use client';

import { createClient } from '@/lib/supabase/client'; // <-- Corrected import path
import { useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// --- IMPORTANT: PDF.js Worker setup ---
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";

// 2. REMOVE params from the function definition
export default function BookReader({ bookId }: { bookId: string }) {
  const supabase = createClient();

  const [bookFileUrl, setBookFileUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // The bookId is now a string, so we can check it directly
    if (bookId) {
      const fetchBook = async () => {
        try {
          // 1. Fetch the book's metadata from the database
          const { data: bookData, error: dbError } = await supabase
            .from('books')
            .select('title, book_file_path')
            .eq('id', bookId) // Find the book with this specific ID
            .single(); // We only expect one result

          if (dbError) throw dbError;
          if (!bookData) throw new Error('Book not found.');

          // 2. Get the public URL for the book file from Storage
          const { data: urlData } = supabase.storage
            .from('book-files')
            .getPublicUrl(bookData.book_file_path);
          
          if (!urlData.publicUrl) throw new Error('Could not get book file URL.');
          
          setBookFileUrl(urlData.publicUrl);
        } catch (error: any) {
          console.error('Error fetching book:', error.message);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };

      fetchBook();
    }
  }, [bookId]); // The dependency is now correct

  // Function called when the PDF document loads successfully
  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  // 3. Render the page
  if (loading) {
    return <div>Loading book...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!bookFileUrl) {
    return <div>Book file not available.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <h1>Reading Now</h1>
      <div style={{ border: '1px solid black', width: '100%', maxWidth: '800px' }}>
        <Document
          file={bookFileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(error) => setError(`Failed to load PDF: ${error.message}`)}
        >
          {/* We will render all pages. You can add pagination later. */}
          {Array.from(new Array(numPages || 0), (el, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              width={800} // Set a fixed width
            />
          ))}
        </Document>
      </div>
      <p>
        Page {numPages} of {numPages}
      </p>
    </div>
  );
}