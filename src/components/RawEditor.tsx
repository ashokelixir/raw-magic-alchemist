
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { 
  SlidersHorizontal, 
  Palette, 
  Upload,
  FileImage
} from "lucide-react";

interface RawEditorProps {
  imageUrl: string;
}

interface AdjustmentValues {
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  clarity: number;
  vibrance: number;
  saturation: number;
  temperature: number;
  tint: number;
}

const RawEditor = ({ imageUrl }: RawEditorProps) => {
  const { toast } = useToast();
  const [showBefore, setShowBefore] = useState(false);
  const [lutFile, setLutFile] = useState<File | null>(null);
  const [lutApplied, setLutApplied] = useState(false);
  
  const [adjustments, setAdjustments] = useState<AdjustmentValues>({
    exposure: 0,
    contrast: 0,
    highlights: 0,
    shadows: 0,
    whites: 0,
    blacks: 0,
    clarity: 0,
    vibrance: 0,
    saturation: 0,
    temperature: 0,
    tint: 0
  });

  const handleSliderChange = (name: keyof AdjustmentValues, value: number[]) => {
    setAdjustments(prev => ({ ...prev, [name]: value[0] }));
  };

  const handleLutUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLutFile(e.target.files[0]);
      setLutApplied(true);
      
      toast({
        title: "LUT applied",
        description: `${e.target.files[0].name} has been applied to the image.`,
      });
    }
  };

  const getFilterStyle = () => {
    // This is a simplified simulation of adjustments
    // In a real app, we'd use WebGL or Canvas to apply actual adjustments
    
    return {
      filter: `
        brightness(${1 + adjustments.exposure / 100})
        contrast(${1 + adjustments.contrast / 100})
        saturate(${1 + adjustments.saturation / 100})
        sepia(${lutApplied ? 0.2 : 0})
      `,
      transition: 'filter 0.3s ease'
    };
  };

  const resetAdjustments = () => {
    setAdjustments({
      exposure: 0,
      contrast: 0,
      highlights: 0,
      shadows: 0,
      whites: 0,
      blacks: 0,
      clarity: 0,
      vibrance: 0,
      saturation: 0,
      temperature: 0,
      tint: 0
    });
    setLutFile(null);
    setLutApplied(false);
    
    toast({
      title: "Adjustments reset",
      description: "All adjustments have been reset to default values.",
    });
  };

  return (
    <div className="flex h-full">
      {/* Side Panel */}
      <div className="w-80 border-r border-editor-border overflow-y-auto">
        <div className="p-4">
          <Tabs defaultValue="basic">
            <TabsList className="w-full grid grid-cols-2 mb-4">
              <TabsTrigger value="basic" className="flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="color" className="flex items-center justify-center">
                <Palette className="w-4 h-4 mr-2" />
                Color
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-6">
              <div className="panel">
                <h3 className="text-sm font-medium text-white mb-4">Light</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center">
                      <Label className="slider-label">Exposure</Label>
                      <span className="slider-value">{adjustments.exposure}</span>
                    </div>
                    <Slider 
                      min={-100} 
                      max={100} 
                      step={1} 
                      value={[adjustments.exposure]} 
                      onValueChange={(value) => handleSliderChange('exposure', value)}
                      className="my-1.5"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center">
                      <Label className="slider-label">Contrast</Label>
                      <span className="slider-value">{adjustments.contrast}</span>
                    </div>
                    <Slider 
                      min={-100} 
                      max={100} 
                      step={1} 
                      value={[adjustments.contrast]} 
                      onValueChange={(value) => handleSliderChange('contrast', value)}
                      className="my-1.5"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center">
                      <Label className="slider-label">Highlights</Label>
                      <span className="slider-value">{adjustments.highlights}</span>
                    </div>
                    <Slider 
                      min={-100} 
                      max={100} 
                      step={1} 
                      value={[adjustments.highlights]} 
                      onValueChange={(value) => handleSliderChange('highlights', value)}
                      className="my-1.5"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center">
                      <Label className="slider-label">Shadows</Label>
                      <span className="slider-value">{adjustments.shadows}</span>
                    </div>
                    <Slider 
                      min={-100} 
                      max={100} 
                      step={1} 
                      value={[adjustments.shadows]} 
                      onValueChange={(value) => handleSliderChange('shadows', value)}
                      className="my-1.5"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center">
                      <Label className="slider-label">Whites</Label>
                      <span className="slider-value">{adjustments.whites}</span>
                    </div>
                    <Slider 
                      min={-100} 
                      max={100} 
                      step={1} 
                      value={[adjustments.whites]} 
                      onValueChange={(value) => handleSliderChange('whites', value)}
                      className="my-1.5"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center">
                      <Label className="slider-label">Blacks</Label>
                      <span className="slider-value">{adjustments.blacks}</span>
                    </div>
                    <Slider 
                      min={-100} 
                      max={100} 
                      step={1} 
                      value={[adjustments.blacks]} 
                      onValueChange={(value) => handleSliderChange('blacks', value)}
                      className="my-1.5"
                    />
                  </div>
                </div>
              </div>
              
              <div className="panel">
                <h3 className="text-sm font-medium text-white mb-4">Presence</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center">
                      <Label className="slider-label">Clarity</Label>
                      <span className="slider-value">{adjustments.clarity}</span>
                    </div>
                    <Slider 
                      min={-100} 
                      max={100} 
                      step={1} 
                      value={[adjustments.clarity]} 
                      onValueChange={(value) => handleSliderChange('clarity', value)}
                      className="my-1.5"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center">
                      <Label className="slider-label">Vibrance</Label>
                      <span className="slider-value">{adjustments.vibrance}</span>
                    </div>
                    <Slider 
                      min={-100} 
                      max={100} 
                      step={1} 
                      value={[adjustments.vibrance]} 
                      onValueChange={(value) => handleSliderChange('vibrance', value)}
                      className="my-1.5"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center">
                      <Label className="slider-label">Saturation</Label>
                      <span className="slider-value">{adjustments.saturation}</span>
                    </div>
                    <Slider 
                      min={-100} 
                      max={100} 
                      step={1} 
                      value={[adjustments.saturation]} 
                      onValueChange={(value) => handleSliderChange('saturation', value)}
                      className="my-1.5"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="color" className="space-y-6">
              <div className="panel">
                <h3 className="text-sm font-medium text-white mb-4">White Balance</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center">
                      <Label className="slider-label">Temperature</Label>
                      <span className="slider-value">{adjustments.temperature}</span>
                    </div>
                    <Slider 
                      min={-100} 
                      max={100} 
                      step={1} 
                      value={[adjustments.temperature]} 
                      onValueChange={(value) => handleSliderChange('temperature', value)}
                      className="my-1.5"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center">
                      <Label className="slider-label">Tint</Label>
                      <span className="slider-value">{adjustments.tint}</span>
                    </div>
                    <Slider 
                      min={-100} 
                      max={100} 
                      step={1} 
                      value={[adjustments.tint]} 
                      onValueChange={(value) => handleSliderChange('tint', value)}
                      className="my-1.5"
                    />
                  </div>
                </div>
              </div>
              
              <div className="panel">
                <h3 className="text-sm font-medium text-white mb-4">LUT</h3>
                <p className="text-xs text-gray-400 mb-4">
                  Upload a LUT (Look Up Table) file to apply color grading to your image.
                </p>
                
                <div className="flex items-center space-x-4">
                  <label className="px-3 py-2 bg-editor-panel hover:bg-editor-hover border border-editor-border rounded flex items-center space-x-2 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span className="text-xs">Upload LUT</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".cube,.3dl" 
                      onChange={handleLutUpload}
                    />
                  </label>
                  
                  {lutFile && (
                    <span className="text-xs text-gray-400 truncate max-w-[150px]">
                      {lutFile.name}
                    </span>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <button
            className="w-full mt-6 px-4 py-2 bg-editor-panel hover:bg-editor-hover border border-editor-border rounded text-sm"
            onClick={resetAdjustments}
          >
            Reset Adjustments
          </button>
        </div>
      </div>
      
      {/* Image Viewer */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex justify-between items-center p-2 border-b border-editor-border">
          <div className="flex items-center space-x-2">
            <FileImage className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Image Preview</span>
          </div>
          
          <button
            className="text-sm text-gray-400 hover:text-white px-3 py-1 rounded hover:bg-editor-hover"
            onMouseDown={() => setShowBefore(true)}
            onMouseUp={() => setShowBefore(false)}
            onMouseLeave={() => setShowBefore(false)}
          >
            Show Original
          </button>
        </div>
        
        <div className="flex-1 flex items-center justify-center overflow-auto p-8 bg-[#151820]">
          <div className="relative max-w-full max-h-full">
            <img 
              src={imageUrl} 
              alt="Preview" 
              className="max-w-full max-h-[calc(100vh-12rem)] object-contain"
              style={showBefore ? {} : getFilterStyle()}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RawEditor;
