'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Anchor, HelpCircle, X, Star } from 'lucide-react';

export default function Home() {
  const [screen, setScreen] = useState('home');
  const [currentTheme, setCurrentTheme] = useState<any>(null);
  const [originalTheme, setOriginalTheme] = useState<any>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [anchoringCompleted, setAnchoringCompleted] = useState(false);
  const [isAnchoringSession, setIsAnchoringSession] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isHypnosisCheckOpen, setIsHypnosisCheckOpen] = useState(false);

  // Effect for PWA and checking local storage
  useEffect(() => {
    // Check if running in standalone mode (installed PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    const handleBeforeInstallPrompt = (e: Event) => {
        if (isStandalone) return;
        e.preventDefault();
        setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(
            (registration) => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            },
            (err) => {
                console.log('ServiceWorker registration failed: ', err);
            }
        );
    }
    
    // Check if anchoring is completed from local storage
    try {
      if (typeof window !== 'undefined') {
        const anchoringDone = localStorage.getItem('hypnohistory_anchoring_done') === 'true';
        setAnchoringCompleted(anchoringDone);
      }
    } catch (error) {
      console.error('Could not access local storage:', error);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Effect for the hypnosis session (audio or timer)
  useEffect(() => {
    const audio = audioRef.current;
    let progressInterval: NodeJS.Timeout | undefined;

    const onAudioEnd = () => {
      setProgress(100);
      setTimeout(() => {
        if (isAnchoringSession) {
          setIsHypnosisCheckOpen(true);
        } else {
          showScreen('result');
          setProgress(0);
        }
      }, 500);
    };

    const updateAudioProgress = () => {
      if (audio && audio.duration) {
        const currentProgress = (audio.currentTime / audio.duration) * 100;
        setProgress(currentProgress);
      }
    };
    
    if (screen === 'hypnosis') {
        if (!audio) return;
        audio.addEventListener('ended', onAudioEnd);
        audio.addEventListener('timeupdate', updateAudioProgress);
        audio.play().catch(e => console.error("Error playing audio:", e));
    }

    return () => {
      if (audio) {
        audio.removeEventListener('ended', onAudioEnd);
        audio.removeEventListener('timeupdate', updateAudioProgress);
        if (!audio.paused) {
          audio.pause();
          audio.currentTime = 0;
        }
      }
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [screen, isAnchoringSession, currentTheme, originalTheme]);

  const themes = {
      fable_corbeau: { name: 'Le Corbeau et le Renard', emoji: '🦅', receptivity: 2, knowledge: [ { title: 'Auteur', content: 'Jean de La Fontaine (1621-1695). Fabuliste français reconnu mondialement pour ses Fables.' }, { title: 'La morale', content: "'Tout flatteur vit aux dépens de celui qui l'écoute.' Ne vous laissez pas manipuler par des compliments intéressés." }, { title: 'Les personnages', content: 'Le Corbeau: naïf et orgueilleux. Le Renard: rusé et calculateur. Représentent les vices et défauts humains.' }, { title: 'Style', content: 'Écrite en vers octosyllabiques. Dialogue vivant et naturel. Ton ironique et bienveillant.' }, { title: 'Enseignement', content: "Critique de la vanité et de la sottise. Valorise la prudence et l'intelligence. Les fables enseignent par l'exemple." } ] },
      anchoring: { name: 'Séance d\'ancrage hypnotique', emoji: '⚓', audioUrl: 'https://digipad.s3.sbg.io.cloud.ovh.net/1619015/28aafa76b0a6cd368b3c555597e2e888_1_2wspx8y0mha.mp3', knowledge: [ { title: 'Ancrage établi', content: "Vous avez complété avec succès votre séance d'ancrage initial. Cet ancrage reste actif et reconnaissable par votre inconscient." }, { title: 'Accès débloqué', content: "Vous avez maintenant accès à tous les contenus d'apprentissage hypnotique de HypnoHistory." }, { title: 'État hypnotique', content: "Vous avez exploré la profondeur de votre état hypnotique. Vous savez maintenant à quoi vous attendre lors des séances suivantes." }, { title: 'Réceptivité', content: "Votre esprit est maintenant réceptif à l'apprentissage hypnotique. Les informations s'intégreront naturellement à votre mémoire." }, { title: 'Début du voyage', content: "C'était votre première étape. Des dizaines de sujets passionnants vous attendent. Continuez votre exploration !" } ] }
  };

  const showScreen = (screenName: string) => {
    if (screenName === 'theme') {
      setCurrentStep(1);
    }
    setScreen(screenName);
  };
  
  const handleStartClick = () => {
    if (deferredPrompt) {
      setIsInstallModalOpen(true);
    } else {
      showScreen('theme');
    }
  };
  
  const handleInstallApp = async () => {
    setIsInstallModalOpen(false);
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch (error) {
      console.error('PWA installation prompt error:', error);
    }
    showScreen('theme');
  };

  const handleDismissInstall = () => {
    setIsInstallModalOpen(false);
    showScreen('theme');
  };

  const selectTheme = (themeId: keyof typeof themes) => {
    const selected = themes[themeId];
    setCurrentTheme(selected);
    setOriginalTheme(selected); // Keep track of what the user chose
    setCurrentStep(1);
    showScreen('questionnaire');
  };
  
  const startAnchoringOrSession = () => {
    if (!anchoringCompleted) {
      setIsAnchoringSession(true);
      setCurrentTheme(themes.anchoring);
      if (audioRef.current) {
        audioRef.current.src = themes.anchoring.audioUrl;
        audioRef.current.load();
      }
    } else {
        setIsAnchoringSession(false);
        setCurrentTheme(originalTheme);
         if (audioRef.current && originalTheme?.audioUrl) {
            audioRef.current.src = originalTheme.audioUrl;
            audioRef.current.load();
        } else if (audioRef.current) {
            audioRef.current.removeAttribute('src');
        }
    }
    showScreen('hypnosis');
  };

  const startManualAnchoring = () => {
    setIsAnchoringSession(true);
    setCurrentTheme(themes.anchoring);
    setOriginalTheme(null);
    if (audioRef.current) {
        audioRef.current.src = themes.anchoring.audioUrl;
        audioRef.current.load();
    }
    showScreen('hypnosis');
  };

  const handleHypnosisCheckYes = () => {
    setAnchoringCompleted(true);
    try {
        localStorage.setItem('hypnohistory_anchoring_done', 'true');
    } catch (error) {
        console.error('Could not write to local storage:', error);
    }
    setIsHypnosisCheckOpen(false);
    setIsAnchoringSession(false);
    
    if (originalTheme && originalTheme.name !== themes.anchoring.name) {
        // User was trying to access content, let them proceed
        setCurrentTheme(originalTheme);
        setProgress(0);
        showScreen('hypnosis');
    } else {
        // User did a manual anchoring session
        showScreen('theme');
    }
  };

  const handleHypnosisCheckNo = () => {
    setIsHypnosisCheckOpen(false);
    setIsAnchoringSession(false);
    alert("Ce n'est pas grave. L'hypnose est un état naturel et la relaxation viendra avec la pratique. N'hésitez pas à refaire la séance d'ancrage lorsque vous serez dans un environnement calme pour profiter pleinement de l'expérience.");
    showScreen('home');
  };


  return (
    <>
      <audio ref={audioRef} preload="auto" />
      
      <div className="fixed top-4 right-4 z-50 flex gap-3">
        <button onClick={startManualAnchoring} title="Refaire la séance d'ancrage" className="p-3 rounded-full bg-purple-500/20 text-purple-200 hover:bg-purple-500/40 transition-colors">
            <Anchor className="w-6 h-6" />
        </button>
        <button onClick={() => setIsFaqOpen(true)} title="F.A.Q." className="p-3 rounded-full bg-purple-500/20 text-purple-200 hover:bg-purple-500/40 transition-colors">
            <HelpCircle className="w-6 h-6" />
        </button>
    </div>

      {isInstallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card rounded-3xl p-8 max-w-md w-full animate-fadeInUp">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500/30 to-indigo-500/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </div>
              <h3 className="font-display text-2xl text-purple-100 mb-2">Installer l'application</h3>
              <p className="text-purple-300/70">Accédez à HypnoHistory directement depuis votre bureau ou écran d'accueil.</p>
            </div>
            <div className="space-y-3 flex flex-col">
              <button onClick={handleInstallApp} className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-purple-600/80 to-indigo-600/80 text-white font-display hover:from-purple-500/90 hover:to-indigo-500/90 transition-all duration-300">
                Installer maintenant
              </button>
              <button onClick={handleDismissInstall} className="w-full px-6 py-3 rounded-full border border-purple-400/30 text-purple-200 font-display hover:bg-purple-500/20 transition-all duration-300">
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}

      {isFaqOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}>
            <div className="glass-card rounded-3xl p-8 max-w-2xl w-full animate-fadeInUp relative overflow-y-auto max-h-[90vh]">
                <button onClick={() => setIsFaqOpen(false)} className="absolute top-4 right-4 text-purple-200/70 hover:text-purple-100 z-10">
                    <X className="w-7 h-7" />
                </button>
                <h3 className="font-display text-3xl text-purple-100 mb-8 text-center">F.A.Q. - Questions Fréquentes</h3>
                <div className="space-y-6 text-purple-200/90">
                    <div>
                        <h4 className="font-bold text-lg text-purple-100 mb-2">Qu'est-ce que l'hypnose ?</h4>
                        <p className="leading-relaxed">L'hypnose est un état de conscience modifié, tout à fait naturel, que vous expérimentez plusieurs fois par jour sans même vous en rendre compte : par exemple, lorsque vous êtes absorbé par un film, un livre, ou lorsque vous êtes "dans la lune". Ce n'est ni du sommeil, ni une perte de contrôle. C'est un état de grande concentration intérieure où votre esprit critique est mis en veille, ce qui vous rend plus réceptif aux suggestions positives et à l'apprentissage.</p>
                    </div>
                     <div>
                        <h4 className="font-bold text-lg text-purple-100 mb-2">Est-ce que ça marche sur tout le monde ?</h4>
                        <p className="leading-relaxed">Oui, car tout le monde est capable d'entrer dans cet état naturel. Cependant, la profondeur et la rapidité pour y entrer peuvent varier d'une personne à l'autre et même d'un jour à l'autre. La clé est le lâcher-prise et l'envie de jouer le jeu. Plus vous pratiquerez, plus il sera facile et rapide d'entrer dans un état de relaxation propice à l'apprentissage.</p>
                    </div>
                     <div>
                        <h4 className="font-bold text-lg text-purple-100 mb-2">Vais-je perdre le contrôle ?</h4>
                        <p className="leading-relaxed">Absolument pas. C'est un mythe véhiculé par l'hypnose de spectacle. En état d'hypnose, vous restez conscient de ce qui se passe et vous gardez le contrôle. Vous ne ferez jamais rien qui aille contre vos valeurs. Vous pouvez d'ailleurs décider de sortir de cet état à tout moment si vous le souhaitez.</p>
                    </div>
                     <div>
                        <h4 className="font-bold text-lg text-purple-100 mb-2">Comment fonctionne l'apprentissage sous hypnose ?</h4>
                        <p className="leading-relaxed">En état d'hypnose, votre cerveau ondes cérébrales ralentissent, ouvrant un accès privilégié à votre subconscient. Les informations (dates, faits, concepts) présentées sous forme d'histoires et de métaphores sont alors absorbées plus facilement et durablement, sans le filtre du mental conscient. C'est un peu comme apprendre en rêvant, de manière intuitive et sans effort.</p>
                    </div>
                     <div>
                        <h4 className="font-bold text-lg text-purple-100 mb-2">Que faire si je ne me sens pas "hypnotisé" ?</h4>
                        <p className="leading-relaxed">Ne vous focalisez pas sur l'idée de "vous sentir hypnotisé". Cherchez plutôt la relaxation. Si votre esprit vagabonde, c'est normal. Ramenez simplement et doucement votre attention sur la voix et la musique. La séance d'ancrage est conçue pour vous apprendre à entrer dans cet état. N'hésitez pas à la refaire plusieurs fois, dans un endroit calme et à un moment où vous ne serez pas dérangé.</p>
                    </div>
                </div>
            </div>
        </div>
      )}

      {isHypnosisCheckOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}>
            <div className="glass-card rounded-3xl p-8 max-w-md w-full animate-fadeInUp">
                <div className="text-center mb-6">
                    <h3 className="font-display text-2xl text-purple-100 mb-2">Vérification de la séance</h3>
                    <p className="text-purple-300/70">Avez-vous eu l'impression d'entrer dans un état de relaxation profonde ou d'hypnose ?</p>
                </div>
                <div className="space-y-3 flex flex-col">
                    <button onClick={handleHypnosisCheckYes} className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-green-600/80 to-emerald-600/80 text-white font-display transition-all duration-300">
                        Oui, je me suis senti détendu
                    </button>
                    <button onClick={handleHypnosisCheckNo} className="w-full px-6 py-3 rounded-full border border-red-400/30 text-red-200 font-display hover:bg-red-500/20 transition-all duration-300">
                        Non, pas vraiment
                    </button>
                </div>
            </div>
        </div>
    )}

      <div id="home-screen" className={`h-full w-full flex flex-col items-center justify-center p-6 ${screen === 'home' ? '' : 'hidden'}`} style={{ background: 'radial-gradient(ellipse at center, #1e1432 0%, #0d0a14 50%, #050308 100%)' }}>
        <div className="mb-8 animate-fadeInUp">
            <Image src="https://i.ibb.co/Z66542nj/Hh.png" alt="HypnoHistory Logo" width={128} height={128} className="object-contain" priority />
        </div>
        <h1 className="font-display text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-violet-300 to-indigo-200 text-center mb-6 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>HypnoHistory</h1>
        <p className="font-body text-lg md:text-xl text-purple-200/70 text-center max-w-xl mb-16 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>Apprenez l'Histoire en état modifié de conscience</p>
        <button onClick={handleStartClick} className="group relative px-12 py-4 rounded-full bg-gradient-to-r from-purple-600/80 to-indigo-600/80 text-white font-display text-lg tracking-wide animate-pulse-glow animate-fadeInUp transition-all duration-300 hover:from-purple-500/90 hover:to-indigo-500/90" style={{ animationDelay: '0.6s' }}>
            <span className="relative z-10">Commencer le voyage</span>
        </button>
      </div>

      <div id="theme-screen" className={`h-full w-full flex flex-col overflow-auto p-6 ${screen === 'theme' ? '' : 'hidden'}`} style={{ background: 'radial-gradient(ellipse at center, #1e1432 0%, #0d0a14 50%, #050308 100%)' }}>
        <button onClick={() => showScreen('home')} className="self-start mb-8 flex items-center gap-2 text-purple-300/70 hover:text-purple-200 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            <span className="font-body">Retour</span>
        </button>
        <div className="flex-1 flex flex-col items-center justify-center">
          <h2 className="font-display text-4xl md:text-5xl text-purple-100 text-center mb-4">Choisissez votre sujet</h2>
          <p className="text-purple-300/60 text-center mb-12 text-lg max-w-xl">Sélectionnez un personnage ou événement historique</p>
          <div className="grid grid-cols-1 gap-6 max-w-2xl w-full">
            {Object.keys(themes).filter(t => t !== 'anchoring').map(themeId => {
              const theme = themes[themeId as keyof typeof themes] as any;
              return (
              <button key={themeId} onClick={() => selectTheme(themeId as keyof typeof themes)} className="glass-card rounded-2xl p-8 text-left hover:border-purple-400/50 transition-all duration-300 group hover:scale-105">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-5xl">{theme.emoji}</div>
                  {theme.receptivity && (
                    <div className="flex items-center gap-2 text-sm text-purple-300/70">
                        <span>Réceptivité</span>
                        <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-5 h-5 ${i < theme.receptivity ? 'text-yellow-400 fill-yellow-400' : 'text-purple-400/30'}`} />
                            ))}
                        </div>
                    </div>
                  )}
                </div>
                <h3 className="font-display text-2xl text-purple-100 mb-3 group-hover:text-white transition-colors">{theme.name}</h3>
                <p className="text-purple-300/60 text-base">{theme.knowledge[0].content}</p>
              </button>
            )})}
          </div>
        </div>
      </div>
      
      <div id="questionnaire-screen" className={`h-full w-full flex flex-col overflow-auto p-6 ${screen === 'questionnaire' ? '' : 'hidden'}`} style={{ background: 'radial-gradient(ellipse at center, #1e1432 0%, #0d0a14 50%, #050308 100%)' }}>
        <button onClick={() => showScreen('theme')} className="self-start mb-8 flex items-center gap-2 text-purple-300/70 hover:text-purple-200 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            <span className="font-body">Retour</span>
        </button>
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto">
          {currentStep === 1 && (
            <div id="step-headphones" className="w-full glass-card rounded-2xl p-8 md:p-10 animate-fadeInUp">
                <div className="flex items-center gap-4 mb-6"><div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-200 font-display font-bold">1</div><h2 className="font-display text-2xl md:text-3xl text-purple-100">Préparation audio</h2></div>
                <div className="space-y-6">
                    <p className="text-purple-100 text-lg font-semibold">Mettez vos écouteurs ou casque pour une expérience optimale.</p>
                    <button onClick={() => setCurrentStep(2)} className="w-full px-6 py-4 rounded-full bg-gradient-to-r from-purple-600/80 to-indigo-600/80 text-white font-display hover:from-purple-500/90 hover:to-indigo-500/90 transition-all duration-300">C'est fait</button>
                </div>
            </div>
          )}
          {currentStep === 2 && (
            <div id="step-comfort" className="w-full glass-card rounded-2xl p-8 md:p-10 animate-fadeInUp">
                <div className="flex items-center gap-4 mb-6"><div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-200 font-display font-bold">2</div><h2 className="font-display text-2xl md:text-3xl text-purple-100">Installez-vous</h2></div>
                <div className="space-y-6">
                    <p className="text-purple-100 text-lg">Asseyez-vous ou allongez-vous confortablement.</p>
                    <button onClick={() => setCurrentStep(3)} className="w-full px-6 py-4 rounded-full bg-gradient-to-r from-purple-600/80 to-indigo-600/80 text-white font-display hover:from-purple-500/90 hover:to-indigo-500/90 transition-all duration-300">Je suis prêt</button>
                    <button onClick={() => setCurrentStep(currentStep - 1)} className="w-full px-6 py-4 rounded-full border border-purple-400/30 text-purple-200 font-display hover:bg-purple-500/20 transition-all duration-300">Revenir en arrière</button>
                </div>
            </div>
          )}
          {currentStep === 3 && (
             <div id="step-comfort-check" className="w-full glass-card rounded-2xl p-8 md:p-10 animate-fadeInUp">
                <div className="flex items-center gap-4 mb-6"><div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-200 font-display font-bold">3</div><h2 className="font-display text-2xl md:text-3xl text-purple-100">Vérification finale</h2></div>
                <div className="space-y-6">
                    <p className="text-purple-100 text-lg">Prêt à commencer l'expérience ?</p>
                    <div className="space-y-3 flex flex-col">
                        <button onClick={() => setCurrentStep(4)} className="w-full px-6 py-4 rounded-full bg-gradient-to-r from-purple-600/80 to-indigo-600/80 text-white font-display hover:from-purple-500/90 hover:to-indigo-500/90 transition-all duration-300">Oui, je suis prêt</button>
                        <button onClick={() => setCurrentStep(currentStep - 1)} className="w-full px-6 py-4 rounded-full border border-purple-400/30 text-purple-200 font-display hover:bg-purple-500/20 transition-all duration-300">Revenir en arrière</button>
                    </div>
                </div>
            </div>
          )}
          {currentStep === 4 && (
            <div id="step-anchoring-check" className="w-full glass-card rounded-2xl p-8 md:p-10 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center gap-4 mb-6"><div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-200 font-display font-bold">4</div><h2 className="font-display text-2xl md:text-3xl text-purple-100">Vérification d'ancrage</h2></div>
                <div className="space-y-6">
                    <p className="text-purple-100 text-lg leading-relaxed">{anchoringCompleted ? 'Votre ancrage est actif. Vous êtes prêt à explorer ce sujet !' : "C'est votre première utilisation ! Vous devez d'abord suivre une séance d'ancrage pour accéder au contenu."}</p>
                    <div className="space-y-3 flex flex-col">
                        <button onClick={startAnchoringOrSession} className="w-full px-6 py-4 rounded-full bg-gradient-to-r from-purple-600/80 to-indigo-600/80 text-white font-display hover:from-purple-500/90 hover:to-indigo-500/90 transition-all duration-300">{anchoringCompleted ? 'Continuer vers la séance' : "Commencer la séance d'ancrage"}</button>
                        <button onClick={() => setCurrentStep(currentStep - 1)} className="w-full px-6 py-4 rounded-full border border-purple-400/30 text-purple-200 font-display hover:bg-purple-500/20 transition-all duration-300">Revenir en arrière</button>
                    </div>
                </div>
            </div>
          )}
        </div>
      </div>

      <div id="hypnosis-screen" className={`h-full w-full flex flex-col items-center justify-center p-6 overflow-auto relative ${screen === 'hypnosis' ? '' : 'hidden'}`} style={{ background: 'radial-gradient(ellipse at center, #1e1432 0%, #0d0a14 50%, #050308 100%)' }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-[600px] h-[600px] rounded-full hypno-spiral animate-spiral opacity-30"></div></div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-32 h-32 rounded-full border border-purple-400/20 animate-breathe"></div><div className="absolute w-48 h-48 rounded-full border border-purple-400/15 animate-breathe" style={{ animationDelay: '0.5s' }}></div><div className="absolute w-64 h-64 rounded-full border border-purple-400/10 animate-breathe" style={{ animationDelay: '1s' }}></div></div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-4 h-4 rounded-full bg-purple-300 animate-pulse-glow"></div></div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-64">
          <div className="h-1 bg-purple-900/50 rounded-full overflow-hidden">
            <div id="progress-bar" className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
          </div>
          <p id="phase-label" className="text-purple-400/60 text-sm text-center mt-3">{progress < 100 ? 'Séance en cours...' : 'Retour progressif...'}</p>
        </div>
      </div>
      
      <div id="result-screen" className={`h-full w-full flex flex-col overflow-auto p-6 ${screen === 'result' ? '' : 'hidden'}`} style={{ background: 'radial-gradient(ellipse at center, #1e1432 0%, #0d0a14 50%, #050308 100%)' }}>
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500/30 to-indigo-500/30 flex items-center justify-center mb-6 animate-fadeInUp">
            <svg className="w-8 h-8 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="font-display text-3xl md:text-4xl text-purple-100 text-center mb-2 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>Séance terminée</h2>
          <p className="text-purple-300/70 text-lg md:text-xl mb-10 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>{currentTheme?.name}</p>
          <div className="glass-card rounded-2xl p-8 md:p-10 max-w-3xl w-full animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
            <h3 className="font-display text-2xl text-purple-100 mb-8 flex items-center gap-3"><span className="text-3xl">📚</span> Ce que vous savez maintenant</h3>
            <div className="space-y-8 text-purple-200/80 leading-relaxed">
              {currentTheme?.knowledge.map((item: any, index: number) => (
                <div key={index} className="border-l-2 border-purple-500/40 pl-4">
                  <h4 className="font-display text-lg text-purple-100 mb-2">{item.title}</h4>
                  <p>{item.content}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-10 animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
            <button onClick={() => showScreen('theme')} className="px-8 py-3 rounded-full border border-purple-400/30 text-purple-200 font-display hover:bg-purple-500/20 transition-all duration-300">Nouvelle séance</button>
            <button onClick={() => showScreen('home')} className="px-8 py-3 rounded-full bg-gradient-to-r from-purple-600/80 to-indigo-600/80 text-white font-display hover:from-purple-500/90 hover:to-indigo-500/90 transition-all duration-300">Retour à l'accueil</button>
          </div>
        </div>
      </div>
    </>
  );
}
