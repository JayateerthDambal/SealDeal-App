import React, { useState, useCallback } from 'react';
import { storage, auth } from '../firebase';
import { ref, uploadBytes } from 'firebase/storage';

interface FileUploadProps {
  dealId: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ dealId }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const handleFiles = (fileList: FileList) => {
    const validFiles = Array.from(fileList).filter(file => {
      if (file.type === 'application/pdf') {
        return true;
      }
      setMessage(`${file.name} is not a PDF file and will be skipped.`);
      setTimeout(() => setMessage(''), 3000);
      return false;
    });
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setMessage('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File) => {
    if (!auth.currentUser) {
      throw new Error('You must be logged in to upload files.');
    }

    const storageRef = ref(storage, `uploads/${auth.currentUser.uid}/${dealId}/${file.name}`);
    
    // Simulate progress for better UX (Firebase doesn't provide upload progress by default)
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: Math.min((prev[file.name] || 0) + Math.random() * 30, 90)
      }));
    }, 200);

    try {
      await uploadBytes(storageRef, file);
      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
      return true;
    } catch (error) {
      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
      throw error;
    }
  };

  const handleUploadAll = async () => {
    if (files.length === 0) {
      setMessage('Please select at least one PDF file.');
      return;
    }

    setUploading(true);
    setMessage('');
    
    try {
      const uploadPromises = files.map(file => uploadFile(file));
      await Promise.all(uploadPromises);
      
      setMessage(`Successfully uploaded ${files.length} file(s)!`);
      setFiles([]);
      setUploadProgress({});
    } catch (error) {
      console.error("Upload failed:", error);
      setMessage('Some files failed to upload. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Drag and Drop Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-4">
          <div className="text-6xl text-gray-400">📁</div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload Investment Documents
            </h3>
            <p className="text-gray-600 mb-4">
              Drag and drop PDF files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supported files: Pitch decks, Financial statements, Business plans, Term sheets
            </p>
          </div>
          
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Choose Files
          </button>
        </div>
      </div>

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Selected Files ({files.length})</h4>
          <div className="space-y-3">
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-red-500 text-xl">📄</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                
                {uploadProgress[file.name] !== undefined ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress[file.name]}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">{Math.round(uploadProgress[file.name])}%</span>
                  </div>
                ) : (
                  <button
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                    className="text-red-600 hover:text-red-700 disabled:opacity-50 p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <button
            onClick={handleUploadAll}
            disabled={uploading}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {uploading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Uploading {files.length} file(s)...</span>
              </div>
            ) : (
              `Upload ${files.length} File(s)`
            )}
          </button>
        </div>
      )}

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-lg text-sm ${
          message.includes('Successfully') 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : message.includes('failed') || message.includes('skipped')
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-blue-50 border border-blue-200 text-blue-700'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default FileUpload;