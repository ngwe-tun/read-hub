// app/upload/page.tsx
'use client'; // This is required for client-side interaction (like useState and onClick)

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client'; // Import your Supabase client

export default function UploadPage() {
  // Create state variables for our form fields
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [bookFile, setBookFile] = useState<File | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');

  // 1. Initialize the Supabase client
  const supabase = createClient();

  // 2. Handle the cover file selection
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setCoverFile(e.target.files[0]);
    }
  };

  // 3. Handle the book file selection
  const handleBookFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setBookFile(e.target.files[0]);
    }
  };

  // 4. Handle the form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent the form from refreshing the page

    if (!title || !bookFile) {
      setMessage('Error: Please provide at least a title and a book file.');
      return;
    }

    setIsUploading(true);
    setMessage('Uploading... please wait.');

    try {
      // --- UPLOAD BOOK FILE ---
      // We create a unique path for the book file.
      const bookFilePath = `books/${Date.now()}_${bookFile.name}`;
      const { error: bookUploadError } = await supabase.storage
        .from('book-files') // Your bucket name from Step 1
        .upload(bookFilePath, bookFile);

      if (bookUploadError) throw bookUploadError;

      // --- (OPTIONAL) UPLOAD COVER FILE ---
      let coverFilePath = null;
      if (coverFile) {
        coverFilePath = `covers/${Date.now()}_${coverFile.name}`;
        const { error: coverUploadError } = await supabase.storage
          .from('book-covers') // Your bucket name from Step 1
          .upload(coverFilePath, coverFile);
        
        // We won't stop the process if cover upload fails, but we'll log it
        if (coverUploadError) {
          console.error('Cover upload failed:', coverUploadError.message);
          coverFilePath = null; // Reset path so it doesn't save a broken link
        }
      }

      // --- INSERT METADATA INTO DATABASE ---
      // Now, insert the record into the 'books' table
      const { error: dbError } = await supabase
        .from('books') // Your table name from Step 1
        .insert({
          title: title,
          author: author,
          description: description,
          book_file_path: bookFilePath, // Save the *path*
          cover_image_path: coverFilePath, // Save the *path*
        });

      if (dbError) throw dbError;

      // If we get here, it was a success!
      setMessage('Book uploaded successfully!');
      // Clear the form
      setTitle('');
      setAuthor('');
      setDescription('');
      setCoverFile(null);
      setBookFile(null);
      // Reset file input fields (a bit of a trick)
      (document.getElementById('coverInput') as HTMLInputElement).value = '';
      (document.getElementById('bookInput') as HTMLInputElement).value = '';

    } catch (error: any) {
      console.error('Error uploading book:', error.message);
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // 5. This is the HTML form (JSX)
  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: 'auto' }}>
      <h1>Upload New Book</h1>
      <p>This page should be protected for Admins only.</p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label>Title *</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div>
          <label>Author</label>
          <input 
            type="text" 
            value={author} 
            onChange={(e) => setAuthor(e.target.value)} 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div>
          <label>Description</label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            style={{ width: '100%', padding: '8px', minHeight: '80px' }}
          />
        </div>
        
        <div>
          <label>Cover Image</label>
          <input 
            id="coverInput"
            type="file" 
            accept="image/*" 
            onChange={handleCoverChange} 
          />
        </div>
        
        <div>
          <label>Book File (PDF, ePub) *</label>
          <input 
            id="bookInput"
            type="file" 
            accept=".pdf,.epub" 
            onChange={handleBookFileChange} 
            required 
          />
        </div>

        <button type="submit" disabled={isUploading} style={{ padding: '10px', background: '#0070f3', color: 'white', border: 'none', cursor: 'pointer' }}>
          {isUploading ? 'Uploading...' : 'Upload Book'}
        </button>

        {message && <p>{message}</p>}
      </form>
    </div>
  );
}