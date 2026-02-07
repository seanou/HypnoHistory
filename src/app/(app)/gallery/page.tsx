"use client";

import { useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import {
  Download,
  Trash2,
  Copy,
  Expand,
  Search,
  Loader2
} from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { GalleryImage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { generateImageVariations } from "@/ai/flows/generate-image-variations";
import { toDataURL } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";


const variationSchema = z.object({
  prompt: z.string().min(3, {
    message: "Variation prompt must be at least 3 characters.",
  }),
});

export default function GalleryPage() {
  const { toast } = useToast();
  const [gallery, setGallery] = useLocalStorage<GalleryImage[]>("visionary-gallery", []);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isVarying, setIsVarying] = useState(false);
  
  const variationForm = useForm<z.infer<typeof variationSchema>>({
    resolver: zodResolver(variationSchema),
    defaultValues: { prompt: "" },
  });

  const filteredGallery = gallery
    .filter((image) =>
      image.prompt.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function handleDelete(id: string) {
    setGallery(gallery.filter((img) => img.id !== id));
    toast({ title: "Image Deleted", description: "The image has been removed from your gallery." });
    setSelectedImage(null);
  }

  function handleDownload(image: GalleryImage) {
    const link = document.createElement("a");
    link.href = image.url;
    link.setAttribute("download", `visionaryai-${new Date(image.createdAt).getTime()}.png`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function handleGenerateVariation(values: z.infer<typeof variationSchema>) {
    if (!selectedImage) return;
    setIsVarying(true);
    try {
      const dataUrl = await toDataURL(selectedImage.url);
      const result = await generateImageVariations({
        baseImage: dataUrl,
        prompt: values.prompt,
      });
      const newImage: GalleryImage = {
        id: new Date().toISOString(),
        url: result.variedImage,
        prompt: `${selectedImage.prompt} (variation: ${values.prompt})`,
        createdAt: new Date().toISOString(),
      };
      setGallery([newImage, ...gallery]);
      setSelectedImage(newImage);
      variationForm.reset();
      document.getElementById("variation-gallery-close")?.click();
      toast({ title: "Variation created and saved to gallery." });
    } catch (error) {
      console.error(error);
      toast({
        title: "Variation Failed",
        description: "Could not generate variation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVarying(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="mx-auto grid w-full max-w-6xl flex-1 auto-rows-max gap-4">
        <div className="flex items-center gap-4">
          <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0 md:text-3xl font-headline">
            My Gallery
          </h1>
          <div className="relative ml-auto flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by prompt..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredGallery.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredGallery.map((image) => (
              <Card
                key={image.id}
                className="group relative overflow-hidden rounded-lg shadow-md transition-shadow hover:shadow-xl"
              >
                <Image
                  src={image.url}
                  alt={image.prompt}
                  width={300}
                  height={300}
                  className="object-cover w-full h-full aspect-square transition-transform duration-300 group-hover:scale-105"
                  data-ai-hint="gallery image"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white hover:bg-white/20 hover:text-white"
                    onClick={() => setSelectedImage(image)}
                  >
                    <Expand className="h-6 w-6" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-12">
            <div className="flex flex-col items-center gap-2 text-center">
              <h3 className="text-2xl font-bold tracking-tight">
                Your gallery is empty
              </h3>
              <p className="text-sm text-muted-foreground">
                Start creating images to see them here.
              </p>
              <Button className="mt-4" asChild>
                <a href="/generate">Generate Image</a>
              </Button>
            </div>
          </div>
        )}
      </div>

      {selectedImage && (
        <Dialog
          open={!!selectedImage}
          onOpenChange={(open) => !open && setSelectedImage(null)}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Image Details</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 md:grid-cols-2">
              <div className="flex items-center justify-center">
                <Image
                  src={selectedImage.url}
                  alt={selectedImage.prompt}
                  width={500}
                  height={500}
                  className="rounded-lg object-contain max-h-[70vh]"
                />
              </div>
              <div className="flex flex-col gap-4">
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <p className="text-sm font-semibold">Prompt:</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedImage.prompt}
                    </p>
                  </CardContent>
                </Card>
                <p className="text-xs text-muted-foreground">
                  Created {formatDistanceToNow(new Date(selectedImage.createdAt), { addSuffix: true })}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => handleDownload(selectedImage)}>
                    <Download className="mr-2 h-4 w-4" /> Download
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Copy className="mr-2 h-4 w-4" /> Variations
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Create Variations</DialogTitle>
                      </DialogHeader>
                      <Form {...variationForm}>
                        <form
                          onSubmit={variationForm.handleSubmit(handleGenerateVariation)}
                          className="space-y-4 py-4"
                        >
                          <FormField
                            control={variationForm.control}
                            name="prompt"
                            render={({ field }) => (
                              <FormItem>
                                <Input
                                  placeholder="e.g., 'wearing a hat', 'in a different color'"
                                  {...field}
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                            <Button type="submit" disabled={isVarying}>
                              {isVarying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Generate Variation
                            </Button>
                             <DialogClose id="variation-gallery-close" asChild>
                                <Button variant="ghost">Cancel</Button>
                            </DialogClose>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                  
                  <Button variant="destructive" onClick={() => handleDelete(selectedImage.id)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedImage(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}
