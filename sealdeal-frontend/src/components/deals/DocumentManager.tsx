import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { File, Upload, Paperclip, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DocumentManagerProps {
  dealId: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

interface StoredDocument {
  id: string;
  fileName: string;
  storagePath: string;
  uploadedAt: Date;
}

export default function DocumentManager({ dealId }: DocumentManagerProps) {
  const { user } = useAuth();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [storedDocs, setStoredDocs] = useState<StoredDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Listen for stored documents in Firestore
  useEffect(() => {
    const docsRef = collection(db, 'deals', dealId, 'documents');
    const q = query(docsRef, orderBy('uploadedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt.toDate(),
      } as StoredDocument));
      setStoredDocs(docs);
      setLoadingDocs(false);
    });

    return () => unsubscribe();
  }, [dealId]);


  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!user) return;

    const newUploads: UploadingFile[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading',
    }));
    
    setUploadingFiles(prev => [...prev, ...newUploads]);

    acceptedFiles.forEach(file => {
      const storage = getStorage();
      const storageRef = ref(storage, `uploads/${user.uid}/${dealId}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadingFiles(prev => prev.map(f => 
            f.file === file ? { ...f, progress } : f
          ));
        },
        (error) => {
          console.error("Upload error:", error);
          setUploadingFiles(prev => prev.map(f => 
            f.file === file ? { ...f, status: 'error', error: error.message } : f
          ));
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then(() => {
            setUploadingFiles(prev => prev.map(f => 
              f.file === file ? { ...f, status: 'success', progress: 100 } : f
            ));
          });
        }
      );
    });
  }, [user, dealId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
    }
  });

  return (
    <div className="bg-card border border-primary/10 rounded-lg p-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center">
        <Paperclip className="h-6 w-6 mr-2 text-primary"/>
        Source Documents
      </h2>
      
      {/* --- Uploader UI --- */}
      <div {...getRootProps()} className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ease-in-out",
        isDragActive ? "border-primary bg-primary/10" : "border-primary/20 hover:border-primary/40 hover:bg-primary/5"
      )}>
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center">
          <Upload className="h-12 w-12 text-muted-foreground mb-4" />
          {isDragActive ?
            <p className="text-primary font-semibold text-lg">Drop the files here ...</p> :
            <p className="text-muted-foreground text-lg">Drag 'n' drop files here, or click to select</p>
          }
          <p className="text-sm text-muted-foreground mt-2">Supported: PDF, PPTX, XLSX, CSV, TXT</p>
        </div>
      </div>

      {/* --- Uploading Files List --- */}
      {uploadingFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-lg mb-2">Uploads</h3>
          <ul className="space-y-3">
            {uploadingFiles.map((upload, index) => (
              <li key={index} className="flex items-center gap-4 p-2 rounded-md bg-background">
                <File className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                <div className="flex-grow">
                  <p className="font-medium truncate">{upload.file.name}</p>
                  <div className="w-full bg-primary/10 rounded-full h-2 mt-1">
                    <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${upload.progress}%` }}></div>
                  </div>
                </div>
                {upload.status === 'uploading' && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                {upload.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                {upload.status === 'error' && <AlertTriangle className="h-5 w-5 text-destructive" />}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* --- Stored Documents List --- */}
      <div className="mt-6">
        <h3 className="font-semibold text-lg mb-2">Uploaded Files</h3>
        {loadingDocs ? (
          <p className="text-muted-foreground">Loading documents...</p>
        ) : storedDocs.length === 0 ? (
          <p className="text-muted-foreground">No documents have been uploaded for this deal yet.</p>
        ) : (
          <ul className="space-y-2">
            {storedDocs.map(doc => (
              <li key={doc.id} className="flex items-center justify-between p-2 rounded-md hover:bg-primary/5">
                <div className="flex items-center gap-3">
                  <File className="h-5 w-5 text-primary"/>
                  <span className="font-medium">{doc.fileName}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {doc.uploadedAt.toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

