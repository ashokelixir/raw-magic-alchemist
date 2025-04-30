
import { useState, useCallback } from "react";
import { Upload } from "lucide-react";

interface UploadAreaProps {
  onFileUpload: (file: File) => void;
}

const UploadArea = ({ onFileUpload }: UploadAreaProps) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  }, [onFileUpload]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  }, [onFileUpload]);

  return (
    <div className="flex items-center justify-center h-full p-8">
      <div 
        className={`
          w-full max-w-2xl h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 transition-colors
          ${isDragging ? 'border-editor-accent bg-editor-accent/10' : 'border-editor-border hover:border-editor-accent/50'}
        `}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 text-editor-accent mb-4" />
        <h2 className="text-xl font-medium text-white mb-2">Upload Image</h2>
        <p className="text-sm text-gray-400 mb-4 text-center">
          Drag and drop your ARW or JPG file here, or click to browse
          <br />
          <span className="text-xs">(ARW and JPG files are accepted)</span>
        </p>
        <label className="px-4 py-2 bg-editor-accent hover:bg-editor-accent/80 text-white rounded-md text-sm font-medium transition-colors cursor-pointer">
          Browse Files
          <input 
            type="file" 
            className="hidden" 
            accept=".arw,.jpg,.jpeg" 
            onChange={handleFileChange}
          />
        </label>
        <p className="text-xs text-gray-500 mt-4 text-center">
          Note: This is a demo app. In a real application, RAW files would be processed server-side.
        </p>
      </div>
    </div>
  );
};

export default UploadArea;
