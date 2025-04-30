// webglImageProcessor.ts
export interface AdjustmentValues {
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

  // Add new interface for transformations
export interface ImageTransformations {
    scale: number;
    rotation: number; // In degrees
    flipX: boolean;
    flipY: boolean;
  }
  
  // WebGL shader code
  const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  
  uniform float u_rotation; // In radians
  uniform float u_scale;
  uniform float u_flipX;
  uniform float u_flipY;
  
  varying vec2 v_texCoord;
  
  void main() {
    // Apply scale
    vec2 scaledPosition = a_position * u_scale;
    
    // Apply rotation
    float cosRotation = cos(u_rotation);
    float sinRotation = sin(u_rotation);
    mat2 rotationMatrix = mat2(cosRotation, sinRotation, -sinRotation, cosRotation);
    vec2 rotatedPosition = rotationMatrix * scaledPosition;
    
    // Set final position
    gl_Position = vec4(rotatedPosition, 0, 1);
    
    // Apply flips to texture coordinates
    vec2 texCoord = a_texCoord;
    texCoord.x = u_flipX > 0.5 ? 1.0 - texCoord.x : texCoord.x;
    texCoord.y = u_flipY > 0.5 ? 1.0 - texCoord.y : texCoord.y;
    
    v_texCoord = texCoord;
  }
`;
  
  const fragmentShaderSource = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform float u_exposure;
  uniform float u_contrast;
  uniform float u_highlights;
  uniform float u_shadows;
  uniform float u_whites;
  uniform float u_blacks;
  uniform float u_clarity;
  uniform float u_vibrance;
  uniform float u_saturation;
  uniform float u_temperature;
  uniform float u_tint;
  varying vec2 v_texCoord;
  
  // Helper functions
  vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
  }
  
  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }
  
  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    
    // Exposure adjustment
    color.rgb = color.rgb * pow(2.0, u_exposure / 100.0);
    
    // Contrast adjustment
    float contrastFactor = (1.0 + u_contrast / 100.0);
    color.rgb = (color.rgb - 0.5) * contrastFactor + 0.5;
    
    // Highlights and shadows adjustments
    float luminance = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
    float highlightsMask = smoothstep(0.5, 1.0, luminance);
    float shadowsMask = smoothstep(0.5, 0.0, luminance);
    
    // Apply highlights adjustment
    color.rgb = mix(color.rgb, color.rgb * (1.0 + u_highlights / 200.0), highlightsMask);
    
    // Apply shadows adjustment
    color.rgb = mix(color.rgb, color.rgb * (1.0 + u_shadows / 200.0), shadowsMask);
    
    // Whites and blacks adjustments
    float whitesMask = pow(luminance, 2.0);
    float blacksMask = pow(1.0 - luminance, 2.0);
    
    // Apply whites adjustment
    color.rgb = mix(color.rgb, color.rgb * (1.0 + u_whites / 200.0), whitesMask);
    
    // Apply blacks adjustment
    color.rgb = mix(color.rgb, color.rgb * (1.0 + u_blacks / 200.0), blacksMask);
    
    // Clarity (local contrast) - simplified implementation using blur without arrays
    // Modified for GLSL ES 1.0 compatibility
    float clarityAmount = u_clarity / 200.0;
    if (clarityAmount != 0.0) {
      float texelSize = 1.0 / 512.0; // Approximate - would be better with actual texture size
      vec3 blurColor = vec3(0.0);
      float weight = 1.0 / 9.0;
      
      // Manual 3x3 convolution without array initialization
      // Top row
      blurColor += texture2D(u_image, v_texCoord + vec2(-texelSize, -texelSize)).rgb * weight;
      blurColor += texture2D(u_image, v_texCoord + vec2(0.0, -texelSize)).rgb * weight;
      blurColor += texture2D(u_image, v_texCoord + vec2(texelSize, -texelSize)).rgb * weight;
      
      // Middle row
      blurColor += texture2D(u_image, v_texCoord + vec2(-texelSize, 0.0)).rgb * weight;
      blurColor += texture2D(u_image, v_texCoord).rgb * weight;
      blurColor += texture2D(u_image, v_texCoord + vec2(texelSize, 0.0)).rgb * weight;
      
      // Bottom row
      blurColor += texture2D(u_image, v_texCoord + vec2(-texelSize, texelSize)).rgb * weight;
      blurColor += texture2D(u_image, v_texCoord + vec2(0.0, texelSize)).rgb * weight;
      blurColor += texture2D(u_image, v_texCoord + vec2(texelSize, texelSize)).rgb * weight;
      
      color.rgb = mix(color.rgb, color.rgb + (color.rgb - blurColor) * clarityAmount, 0.5);
    }
    
    // Color adjustments - Vibrance and Saturation
    vec3 hsv = rgb2hsv(color.rgb);
    
    // Vibrance - increases saturation more on less saturated colors
    float satMask = 1.0 - hsv.y;
    hsv.y = hsv.y + (u_vibrance / 100.0) * satMask;
    
    // Saturation
    hsv.y = hsv.y * (1.0 + u_saturation / 100.0);
    
    // Temperature and tint in HSV approximation
    // Temperature (blue-yellow)
    float tempOffset = u_temperature / 100.0 * 0.05;
    if (tempOffset > 0.0) { // Warmer
      if (hsv.x >= 0.5 && hsv.x <= 0.75) {  // Blues
        hsv.y = max(0.0, hsv.y - tempOffset);
      } else if (hsv.x >= 0.08 && hsv.x <= 0.18) {  // Yellows
        hsv.y = min(1.0, hsv.y + tempOffset);
      }
    } else if (tempOffset < 0.0) { // Cooler
      if (hsv.x >= 0.5 && hsv.x <= 0.75) {  // Blues
        hsv.y = min(1.0, hsv.y - tempOffset);
      } else if (hsv.x >= 0.08 && hsv.x <= 0.18) {  // Yellows
        hsv.y = max(0.0, hsv.y + tempOffset);
      }
    }
    
    // Tint (green-magenta)
    float tintOffset = u_tint / 100.0 * 0.05;
    if (tintOffset > 0.0) { // More green
      if (hsv.x >= 0.25 && hsv.x <= 0.45) {  // Greens
        hsv.y = min(1.0, hsv.y + tintOffset);
      } else if (hsv.x >= 0.75 && hsv.x <= 0.95) {  // Magentas
        hsv.y = max(0.0, hsv.y - tintOffset);
      }
    } else if (tintOffset < 0.0) { // More magenta
      if (hsv.x >= 0.25 && hsv.x <= 0.45) {  // Greens
        hsv.y = max(0.0, hsv.y + tintOffset);
      } else if (hsv.x >= 0.75 && hsv.x <= 0.95) {  // Magentas
        hsv.y = min(1.0, hsv.y - tintOffset);
      }
    }
    
    // Convert back to RGB
    color.rgb = hsv2rgb(hsv);
    
    // Ensure we stay in valid range
    color.rgb = clamp(color.rgb, 0.0, 1.0);
    
    gl_FragColor = color;
  }
`;
  
  export interface WebGLContextWrapper {
    gl: WebGLRenderingContext;
    program: WebGLProgram;
    texture: WebGLTexture;
  }

  // Add this to the initWebGL function for better error reporting
function createShader(gl: WebGLRenderingContext, type: number, source: string) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation failed:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }
  
  // Initialize WebGL context and setup shaders
  export function initWebGL(canvas: HTMLCanvasElement): WebGLContextWrapper | null {
    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
    
    if (!gl) {
      console.error('WebGL not supported');
      return null;
    }
    
    // Create shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
if (!vertexShader) return null;
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error('Vertex shader compilation failed:', gl.getShaderInfoLog(vertexShader));
      return null;
    }

    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
if (!fragmentShader) return null;
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error('Fragment shader compilation failed:', gl.getShaderInfoLog(fragmentShader));
      return null;
    }
    
    // Create program
    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking failed:', gl.getProgramInfoLog(program));
      return null;
    }
    
    const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1.0, -1.0,
     1.0, -1.0,
    -1.0,  1.0,
    -1.0,  1.0,
     1.0, -1.0,
     1.0,  1.0
  ]), gl.STATIC_DRAW);
  
  // FIXED: Flip the Y coordinates to fix upside-down image
  const texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0.0, 1.0,  // Flipped Y coordinate
    1.0, 1.0,  // Flipped Y coordinate
    0.0, 0.0,  // Flipped Y coordinate
    0.0, 0.0,  // Flipped Y coordinate
    1.0, 1.0,  // Flipped Y coordinate
    1.0, 0.0   // Flipped Y coordinate
  ]), gl.STATIC_DRAW);
    
    // Create texture
    const texture = gl.createTexture();
    if (!texture) return null;
    
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    // Set initial empty texture
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, 
                 new Uint8Array([0, 0, 0, 255]));
    
    return {
      gl,
      program,
      texture
    };
  }
  
  // Update the loadImageTexture function to better handle canvas sizing
export function loadImageTexture(
    context: WebGLContextWrapper, 
    image: HTMLImageElement, 
    canvas: HTMLCanvasElement
  ): void {
    const { gl, texture } = context;
    
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    
    // Improved resize logic to fill the available space
    const container = canvas.parentElement;
    if (container) {
      // Get container dimensions
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      // Get image aspect ratio
      const imageAspect = image.width / image.height;
      
      // Calculate dimensions to fill the container while maintaining aspect ratio
      let width, height;
      
      // Try to match container width first
      width = containerWidth;
      height = width / imageAspect;
      
      // If height exceeds container, scale down to fit height
      if (height > containerHeight) {
        height = containerHeight;
        width = height * imageAspect;
      }
      
      // Apply dimensions to canvas
      canvas.width = width;
      canvas.height = height;
      
      // Update canvas styling to ensure it visually fills the space
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      
      // Update WebGL viewport
      gl.viewport(0, 0, width, height);
    }
  }
  
  // Render the image with current adjustments
 // Update the renderImage function to include transformations
 export function renderImage(
    context: WebGLContextWrapper,
    adjustments: AdjustmentValues,
    transformations: ImageTransformations,
    originalImage: HTMLImageElement | null,
    showOriginal: boolean = false
  ): void {
    const { gl, program, texture } = context;
    
    gl.useProgram(program);
    
    // Bind the position buffer
    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0
    ]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    // Bind the texture coordinates with fixed Y orientation
    const texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
    gl.enableVertexAttribArray(texCoordLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0.0, 1.0,
      1.0, 1.0,
      0.0, 0.0,
      0.0, 0.0,
      1.0, 1.0,
      1.0, 0.0
    ]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    
    // Set the image
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // Set transformation uniforms
    gl.uniform1f(gl.getUniformLocation(program, "u_rotation"), transformations.rotation * Math.PI / 180);
    gl.uniform1f(gl.getUniformLocation(program, "u_scale"), transformations.scale);
    gl.uniform1f(gl.getUniformLocation(program, "u_flipX"), transformations.flipX ? 1.0 : 0.0);
    gl.uniform1f(gl.getUniformLocation(program, "u_flipY"), transformations.flipY ? 1.0 : 0.0);
    
    // If showing original, skip adjustments but still apply transformations
    if (showOriginal && originalImage) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, originalImage);
    }
    
    // Set the uniforms for all adjustments
    gl.uniform1f(gl.getUniformLocation(program, "u_exposure"), adjustments.exposure);
    gl.uniform1f(gl.getUniformLocation(program, "u_contrast"), adjustments.contrast);
    gl.uniform1f(gl.getUniformLocation(program, "u_highlights"), adjustments.highlights);
    gl.uniform1f(gl.getUniformLocation(program, "u_shadows"), adjustments.shadows);
    gl.uniform1f(gl.getUniformLocation(program, "u_whites"), adjustments.whites);
    gl.uniform1f(gl.getUniformLocation(program, "u_blacks"), adjustments.blacks);
    gl.uniform1f(gl.getUniformLocation(program, "u_clarity"), adjustments.clarity);
    gl.uniform1f(gl.getUniformLocation(program, "u_vibrance"), adjustments.vibrance);
    gl.uniform1f(gl.getUniformLocation(program, "u_saturation"), adjustments.saturation);
    gl.uniform1f(gl.getUniformLocation(program, "u_temperature"), adjustments.temperature);
    gl.uniform1f(gl.getUniformLocation(program, "u_tint"), adjustments.tint);
    
    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  
  // Load image URL to prepare for processing
  export function loadImageFromUrl(
    url: string, 
    onLoad: (image: HTMLImageElement) => void, 
    onError: () => void
  ): void {
    const image = new Image();
    image.crossOrigin = "anonymous";
    
    image.onload = () => onLoad(image);
    image.onerror = onError;
    
    image.src = url;
  }