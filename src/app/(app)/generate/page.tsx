"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AiGenerator } from "@/components/ai-generator";
import { PixelEditor } from "@/components/pixel-editor";
import { Wand2, Brush } from "lucide-react";

export default function GeneratePage() {
    return (
        <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="mx-auto grid w-full max-w-6xl flex-1 auto-rows-max gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0 md:text-3xl font-headline">
                        Creation Studio
                    </h1>
                </div>

                <Tabs defaultValue="pixel-editor" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="ai-generator">
                            <Wand2 className="mr-2 h-4 w-4" />
                            AI Generator
                        </TabsTrigger>
                        <TabsTrigger value="pixel-editor">
                            <Brush className="mr-2 h-4 w-4" />
                            Pixel Editor
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="ai-generator">
                        <AiGenerator />
                    </TabsContent>
                    <TabsContent value="pixel-editor">
                        <PixelEditor />
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    );
}
