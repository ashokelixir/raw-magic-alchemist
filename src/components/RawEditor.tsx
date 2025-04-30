// RawEditor.tsx
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  SlidersHorizontal, 
  Palette, 
  Upload,
  FileImage,
  Image,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  ZoomIn,
  ZoomOut,
  RefreshCw
} from "lucide-react";

// Import WebGL utilities with updated transformations
import { 
  AdjustmentValues,
  ImageTransformations,
  WebGLContextWrapper,
  initWebGL,
  loadImageTexture,
  renderImage,
  loadImageFromUrl  
} from "@/lib/webgl-utils";

interface RawEditorProps {
  imageUrl: string;
}

const RawEditor = ({ imageUrl }: RawEditorProps) => {
  const { toast } = useToast();
  const [showBefore, setShowBefore] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const [lutFile, setLutFile] = useState<File | null>(null);
  const [lutApplied, setLutApplied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // WebGL references
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<WebGLContextWrapper | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

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

  // Add transformation state
  const [transformations, setTransformations] = useState<ImageTransformations>({
    scale: 1.0,
    rotation: 0,
    flipX: false,
    flipY: false
  });

  // Add transformation handlers
  const rotateRight = () => {
    setTransformations(prev => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360
    }));
  };

  const rotateLeft = () => {
    setTransformations(prev => ({
      ...prev,
      rotation: (prev.rotation - 90) % 360
    }));
  };

  const flipHorizontal = () => {
    setTransformations(prev => ({
      ...prev,
      flipX: !prev.flipX
    }));
  };

  const flipVertical = () => {
    setTransformations(prev => ({
      ...prev,
      flipY: !prev.flipY
    }));
  };

  const zoomIn = () => {
    setTransformations(prev => ({
      ...prev,
      scale: Math.min(prev.scale + 0.1, 3.0) // Limit max zoom
    }));
  };

  const zoomOut = () => {
    setTransformations(prev => ({
      ...prev,
      scale: Math.max(prev.scale - 0.1, 0.5) // Limit min zoom
    }));
  };

  const resetTransformations = () => {
    setTransformations({
      scale: 1.0,
      rotation: 0,
      flipX: false,
      flipY: false
    });
    
    toast({
      title: "Transformations reset",
      description: "Image position and orientation have been reset.",
    });
  };

  // Handle adjustment changes
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

  // Initialize WebGL on component mount
  useEffect(() => {
    if (canvasRef.current) {
      const context = initWebGL(canvasRef.current);
      if (context) {
        contextRef.current = context;
      } else {
        setImageError(true);
      }
    }

    // Cleanup on unmount
    return () => {
      const context = contextRef.current;
      if (context) {
        const { gl, texture } = context;
        gl.deleteTexture(texture);
      }
    };
  }, []);

  // Load image when URL changes
  useEffect(() => {
    if (imageUrl && contextRef.current && canvasRef.current) {
      loadImageFromUrl(
        imageUrl,
        (image) => {
          originalImageRef.current = image;
          if (contextRef.current && canvasRef.current) {
            loadImageTexture(contextRef.current, image, canvasRef.current);
            renderImage(contextRef.current, adjustments, transformations, image, showBefore);
            setImageLoaded(true);
            setImageError(false);
          }
        },
        () => {
          setImageLoaded(false);
          setImageError(true);
          console.error("Failed to load image");
        }
      );
    }
  }, [imageUrl, adjustments, transformations, showBefore]);

  // Re-render when transformations or adjustments change
  useEffect(() => {
    if (contextRef.current && originalImageRef.current) {
      renderImage(contextRef.current, adjustments, transformations, originalImageRef.current, showBefore);
    }
  }, [adjustments, transformations, showBefore]);

  // Handle container resizing with ResizeObserver
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Create ResizeObserver to handle container size changes
    const resizeObserver = new ResizeObserver(() => {
      if (originalImageRef.current && contextRef.current && canvasRef.current) {
        loadImageTexture(contextRef.current, originalImageRef.current, canvasRef.current);
        renderImage(contextRef.current, adjustments, transformations, originalImageRef.current, showBefore);
      }
    });
    
    // Find the container element
    const container = canvasRef.current.parentElement;
    if (container) {
      resizeObserver.observe(container);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [adjustments, transformations, showBefore]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (originalImageRef.current && contextRef.current && canvasRef.current) {
        loadImageTexture(contextRef.current, originalImageRef.current, canvasRef.current);
        renderImage(contextRef.current, adjustments, transformations, originalImageRef.current, showBefore);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [adjustments, transformations, showBefore]);

  return (
    <div className="flex h-full">
      {/* Side Panel */}
      {showPanel && (
      <div className="w-80 border-r border-editor-border overflow-y-auto">
        <div className="p-4">
          <Tabs defaultValue="basic">
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="basic" className="flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="color" className="flex items-center justify-center">
                <Palette className="w-4 h-4 mr-2" />
                Color
              </TabsTrigger>
              <TabsTrigger value="transform" className="flex items-center justify-center">
                <RotateCw className="w-4 h-4 mr-2" />
                Transform
              </TabsTrigger>
            </TabsList>
            
            {/* Keep your existing TabsContent for "basic" and "color" */}
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
            
            {/* Add new TabsContent for transformations */}
            <TabsContent value="transform" className="space-y-6">
              <div className="panel">
                <h3 className="text-sm font-medium text-white mb-4">Image Transformations</h3>
                
                <div className="space-y-6">
                  {/* Rotation controls */}
                  <div>
                    <Label className="block mb-2">Rotation</Label>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 flex items-center justify-center" 
                        onClick={rotateLeft}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        <span>Left</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 flex items-center justify-center" 
                        onClick={rotateRight}
                      >
                        <RotateCw className="w-4 h-4 mr-2" />
                        <span>Right</span>
                      </Button>
                    </div>
                    <div className="mt-2 text-xs text-center text-gray-400">
                      Current: {transformations.rotation}°
                    </div>
                  </div>
                  
                  {/* Flip controls */}
                  <div>
                    <Label className="block mb-2">Flip</Label>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        className={`flex-1 flex items-center justify-center ${transformations.flipX ? 'bg-blue-900' : ''}`}
                        onClick={flipHorizontal}
                      >
                        <FlipHorizontal className="w-4 h-4 mr-2" />
                        <span>Horizontal</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className={`flex-1 flex items-center justify-center ${transformations.flipY ? 'bg-blue-900' : ''}`}
                        onClick={flipVertical}
                      >
                        <FlipVertical className="w-4 h-4 mr-2" />
                        <span>Vertical</span>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Zoom controls */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>Scale</Label>
                      <span className="text-sm text-gray-400">{(transformations.scale * 100).toFixed(0)}%</span>
                    </div>
                    <Slider 
                      min={50} 
                      max={300} 
                      step={5} 
                      value={[transformations.scale * 100]} 
                      onValueChange={(value) => 
                        setTransformations(prev => ({ ...prev, scale: value[0] / 100 }))}
                      className="my-1.5"
                    />
                    <div className="flex space-x-2 mt-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 flex items-center justify-center" 
                        onClick={zoomOut}
                      >
                        <ZoomOut className="w-4 h-4 mr-2" />
                        <span>Zoom Out</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 flex items-center justify-center" 
                        onClick={zoomIn}
                      >
                        <ZoomIn className="w-4 h-4 mr-2" />
                        <span>Zoom In</span>
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  className="w-full mt-6 flex items-center justify-center"
                  onClick={resetTransformations}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  <span>Reset Transformations</span>
                </Button>
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
      )}
     {/* Image Viewer */}
     <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-2 border-b border-editor-border bg-background">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPanel(!showPanel)}
              className="p-1 hover:bg-editor-hover rounded"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
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

        {/* Image Container */}
        <div className="flex-1 relative bg-[#151820] overflow-hidden">
          {imageError ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-editor-border rounded-lg">
                <Image className="w-12 h-12 text-gray-500 mb-3" />
                <p className="text-gray-400 text-center">
                  Unable to preview RAW file directly.
                  <br />
                  <span className="text-sm">
                    In a production app, RAW files would be processed on the server.
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center w-full h-full">
              <div className="relative w-full h-full">
                <canvas
                  ref={canvasRef}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RawEditor;