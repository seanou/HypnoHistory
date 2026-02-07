'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [screen, setScreen] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setScreen(2);
    }, 20000);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <Card className="w-full max-w-lg p-8 text-center">
        {isLoading ? (
          <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
        ) : (
          <>
            {screen === 1 && (
              <button onClick={handleStart} className="text-3xl font-bold">
                Clique ici. Ça dure 20 secondes.
              </button>
            )}
            {screen === 2 && (
              <div>
                <h2 className="text-3xl font-bold mb-8">Choisis.</h2>
                <div className="flex justify-center gap-4">
                  <Button size="lg" onClick={() => setScreen(3)}>Bouton A</Button>
                  <Button size="lg" onClick={() => setScreen(3)}>Bouton B</Button>
                </div>
              </div>
            )}
            {screen === 3 && (
              <div className="space-y-6">
                <p className="text-3xl font-bold">Ok.</p>
                <p className="text-3xl font-bold">Voilà ce que font 80 % des gens.</p>
                <Button size="lg" onClick={() => setScreen(4)}>Continuer</Button>
              </div>
            )}
            {screen === 4 && (
              <div className="space-y-4">
                <p className="text-3xl font-bold">Tu peux fermer l’appli.</p>
                <p className="text-3xl font-bold">Merci.</p>
              </div>
            )}
          </>
        )}
      </Card>
    </main>
  );
}
