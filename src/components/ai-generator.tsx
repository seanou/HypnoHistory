"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Wand2,
  Sparkles,
  Download,
  Save,
  Copy,
  Edit,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { generateImageFromText } from "@/ai/flows/generate-image-from-text";
import { suggestImagePrompts } from "@/ai/flows/suggest-image-prompts";
import { generateImageVariations } from "@/ai/flows/generate-image-variations";

import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { toDataURL } from "@/lib/utils";
import type { GalleryImage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ImageControls } from "@/components/image-controls";

const promptSchema = z.object({
  prompt: z.string().min(10, {
    message: "Prompt must be at least 10 characters.",
  }),
});

const variationSchema = z.object({
  prompt: z.string().min(3, {
    message: "Variation prompt must be at least 3 characters.",
  }),
});

export function AiGenerator() {
  const { toast } = useToast();
  const [gallery, setGallery] = useLocalStorage<GalleryImage[]>(
    "visionary-gallery",
    []
  );
  const [generatedImage, setGeneratedImage] = useState<GalleryImage | null>(
    null
  );
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isVarying, setIsVarying] = useState(false);

  const form = useForm<z.infer<typeof promptSchema>>({
    resolver: zodResolver(promptSchema),
    defaultValues: { prompt: "" },
  });

  const variationForm = useForm<z.infer<typeof variationSchema>>({
    resolver: zodResolver(variationSchema),
    defaultValues: { prompt: "" },
  });

  async function onSubmit(values: z.infer<typeof promptSchema>) {
    setIsGenerating(true);
    setGeneratedImage(null);
    try {
      const result = await generateImageFromText({ prompt: values.prompt });
      setGeneratedImage({
        id: new Date().toISOString(),
        url: result.imageUrl,
        prompt: values.prompt,
        createdAt: new Date().toISOString(),
      });
      form.setValue("prompt", values.prompt); // keep prompt for suggestions
    } catch (error) {
      console.error(error);
      toast({
        title: "Generation Failed",
        description: "Could not generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleGetSuggestions() {
    const prompt = form.getValues("prompt");
    if (!prompt) {
      toast({
        title: "No prompt provided",
        description: "Please enter a prompt to get suggestions.",
        variant: "destructive",
      });
      return;
    }
    setIsSuggesting(true);
    try {
      const result = await suggestImagePrompts({ lastSearchKeywords: prompt });
      setSuggestions(result.suggestedPrompts);
    } catch (error) {
      console.error(error);
      toast({
        title: "Suggestion Failed",
        description: "Could not get suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSuggesting(false);
    }
  }

  async function handleGenerateVariation(values: z.infer<typeof variationSchema>) {
    if (!generatedImage) return;
    setIsVarying(true);
    try {
      const dataUrl = await toDataURL(generatedImage.url);
      const result = await generateImageVariations({
        baseImage: dataUrl,
        prompt: values.prompt,
      });
      setGeneratedImage({
        id: new Date().toISOString(),
        url: result.variedImage,
        prompt: `${generatedImage.prompt} (variation: ${values.prompt})`,
        createdAt: new Date().toISOString(),
      });
      variationForm.reset();
      document.getElementById("variation-close")?.click();
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

  function handleSaveToGallery() {
    if (!generatedImage) return;
    if (gallery.some((img) => img.id === generatedImage.id)) {
      toast({
        title: "Already Saved",
        description: "This image is already in your gallery.",
      });
      return;
    }
    setGallery([...gallery, generatedImage]);
    toast({
      title: "Image Saved!",
      description: "The image has been added to your gallery.",
    });
  }

  function handleDownload() {
    if (!generatedImage) return;
    const link = document.createElement("a");
    link.href = generatedImage.url;
    link.setAttribute("download", `visionaryai-${Date.now()}.png`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 pt-4">
        <Card className="lg:col-span-3">
          <CardContent className="pt-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <Textarea
                        placeholder="Describe the image you want to create. For example, 'A cute cat astronaut floating in space, cartoon style'"
                        className="min-h-32 text-base"
                        {...field}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  Generate
                </Button>
              </form>
            </Form>

            <div className="mt-6">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGetSuggestions}
                disabled={isSuggesting}
              >
                {isSuggesting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Inspire Me
              </Button>
              {suggestions.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Prompt Suggestions:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => form.setValue("prompt", s)}
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-4">
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[400px] h-full">
            {isGenerating ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                <Skeleton className="h-[80%] w-[80%] rounded-xl" />
                <p className="text-muted-foreground animate-pulse">
                  Conjuring your vision...
                </p>
              </div>
            ) : generatedImage ? (
              <div className="w-full flex flex-col gap-4 items-center">
                <div className="relative w-full max-w-md aspect-square rounded-lg overflow-hidden border shadow-lg">
                  <Image
                    src={generatedImage.url}
                    alt={generatedImage.prompt}
                    fill
                    className="object-cover"
                    data-ai-hint="generated image"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                  >
                    <Download className="mr-2 h-4 w-4" /> Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveToGallery}
                  >
                    <Save className="mr-2 h-4 w-4" /> Save
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Copy className="mr-2 h-4 w-4" /> Variations
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Create Variations</DialogTitle>
                      </DialogHeader>
                      <Form {...variationForm}>
                        <form
                          onSubmit={variationForm.handleSubmit(
                            handleGenerateVariation
                          )}
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
                              {isVarying && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Generate Variation
                            </Button>
                            <DialogClose id="variation-close" asChild>
                               <Button variant="ghost">Cancel</Button>
                            </DialogClose>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Edit Image</DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                         <ImageControls imageUrl={generatedImage.url} />
                      </div>
                    </DialogContent>
                  </Dialog>

                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground flex flex-col items-center gap-4">
                <ImageIcon className="size-16" />
                <p>Your generated image will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
