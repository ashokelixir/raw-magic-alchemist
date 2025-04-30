
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
    // In a real app, we'd process the ARM file here
    // For demo purposes, we're just using a regular image file
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file. ARM processing is simulated in this demo.",
        variant: "destructive",
      });
      return;
    }

    setImageData(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    toast({
      title: "File uploaded",
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
