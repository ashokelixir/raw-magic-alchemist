
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import RawEditor from "@/components/RawEditor";
import UploadArea from "@/components/UploadArea";
import { FileImage } from "lucide-react";

const Index = () => {
  const [imageData, setImageData] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileUpload = (file: File) => {
    // Check if the file has an acceptable extension
    const fileName = file.name.toLowerCase();
    const isARW = fileName.endsWith('.arw');
    const isJPG = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg');
    
    if (!isARW && !isJPG) {
      toast({
        title: "Invalid file type",
        description: "Please upload an ARW or JPG file only.",
        variant: "destructive",
      });
      return;
    }

    setImageData(file);
    
    if (isJPG) {
      // For JPG files, we can directly create a preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      // For ARW files, create a placeholder preview
      // Since browsers can't directly display ARW files, we'll use a placeholder image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 800;
      canvas.height = 600;
      
      if (ctx) {
        // Fill with dark gray background
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add text indicating this is a preview
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Preview for: ${file.name}`, canvas.width/2, canvas.height/2);
        ctx.fillText('(RAW file preview - actual processing in real app)', canvas.width/2, canvas.height/2 + 40);
        
        // Convert to data URL and use as preview
        setPreviewUrl(canvas.toDataURL('image/jpeg'));
      } else {
        // Fallback to object URL if canvas context isn't available
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    }
    
    const fileType = isARW ? "ARW" : "JPG";
    toast({
      title: `${fileType} file uploaded`,
      description: "Your image has been loaded successfully.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-editor-panel border-b border-editor-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileImage className="w-6 h-6 text-editor-accent" />
            <h1 className="text-xl font-bold text-white">RAW Studio</h1>
          </div>
          <div className="flex items-center space-x-4">
            {previewUrl && (
              <button 
                className="px-4 py-2 bg-editor-accent hover:bg-editor-accent/80 text-white rounded-md text-sm font-medium transition-colors"
                onClick={() => {
                  // In a real app, we'd process the image for export
                  const link = document.createElement('a');
                  link.href = previewUrl;
                  link.download = 'edited-image.jpg';
                  link.click();
                  
                  toast({
                    title: "Image exported",
                    description: "Your edited image has been downloaded.",
                  });
                }}
              >
                Export
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {!previewUrl ? (
          <UploadArea onFileUpload={handleFileUpload} />
        ) : (
          <RawEditor imageUrl={previewUrl} />
        )}
      </main>
    </div>
  );
};

export default Index;
