'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

export default function Home() {
  const [screen, setScreen] = useState('home');
  const [currentTheme, setCurrentTheme] = useState<any>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [anchoringCompleted, setAnchoringCompleted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isAnchoringSession, setIsAnchoringSession] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // PWA and Service Worker setup
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
    
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // Local storage setup
    try {
        setAnchoringCompleted(localStorage.getItem('hypnohistory_anchoring_done') === 'true');
    } catch (error) {
        console.error('Could not access local storage:', error);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Effect for the anchoring audio session
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onAudioEnd = () => {
      setProgress(100);
      setTimeout(() => {
        setAnchoringCompleted(true);
        try {
          localStorage.setItem('hypnohistory_anchoring_done', 'true');
        } catch (error) {
          console.error('Could not write to local storage:', error);
        }
        setIsAnchoringSession(false);
        showScreen('result');
        setProgress(0);
      }, 500);
    };

    const updateProgress = () => {
      const currentProgress = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      setProgress(currentProgress);
    };

    if (isAnchoringSession && screen === 'hypnosis') {
      audio.addEventListener('ended', onAudioEnd);
      audio.addEventListener('timeupdate', updateProgress);
      audio.play().catch(e => console.error("Error playing audio:", e));
    }

    return () => {
      audio.removeEventListener('ended', onAudioEnd);
      audio.removeEventListener('timeupdate', updateProgress);
      if (audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [isAnchoringSession, screen]);

  // Effect for the regular (non-anchoring) hypnosis session
  useEffect(() => {
    let progressInterval: NodeJS.Timeout | undefined;

    if (screen === 'hypnosis' && !isAnchoringSession && currentTheme) {
      const sessionDuration = 5000;
      const updateInterval = 100;
      let startTime = Date.now();

      progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const currentProgress = Math.min((elapsed / sessionDuration) * 100, 100);
        setProgress(currentProgress);

        if (elapsed >= sessionDuration) {
          clearInterval(progressInterval);
          setProgress(100);
          
          setTimeout(() => {
            showScreen('result');
            setProgress(0);
          }, 1500);
        }
      }, updateInterval);
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [screen, isAnchoringSession, currentTheme]);

  const themes: any = {
      fable_corbeau: { name: 'Le Corbeau et le Renard', emoji: '🦅', knowledge: [ { title: 'Auteur', content: 'Jean de La Fontaine (1621-1695). Fabuliste français reconnu mondialement pour ses Fables.' }, { title: 'La morale', content: '"Tout flatteur vit aux dépens de celui qui l\'écoute." Ne vous laissez pas manipuler par des compliments intéressés.' }, { title: 'Les personnages', content: 'Le Corbeau: naïf et orgueilleux. Le Renard: rusé et calculateur. Représentent les vices et défauts humains.' }, { title: 'Style', content: 'Écrite en vers octosyllabiques. Dialogue vivant et naturel. Ton ironique et bienveillant.' }, { title: 'Enseignement', content: 'Critique de la vanité et de la sottise. Valorise la prudence et l\'intelligence. Les fables enseignent par l\'exemple.' } ] },
      anchoring: { name: 'Séance d\'ancrage hypnotique', emoji: '⚓', knowledge: [ { title: 'Ancrage établi', content: 'Vous avez complété avec succès votre séance d\'ancrage initial. Cet ancrage reste actif et reconnaissable par votre inconscient.' }, { title: 'Accès débloqué', content: 'Vous avez maintenant accès à tous les contenus d\'apprentissage hypnotique de HypnoHistory.' }, { title: 'État hypnotique', content: 'Vous avez exploré la profondeur de votre état hypnotique. Vous savez maintenant à quoi vous attendre lors des séances suivantes.' }, { title: 'Réceptivité', content: 'Votre esprit est maintenant réceptif à l\'apprentissage hypnotique. Les informations s\'intégreront naturellement à votre mémoire.' }, { title: 'Début du voyage', content: 'C\'était votre première étape. Des dizaines de sujets passionnants vous attendent. Continuez votre exploration !' } ] }
  };

  const showScreen = (screenName: string) => setScreen(screenName);

  const handleStartClick = () => {
    if (deferredPrompt) {
      setIsInstallModalOpen(true);
    } else {
      showScreen('theme');
    }
  };
  
  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
    } catch (error) {
        console.error('PWA installation prompt error:', error);
    } finally {
        setDeferredPrompt(null);
        setIsInstallModalOpen(false);
        showScreen('theme');
    }
  };

  const handleDismissInstall = () => {
      setIsInstallModalOpen(false);
      showScreen('theme');
  };

  const selectTheme = (themeId: keyof typeof themes) => {
    setCurrentTheme(themes[themeId]);
    setCurrentStep(1);
    showScreen('questionnaire');
  };

  const startAnchoringOrSession = () => {
    if (anchoringCompleted) {
      showScreen('prep');
    } else {
      setIsAnchoringSession(true);
      setCurrentTheme(themes.anchoring);
      showScreen('hypnosis');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div id="step-headphones" className="w-full glass-card rounded-2xl p-8 md:p-10 animate-fadeInUp">
            <div className="flex items-center gap-4 mb-6"><div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-200 font-display font-bold">1</div><h2 className="font-display text-2xl md:text-3xl text-purple-100">Préparation audio</h2></div>
            <div className="space-y-6">
              <div className="flex items-center gap-4"><svg className="w-12 h-12 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                <div><p className="text-purple-100 text-lg font-semibold">Mettez vos écouteurs ou casque</p><p className="text-purple-300/60">La musique et les voix guidées sont essentielles pour cette expérience</p></div>
              </div>
              <button onClick={() => setCurrentStep(2)} className="w-full px-6 py-4 rounded-full bg-gradient-to-r from-purple-600/80 to-indigo-600/80 text-white font-display hover:from-purple-500/90 hover:to-indigo-500/90 transition-all duration-300">J'ai mis mes écouteurs</button>
            </div>
          </div>
        );
      case 2:
        return (
          <div id="step-comfort" className="w-full glass-card rounded-2xl p-8 md:p-10 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-4 mb-6"><div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-200 font-display font-bold">2</div><h2 className="font-display text-2xl md:text-3xl text-purple-100">Installez-vous confortablement</h2></div>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4"><svg className="w-10 h-10 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.59 11H2m18.67 0h.01M6 14h4v7H6z" /></svg><p className="text-purple-200">Asseyez-vous ou allongez-vous dans une position confortable</p></div>
                <div className="flex items-center gap-4"><svg className="w-10 h-10 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg><p className="text-purple-200">Créez une ambiance calme et sombre si possible</p></div>
                <div className="flex items-center gap-4"><svg className="w-10 h-10 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18.364 5.636l-3.536 3.536m0 5.172l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.172l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg><p className="text-purple-200">Éteignez les notifications et mettez votre téléphone en silencieux</p></div>
              </div>
              <button onClick={() => setCurrentStep(3)} className="w-full px-6 py-4 rounded-full bg-gradient-to-r from-purple-600/80 to-indigo-600/80 text-white font-display hover:from-purple-500/90 hover:to-indigo-500/90 transition-all duration-300">Je suis prêt</button>
            </div>
          </div>
        );
      case 3:
        return (
          <div id="step-comfort-check" className="w-full glass-card rounded-2xl p-8 md:p-10 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-4 mb-6"><div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-200 font-display font-bold">3</div><h2 className="font-display text-2xl md:text-3xl text-purple-100">Vérification finale</h2></div>
            <div className="space-y-6">
              <p className="text-purple-100 text-lg">Êtes-vous certain d'être prêt à commencer ?</p>
              <div className="space-y-3 flex flex-col">
                <button onClick={() => setCurrentStep(4)} className="w-full px-6 py-4 rounded-full bg-gradient-to-r from-purple-600/80 to-indigo-600/80 text-white font-display hover:from-purple-500/90 hover:to-indigo-500/90 transition-all duration-300">Oui, je suis prêt ✨</button>
                <button onClick={() => setCurrentStep(currentStep - 1)} className="w-full px-6 py-4 rounded-full border border-purple-400/30 text-purple-200 font-display hover:bg-purple-500/20 transition-all duration-300">Revenir en arrière</button>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div id="step-anchoring-check" className="w-full glass-card rounded-2xl p-8 md:p-10 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-4 mb-6"><div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-200 font-display font-bold">4</div><h2 className="font-display text-2xl md:text-3xl text-purple-100">Vérification d'ancrage</h2></div>
            <div className="space-y-6">
              <p className="text-purple-100 text-lg leading-relaxed">{anchoringCompleted ? 'Vous êtes prêt à explorer ce sujet !' : "C'est votre première utilisation ! Vous devez d'abord suivre une séance d'ancrage pour accéder au contenu."}</p>
              <div className="space-y-3 flex flex-col">
                <button onClick={startAnchoringOrSession} className="w-full px-6 py-4 rounded-full bg-gradient-to-r from-purple-600/80 to-indigo-600/80 text-white font-display hover:from-purple-500/90 hover:to-indigo-500/90 transition-all duration-300">{anchoringCompleted ? 'Continuer vers la séance' : "Commencer la séance d'ancrage"}</button>
                <button onClick={() => setCurrentStep(currentStep - 1)} className="w-full px-6 py-4 rounded-full border border-purple-400/30 text-purple-200 font-display hover:bg-purple-500/20 transition-all duration-300">Revenir en arrière</button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
       <audio
        ref={audioRef}
        src="https://digipad.s3.sbg.io.cloud.ovh.net/1619015/28aafa76b0a6cd368b3c555597e2e888_1_2wspx8y0mha.mp3"
        preload="auto"
       />
       {isInstallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card rounded-3xl p-8 max-w-md w-full animate-fadeInUp">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500/30 to-indigo-500/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </div>
              <h3 className="font-display text-2xl text-purple-100 mb-2">Installer l'application</h3>
              <p className="text-purple-300/70">Accédez à HypnoHistory directement depuis votre bureau ou écran d'accueil</p>
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

      <div id="home-screen" className={`h-full w-full flex flex-col items-center justify-center p-6 ${screen === 'home' ? '' : 'hidden'}`} style={{ background: 'radial-gradient(ellipse at center, #1e1432 0%, #0d0a14 50%, #050308 100%)' }}>
        <div className="mb-8 animate-fadeInUp"><Image src="https://i.ibb.co/Z66542nj/Hh.png" alt="HypnoHistory Logo" width={128} height={128} className="object-contain" priority /></div>
        <h1 className="font-display text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-violet-300 to-indigo-200 text-center mb-6 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>HypnoHistory</h1>
        <p className="font-body text-lg md:text-xl text-purple-200/70 text-center max-w-xl mb-16 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>Apprenez l'Histoire en état modifié de conscience</p>
        <button onClick={handleStartClick} className="group relative px-12 py-4 rounded-full bg-gradient-to-r from-purple-600/80 to-indigo-600/80 text-white font-display text-lg tracking-wide animate-pulse-glow animate-fadeInUp transition-all duration-300 hover:from-purple-500/90 hover:to-indigo-500/90" style={{ animationDelay: '0.6s' }}><span className="relative z-10">Commencer le voyage</span></button>
      </div>

      <div id="theme-screen" className={`h-full w-full flex flex-col overflow-auto p-6 ${screen === 'theme' ? '' : 'hidden'}`} style={{ background: 'radial-gradient(ellipse at center, #1e1432 0%, #0d0a14 50%, #050308 100%)' }}>
        <button onClick={() => showScreen('home')} className="self-start mb-8 flex items-center gap-2 text-purple-300/70 hover:text-purple-200 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg><span className="font-body">Retour</span></button>
        <div className="flex-1 flex flex-col items-center justify-center">
          <h2 className="font-display text-4xl md:text-5xl text-purple-100 text-center mb-4">Choisissez votre sujet</h2>
          <p className="text-purple-300/60 text-center mb-12 text-lg max-w-xl">Sélectionnez un personnage ou événement historique</p>
          <div className="grid grid-cols-1 gap-6 max-w-2xl w-full">
            {Object.keys(themes).filter(t => t !== 'anchoring').map(themeId => (
              <button key={themeId} onClick={() => selectTheme(themeId as keyof typeof themes)} className="glass-card rounded-2xl p-8 text-left hover:border-purple-400/50 transition-all duration-300 group hover:scale-105">
                <div className="text-5xl mb-4">{themes[themeId].emoji}</div>
                <h3 className="font-display text-2xl text-purple-100 mb-3 group-hover:text-white transition-colors">{themes[themeId].name}</h3>
                <p className="text-purple-300/60 text-base">{themes[themeId].knowledge[0].content}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div id="questionnaire-screen" className={`h-full w-full flex flex-col overflow-auto p-6 ${screen === 'questionnaire' ? '' : 'hidden'}`} style={{ background: 'radial-gradient(ellipse at center, #1e1432 0%, #0d0a14 50%, #050308 100%)' }}>
        <button onClick={() => showScreen('theme')} className="self-start mb-8 flex items-center gap-2 text-purple-300/70 hover:text-purple-200 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg><span className="font-body">Retour</span></button>
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto">{renderStep()}</div>
      </div>

      <div id="prep-screen" className={`h-full w-full flex flex-col items-center justify-center p-6 overflow-auto ${screen === 'prep' ? '' : 'hidden'}`} style={{ background: 'radial-gradient(ellipse at center, #1e1432 0%, #0d0a14 50%, #050308 100%)' }}>
        <div className="max-w-lg text-center">
          <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-purple-500/20 flex items-center justify-center animate-breathe"><svg className="w-10 h-10 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></div>
          <h2 className="font-display text-3xl md:text-4xl text-purple-100 mb-6">Préparation à la séance</h2>
          <p className="text-purple-200/80 text-xl mb-12">Sujet : {currentTheme?.name}</p>
          <button onClick={() => showScreen('hypnosis')} className="px-10 py-4 rounded-full bg-gradient-to-r from-purple-600/80 to-indigo-600/80 text-white font-display text-lg tracking-wide animate-pulse-glow transition-all duration-300 hover:from-purple-500/90 hover:to-indigo-500/90">Commencer la séance</button>
        </div>
      </div>
      
      <div id="hypnosis-screen" className={`h-full w-full flex flex-col items-center justify-center p-6 overflow-auto relative ${screen === 'hypnosis' ? '' : 'hidden'}`} style={{ background: 'radial-gradient(ellipse at center, #1e1432 0%, #0d0a14 50%, #050308 100%)' }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-[600px] h-[600px] rounded-full hypno-spiral animate-spiral opacity-30"></div></div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-32 h-32 rounded-full border border-purple-400/20 animate-breathe"></div><div className="absolute w-48 h-48 rounded-full border border-purple-400/15 animate-breathe" style={{ animationDelay: '0.5s' }}></div><div className="absolute w-64 h-64 rounded-full border border-purple-400/10 animate-breathe" style={{ animationDelay: '1s' }}></div></div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-4 h-4 rounded-full bg-purple-300 animate-pulse-glow"></div></div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-64">
          <div className="h-1 bg-purple-900/50 rounded-full overflow-hidden"><div id="progress-bar" className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div></div>
          <p id="phase-label" className="text-purple-400/60 text-sm text-center mt-3">{progress < 100 ? 'Induction...' : 'Retour progressif...'}</p>
        </div>
      </div>
      
      <div id="result-screen" className={`h-full w-full flex flex-col overflow-auto p-6 ${screen === 'result' ? '' : 'hidden'}`} style={{ background: 'radial-gradient(ellipse at center, #1e1432 0%, #0d0a14 50%, #050308 100%)' }}>
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500/30 to-indigo-500/30 flex items-center justify-center mb-6 animate-fadeInUp"><svg className="w-8 h-8 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
          <h2 className="font-display text-3xl md:text-4xl text-purple-100 text-center mb-2 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>Séance terminée</h2>
          <p className="text-purple-300/70 text-lg md:text-xl mb-10 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>{currentTheme?.name}</p>
          <div className="glass-card rounded-2xl p-8 md:p-10 max-w-3xl w-full animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
            <h3 className="font-display text-2xl text-purple-100 mb-8 flex items-center gap-3"><span className="text-3xl">📚</span> Ce que vous savez maintenant</h3>
            <div className="space-y-8 text-purple-200/80 leading-relaxed">
              {currentTheme?.knowledge.map((item: any, index: number) => (
                <div key={index} className="border-l-2 border-purple-500/40 pl-4"><h4 className="font-display text-lg text-purple-100 mb-2">{item.title}</h4><p>{item.content}</p></div>
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
