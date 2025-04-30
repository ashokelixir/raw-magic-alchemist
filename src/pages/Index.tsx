
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
    // Check if the file has an ARW extension
    if (!file.name.toLowerCase().endsWith('.arw')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an ARW file only.",
        variant: "destructive",
      });
      return;
    }

    setImageData(file);
    
    // Since browsers can't directly display ARW files, we'll use a placeholder image
    // In a real app, we'd convert ARW to a displayable format first
    // For demo purposes, we're using a placeholder or file object URL
    const url = URL.createObjectURL(file);
    
    // Create a canvas to show a placeholder preview (as browsers can't render RAW directly)
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
      setPreviewUrl(url);
    }
    
    toast({
      title: "ARW file uploaded",
      description: "Your RAW image has been loaded successfully.",
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
