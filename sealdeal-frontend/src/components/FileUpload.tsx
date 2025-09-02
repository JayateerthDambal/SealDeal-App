import React, { useState } from 'react';
import { storage, auth } from '../firebase';
import { ref, uploadBytes } from 'firebase/storage';

// This component now needs to know which deal it's uploading for
interface FileUploadProps {
  dealId: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ dealId }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a PDF file first.');
      return;
    }
    if (!auth.currentUser) {
      setMessage('You must be logged in to upload a file.');
      return;
    }

    setUploading(true);
    setMessage(`Uploading ${file.name}...`);

    // **CRITICAL CHANGE HERE**
    // The path now includes the dealId, which our backend function needs
    const storageRef = ref(storage, `uploads/${auth.currentUser.uid}/${dealId}/${file.name}`);

    try {
      const snapshot = await uploadBytes(storageRef, file);
      console.log('Uploaded a file!', snapshot);
      setMessage(`Successfully uploaded ${file.name}!`);
      setFile(null);
    } catch (error) {
      console.error("Upload failed:", error);
      setMessage('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h4>Upload Pitch Deck (PDF only)</h4>
      <input type="file" accept=".pdf" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default FileUpload;