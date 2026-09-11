import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import ParchmentPlaque from './ParchmentPlaque';
import Seal from './Seal';

export default function CaseCodeDisplay({ code, defendantName, onEnterCourtroom }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto my-4 animate-scale-in">
      <div className="relative w-full">
        <ParchmentPlaque rotate={false} className="p-6 text-center border-2 border-brass/50 shadow-panel">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-maroon/20">
            <Seal size={40} />
            <span className="font-display font-bold text-xs uppercase tracking-widest text-maroon/80">
              OFFICIAL CASE SUMMONS CODE
            </span>
          </div>

          <p className="text-xs uppercase tracking-wider text-maroon/70 font-semibold mb-1">
            COURT SUMMONS CODE
          </p>

          <div className="bg-wood-dark/10 p-3 rounded border border-maroon/30 my-3 flex items-center justify-center gap-3">
            <span className="tracking-[0.3em] font-mono text-3xl md:text-4xl font-extrabold text-maroon drop-shadow-sm select-all">
              {code}
            </span>
            <button
              onClick={handleCopy}
              className="p-2 rounded hover:bg-maroon/10 text-maroon transition cursor-pointer"
              title="Copy code to clipboard"
            >
              {copied ? <Check className="w-5 h-5 text-green-700" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>

          {copied && (
            <p className="text-xs font-semibold text-green-800 animate-pulse">
              ✓ Code copied to clipboard!
            </p>
          )}

          <p className="mt-4 font-body text-sm text-ink leading-relaxed font-medium">
            Send this code to <span className="font-bold text-maroon underline">{defendantName}</span> to bring them to court.
          </p>
        </ParchmentPlaque>
      </div>

      <button
        onClick={onEnterCourtroom}
        className="w-full rounded-panel bg-gradient-to-b from-brass-light to-brass py-3.5 px-6 font-display font-bold text-ink shadow-panel hover:from-brass hover:to-brass-dark transition transform active:scale-95 cursor-pointer text-center"
      >
        Enter Court Room
      </button>
    </div>
  );
}
