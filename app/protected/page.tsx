// app/protected/page.tsx
'use client'; // This page needs to be a client component

import Link from 'next/link';
import { createClient } from '@/lib/supabase/client'; 
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';

// Define a type for our book data
type Book = {
  id: string;
  title: string;
  author: string | null;
  cover_image_path: string | null;
  book_file_path: string;
};

export default function ProtectedPage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>([]); // State to hold our list of books
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserAndFetchBooks = async () => {
      // 1. Check if a user is logged in
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        // Handle no user (e.g., redirect to login)
      } else {
        setUser(data.user);
        
        // 2. If user exists, fetch the books
        const { data: bookData, error: bookError } = await supabase
          .from('books')
          .select('*'); // Get all columns from all rows

        if (bookError) {
          console.error('Error fetching books:', bookError.message);
        } else {
          setBooks(bookData as Book[]);
        }
      }
      setLoading(false);
    };

    checkUserAndFetchBooks();
  }, []);

  // 3. Function to get a public URL for cover images
  const getCoverUrl = (path: string | null) => {
    if (!path) return '/default-cover.png'; // A placeholder image
    
    const { data } = supabase.storage
      .from('book-covers')
      .getPublicUrl(path);
      
    return data.publicUrl;
  };

  // 4. Function to handle downloading a book
  const handleDownload = async (book: Book) => {
    alert(`Downloading ${book.title}...`);
    try {
      const { data, error } = await supabase.storage
        .from('book-files')
        .download(book.book_file_path); // Download the file

      if (error) throw error;
      
      // We need to create a temporary link to trigger the browser download
      const blob = new Blob([data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${book.title}.pdf`; // You might need to get the file extension
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error: any) {
      console.error('Error downloading file:', error.message);
      alert('Error downloading file.');
    }
  };

  if (loading) {
    return <div>Loading your library...</div>;
  }

  // 5. This is the HTML (JSX) for the page
  return (
    <div className="flex-1 w-full flex flex-col gap-20 items-center">
      <div className="w-full">
        {/* ... (Keep the navigation bar from the original file) ... */}
      </div>

      <div className="flex-1 flex flex-col gap-20 max-w-4xl px-3">
        {/* ... (Keep the user info and sign-out form from the original file) ... */}
        
        {/* --- OUR NEW BOOK LIST --- */}
        <main className="flex-1 flex flex-col gap-6">
          <h2 className="font-bold text-4xl mb-4">My Library</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            {books.length > 0 ? (
              books.map((book) => (
                <div key={book.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
                  <img 
                    src={getCoverUrl(book.cover_image_path)} 
                    alt={`${book.title} cover`} 
                    style={{ width: '100%', height: '250px', objectFit: 'cover' }} 
                  />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{book.title}</h3>
                  <p style={{ color: '#555' }}>{book.author || 'Unknown Author'}</p>
                  
                  <button 
                    onClick={() => handleDownload(book)} 
                    style={{ width: '100%', padding: '8px', marginTop: '10px', background: '#0070f3', color: 'white', border: 'none', cursor: 'pointer' }}
                  >
                    Download
                  </button>
                  {/* We will add the "Read Online" button in the next step */}
                  <Link 
                    href={`/read/${book.id}`}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px',
                      marginTop: '10px',                   
                      background: '#555',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'center',
                      textDecoration: 'none',
                      borderRadius: '4px'
                      }}
                    >
                      Read Online
                    </Link>
                </div>
              ))
            ) : (
              <p>No books in the library yet. Go to the /upload page to add some!</p>
            )}
          </div>
        </main>
      </div>

      {/* ... (Keep the footer from the original file) ... */}
    </div>
  );
}