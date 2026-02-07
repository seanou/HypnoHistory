"use client";

import { useState } from 'react';
import Image from 'next/image';
import { RotateCw, ZoomIn, Scissors } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface ImageControlsProps {
  imageUrl: string;
}

export function ImageControls({ imageUrl }: ImageControlsProps) {
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 flex items-center justify-center bg-muted/30 rounded-lg overflow-hidden p-4 min-h-[300px]">
        <Image
          src={imageUrl}
          alt="Image to edit"
          width={400}
          height={400}
          className="object-contain rounded-md transition-transform duration-300"
          style={{
            transform: `rotate(${rotation}deg) scale(${zoom})`,
          }}
        />
      </div>
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label htmlFor="rotation" className="flex items-center gap-2 mb-2">
                <RotateCw className="size-4" />
                <span>Rotate</span>
              </Label>
              <Slider
                id="rotation"
                min={-180}
                max={180}
                step={1}
                value={[rotation]}
                onValueChange={(value) => setRotation(value[0])}
              />
            </div>
            <div>
              <Label htmlFor="zoom" className="flex items-center gap-2 mb-2">
                <ZoomIn className="size-4" />
                <span>Zoom</span>
              </Label>
              <Slider
                id="zoom"
                min={0.5}
                max={3}
                step={0.1}
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
              />
            </div>
             <div>
              <Label htmlFor="crop" className="flex items-center gap-2 mb-2">
                <Scissors className="size-4" />
                <span>Crop</span>
              </Label>
              <Button variant="outline" className="w-full">
                Select Crop Area
              </Button>
               <p className="text-xs text-muted-foreground mt-2">Cropping functionality is illustrative.</p>
            </div>
          </CardContent>
        </Card>
        <Button className="w-full" size="lg">Apply Changes</Button>
      </div>
    </div>
  );
}
