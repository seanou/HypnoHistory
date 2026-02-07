"use client";

import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import type { GalleryImage } from "@/lib/types";
import { Save, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";

const CANVAS_SIZE = 512;
const PIXEL_GRID_SIZE = 32;
const PIXEL_SIZE = CANVAS_SIZE / PIXEL_GRID_SIZE;

const colors = [
  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF",
  "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080", 
  "#C0C0C0", "#808080"
];

const createEmptyGrid = () => Array.from({ length: PIXEL_GRID_SIZE }, () => Array(PIXEL_GRID_SIZE).fill("#FFFFFF"));

export function PixelEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [pixelGrid, setPixelGrid] = useState<string[][]>(createEmptyGrid());
  const [gallery, setGallery] = useLocalStorage<GalleryImage[]>("visionary-gallery", []);
  const { toast } = useToast();

  const drawCanvas = (grid: string[][]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext("2d");
      if (!context) return;
      
      context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      grid.forEach((row, y) => {
          row.forEach((color, x) => {
              context.fillStyle = color;
              context.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
          });
      });

      // Draw grid lines
      context.strokeStyle = "#E5E7EB"; // tailwind gray-200
      context.lineWidth = 0.5;
      context.beginPath();
      for (let i = 0; i <= PIXEL_GRID_SIZE; i++) {
        context.moveTo(i * PIXEL_SIZE, 0);
        context.lineTo(i * PIXEL_SIZE, CANVAS_SIZE);
      }
      for (let i = 0; i <= PIXEL_GRID_SIZE; i++) {
        context.moveTo(0, i * PIXEL_SIZE);
        context.lineTo(CANVAS_SIZE, i * PIXEL_SIZE);
      }
      context.stroke();
  }

  useEffect(() => {
    drawCanvas(pixelGrid);
  }, [pixelGrid]);


  const updatePixel = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const gridX = Math.floor(x / PIXEL_SIZE);
    const gridY = Math.floor(y / PIXEL_SIZE);
    
    if (gridX < 0 || gridX >= PIXEL_GRID_SIZE || gridY < 0 || gridY >= PIXEL_GRID_SIZE) return;

    if (pixelGrid[gridY][gridX] !== selectedColor) {
        const newGrid = pixelGrid.map(row => [...row]);
        newGrid[gridY][gridX] = selectedColor;
        setPixelGrid(newGrid);
    }
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    updatePixel(event);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawing) {
      updatePixel(event);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };
  
  const handleMouseLeave = () => {
    setIsDrawing(false);
  };

  const handleSave = () => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = PIXEL_GRID_SIZE;
    tempCanvas.height = PIXEL_GRID_SIZE;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    pixelGrid.forEach((row, y) => {
        row.forEach((color, x) => {
            tempCtx.fillStyle = color;
            tempCtx.fillRect(x, y, 1, 1);
        });
    });

    const newImage: GalleryImage = {
      id: new Date().toISOString(),
      url: tempCanvas.toDataURL("image/png"),
      prompt: "Pixel Art",
      createdAt: new Date().toISOString(),
    };
    setGallery([newImage, ...gallery]);
    toast({
      title: "Image Saved!",
      description: "The pixel art has been added to your gallery.",
    });
  };

  const handleClear = () => {
    setPixelGrid(createEmptyGrid());
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 pt-4">
      <div className="lg:col-span-5 flex justify-center items-start">
        <Card className="max-w-max">
          <CardContent className="p-2 bg-card">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="cursor-crosshair rounded-md"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            />
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Color Palette</Label>
              <div className="grid grid-cols-5 gap-2 pt-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    style={{ backgroundColor: color }}
                    className={`w-10 h-10 rounded-full border-2 transition-transform transform hover:scale-110 ${selectedColor === color ? 'border-primary ring-2 ring-primary' : 'border-card'}`}
                    onClick={() => setSelectedColor(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-col space-y-2">
            <Button onClick={handleSave} size="lg">
              <Save className="mr-2" />
              Save to Gallery
            </Button>
            <Button onClick={handleClear} variant="outline" size="lg">
              <Trash2 className="mr-2" />
              Clear Canvas
            </Button>
        </div>
      </div>
    </div>
  );
}
