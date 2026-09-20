import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import BlurredHero from '../components/BlurredHero';
import WoodPanel from '../components/WoodPanel';
import ParchmentPlaque from '../components/ParchmentPlaque';
import Seal from '../components/Seal';
import { Copy, Check, ArrowRight, Home } from 'lucide-react';

export default function WaitingRoom() {
  const { caseCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const code = (caseCode || location.state?.caseData?.case_code || location.state?.caseData?.code || '').toUpperCase();

  const [caseData, setCaseData] = useState(location.state?.caseData || null);
  const [loading, setLoading] = useState(!location.state?.caseData);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [role, setRole] = useState(location.state?.role || 'party');
  const [justJoinedCelebration, setJustJoinedCelebration] = useState(false);
  const prevDefendantRef = useRef(null);

  // Fetch initial case data
  const fetchCase = async () => {
    if (!code) {
      setError('No case code provided.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchErr } = await supabase
        .from('cases')
        .select('*')
        .eq('case_code', code)
        .single();

      if (fetchErr || !data) {
        setError('Case not found. Please verify the summons code.');
        setLoading(false);
        return;
      }

      setCaseData(data);

      // Determine user role
      const creatorToken = localStorage.getItem(`case_${code}_token`);
      const defToken = localStorage.getItem(`case_${code}_defendant_token`);
      if (creatorToken && creatorToken === data.creator_token) {
        setRole('complainant');
      } else if (defToken && defToken === data.defendant_token) {
        setRole('defendant');
      }

      // Check if defendant just arrived
      if (!prevDefendantRef.current && data.defendant) {
        setJustJoinedCelebration(true);
      }
      prevDefendantRef.current = data.defendant;
    } catch (err) {
      setError(err.message || 'Failed to connect to courtroom waiting room.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();

    // Supabase Realtime subscription
    const channel = supabase
      .channel(`waiting_room_${code}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cases', filter: `case_code=eq.${code}` },
        (payload) => {
          if (payload.new) {
            setCaseData(payload.new);
            if (!prevDefendantRef.current && payload.new.defendant) {
              setJustJoinedCelebration(true);
            }
            prevDefendantRef.current = payload.new.defendant;
          }
        }
      )
      .subscribe();

    // Backup polling every 1.5 seconds to guarantee synchronization
    const interval = setInterval(fetchCase, 1500);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [code]);

  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleProceedToCourtroom = () => {
    navigate(`/courtroom/${code}`, { state: { caseData, role } });
  };

  const defendantJoined = Boolean(caseData?.defendant && caseData?.defendant.trim().length > 0);

  if (loading) {
    return (
      <BlurredHero>
        <WoodPanel className="max-w-md text-center py-12">
          <Seal size={56} className="mb-4 animate-spin-slow" />
          <h2 className="text-xl font-display font-bold text-brass mb-2">
            ഹാജർ പരിശോധിക്കുന്നു...
          </h2>
          <p className="text-parchment/70 font-body text-sm">
            Connecting to Courtroom Waiting Room...
          </p>
        </WoodPanel>
      </BlurredHero>
    );
  }

  if (error || !caseData) {
    return (
      <BlurredHero>
        <WoodPanel className="max-w-md text-center py-8">
          <Seal size={56} className="mb-4" />
          <h2 className="text-2xl font-bold text-maroon mb-2">Notice of Summons</h2>
          <p className="text-parchment/80 font-body text-sm mb-6">
            {error || 'No active case found.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-panel font-display font-bold uppercase bg-gradient-to-b from-brass-light to-brass text-ink cursor-pointer hover:from-brass hover:to-brass-dark transition shadow-panel"
          >
            Return to Entrance
          </button>
        </WoodPanel>
      </BlurredHero>
    );
  }

  return (
    <BlurredHero>
      <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* Header with Seal and Parchment Plaque */}
        <div className="text-center">
          <Seal size={58} className="mb-2 drop-shadow-md" />
          <ParchmentPlaque className="inline-block text-center px-8 py-2.5 shadow-panel">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider">
              കാത്തിരിപ്പ് മുറി / WAITING ROOM
            </h1>
            <p className="text-xs font-semibold tracking-widest text-maroon/80 uppercase mt-0.5">
              NAATILE COURT — PRE-SESSION CHAMBERS
            </p>
          </ParchmentPlaque>
        </div>

        {/* Main Wood Panel */}
        <WoodPanel className="space-y-6 shadow-2xl">
          {/* Docket Header & Status Badge */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-wood-grain/70 pb-4 gap-3">
            <div>
              <span className="text-xs uppercase tracking-widest text-brass/80 font-bold block">
                CASE DOCKET NO.
              </span>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="font-mono text-3xl font-black text-brass tracking-[0.2em]">
                  #{caseData.case_code}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded bg-wood-dark/70 hover:bg-wood-dark text-brass/80 hover:text-brass border border-brass/30 transition cursor-pointer"
                  title="Copy Case Code"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
                {copied && (
                  <span className="text-xs font-semibold text-green-400 animate-pulse">
                    Copied!
                  </span>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs uppercase tracking-widest text-brass/80 font-bold block mb-1">
                ATTENDANCE STATUS
              </span>
              <span
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm transition-all duration-300 ${
                  defendantJoined
                    ? 'bg-green-950/90 text-green-300 border border-green-500/80 shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                    : 'bg-amber-950/90 text-amber-300 border border-amber-500/80 animate-pulse'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${defendantJoined ? 'bg-green-400 animate-ping' : 'bg-amber-400'}`} />
                {defendantJoined ? '● BOTH PARTIES PRESENT' : '⏳ WAITING FOR DEFENDANT'}
              </span>
            </div>
          </div>

          {/* Case Title Card */}
          <div className="bg-wood-dark/90 rounded-panel p-4 border border-wood-grain shadow-inner">
            <span className="text-[11px] uppercase tracking-widest text-brass/80 font-bold block mb-1">
              CASE COMPLAINT / വിഷയം
            </span>
            <p className="text-lg sm:text-xl font-bold text-parchment font-malayalam leading-snug">
              "{caseData.complaint}"
            </p>
          </div>

          {/* Parties Attendance Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Complainant Card */}
            <div className="bg-wood-dark/80 rounded-panel p-4 border border-wood-grain relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-brass font-bold flex items-center gap-1.5">
                  <span>⚖️</span> വാദി (COMPLAINANT)
                </span>
                {role === 'complainant' && (
                  <span className="text-[10px] bg-brass/25 text-brass font-extrabold px-2 py-0.5 rounded border border-brass/40 tracking-wider">
                    YOU
                  </span>
                )}
              </div>
              <div className="text-xl font-extrabold text-parchment font-display tracking-wide truncate">
                {caseData.plaintiff || 'Complainant'}
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-green-400 bg-green-950/50 py-1.5 px-2.5 rounded border border-green-800/40">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span>ഹാജരുണ്ട് (Present in Chamber)</span>
              </div>
            </div>

            {/* Defendant Card */}
            <div className={`bg-wood-dark/80 rounded-panel p-4 border transition-all duration-300 relative overflow-hidden ${
              defendantJoined ? 'border-wood-grain' : 'border-amber-600/40 bg-wood-dark/60'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-brass font-bold flex items-center gap-1.5">
                  <span>📜</span> പ്രതി (DEFENDANT)
                </span>
                {role === 'defendant' && (
                  <span className="text-[10px] bg-brass/25 text-brass font-extrabold px-2 py-0.5 rounded border border-brass/40 tracking-wider">
                    YOU
                  </span>
                )}
              </div>
              <div className="text-xl font-extrabold text-parchment font-display tracking-wide truncate">
                {caseData.defendant || 'Awaiting Defendant...'}
              </div>
              {defendantJoined ? (
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-green-400 bg-green-950/50 py-1.5 px-2.5 rounded border border-green-800/40 animate-fade-in">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  <span>ഹാജരുണ്ട് (Joined Waiting Room)</span>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-amber-300/90 bg-amber-950/50 py-1.5 px-2.5 rounded border border-amber-800/40 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>ഹാജരാകാൻ കാത്തിരിക്കുന്നു...</span>
                </div>
              )}
            </div>
          </div>

          {/* Real-time Status Alert / Summons Guidance */}
          {defendantJoined ? (
            <div className="bg-gradient-to-r from-green-950/90 via-emerald-950/80 to-green-950/90 border border-green-500/70 rounded-panel p-4 text-center shadow-lg animate-scale-in">
              <p className="text-parchment font-bold text-base sm:text-lg font-malayalam flex items-center justify-center gap-2">
                <span>⚖️</span>
                <span>ഇരു കക്ഷികളും ഹാജരായി! കോടതി നടപടികൾ ആരംഭിക്കാം.</span>
              </p>
              <p className="text-xs text-parchment/75 mt-1 font-body">
                Both parties are now present in the Waiting Room. The courtroom session is ready to commence.
              </p>
            </div>
          ) : (
            <div className="bg-amber-950/60 border border-amber-500/50 rounded-panel p-4 text-center">
              <p className="text-amber-200 font-bold text-sm sm:text-base font-malayalam flex items-center justify-center gap-2">
                <span>⏳</span>
                <span>പ്രതി ഈ കേസ് കോഡ് ഉപയോഗിച്ച് ഹാജരാകാൻ കാത്തിരിക്കുന്നു.</span>
              </p>
              <p className="text-xs text-parchment/70 mt-1 font-body">
                Share Case Code <strong className="text-brass font-mono tracking-widest">{caseData.case_code}</strong> with {caseData.defendant || 'the defendant'}.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="sm:w-1/3 py-3.5 px-4 rounded-panel font-display font-bold tracking-wider text-sm uppercase bg-[#341d14] text-parchment/90 border border-leather/70 hover:bg-[#45271b] hover:border-maroon transition shadow-panel active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Court Entrance</span>
            </button>

            <button
              type="button"
              onClick={handleProceedToCourtroom}
              disabled={!defendantJoined}
              className={`sm:w-2/3 py-3.5 px-6 rounded-panel font-display font-extrabold tracking-wider text-sm sm:text-base uppercase transition shadow-panel active:scale-[0.98] flex items-center justify-center gap-2.5 ${
                defendantJoined
                  ? 'bg-gradient-to-b from-brass-light via-brass to-brass-dark text-[#2b1a0a] border border-brass-light/70 hover:brightness-105 cursor-pointer shadow-[0_0_20px_rgba(224,185,92,0.4)]'
                  : 'bg-wood-dark/60 text-parchment/40 border border-wood-grain cursor-not-allowed'
              }`}
            >
              <span>{defendantJoined ? 'Enter Court Room (കോടതിയിൽ കയറുക)' : 'Waiting for Defendant...'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </WoodPanel>
      </div>
    </BlurredHero>
  );
}
