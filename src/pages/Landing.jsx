import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  // stage 0: 0s - 2s (clear unblurred background only)
  // stage 1: 2s - 2.6s (blurred background + courtroom name)
  // stage 2: 2.6s+ (reveals action buttons)
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setStage(1);
    }, 2000);

    const timer2 = setTimeout(() => {
      setStage(2);
    }, 2600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const skipIntro = () => {
    setStage(2);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-wood-dark select-none flex flex-col justify-center items-center">
      {/* Courtroom Background with smooth blur and zoom transition */}
      <div 
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out ${
          stage >= 1 ? 'filter blur-md scale-105 brightness-50' : 'filter blur-0 scale-100 brightness-100'
        }`}
        style={{ backgroundImage: "url('/hero-courtroom.jpg?v=3')" }}
      />

      {/* Darkened vignette overlay appearing smoothly when blurred */}
      <div 
        className={`absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80 pointer-events-none transition-opacity duration-1000 ${
          stage >= 1 ? 'opacity-100' : 'opacity-0'
        }`} 
      />

      {/* Center Showcase: Appears at 2s (Stage 1), with buttons joining at 2.6s (Stage 2) */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
        {stage >= 1 && (
          <div className="text-center px-4 animate-fade-in flex flex-col items-center max-w-3xl">
            {/* Name */}
            <h1 className="font-display text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-brass-light via-brass to-brass-dark drop-shadow-[0_6px_25px_rgba(0,0,0,0.95)] tracking-wide">
              നാട്ടിലെ COURT
            </h1>

            {/* Stage 2: Two Action Buttons */}
            {stage >= 2 && (
              <div className="mt-8 flex flex-col sm:flex-row gap-5 items-center justify-center animate-scale-in">
                <button
                  id="file-case-btn"
                  onClick={() => navigate('/file-case')}
                  className="rounded-panel bg-gradient-to-b from-brass-light via-brass to-brass-dark px-8 py-3.5
                             font-display font-extrabold text-ink shadow-[0_6px_25px_rgba(0,0,0,0.8)] hover:scale-105 hover:shadow-[0_0_30px_rgba(224,185,92,0.7)] transition active:scale-95 cursor-pointer text-lg tracking-wide border border-brass-light/80 flex items-center gap-3"
                >
                  <span className="text-2xl">⚖️</span>
                  <span>File a Case (കേസ് കൊടുക്കുക)</span>
                </button>
                <button
                  id="enter-courtroom-btn"
                  onClick={() => navigate('/join')}
                  className="rounded-panel border-2 border-brass/70 px-8 py-3.5 bg-wood-dark/85 backdrop-blur-md
                             font-display font-bold text-parchment shadow-[0_6px_25px_rgba(0,0,0,0.8)] hover:bg-leather/60 hover:border-brass hover:scale-105 transition active:scale-95 cursor-pointer text-lg tracking-wide flex items-center gap-3"
                >
                  <span className="text-2xl">🚪</span>
                  <span>Enter Court Room (കോടതിയിൽ കയറുക)</span>
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Subtle Skip Intro button during stage 0 */}
      {stage < 2 && (
        <button
          onClick={skipIntro}
          className="absolute bottom-4 right-4 z-20 text-xs text-parchment/60 hover:text-parchment bg-wood-dark/60 hover:bg-wood-dark/90 backdrop-blur-sm border border-brass/30 px-3 py-1 rounded-full cursor-pointer transition flex items-center gap-1.5"
        >
          <span>Skip Intro</span>
          <span>⏭</span>
        </button>
      )}
    </div>
  );
}
