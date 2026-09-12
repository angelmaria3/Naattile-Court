import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BlurredHero from '../components/BlurredHero';
import WoodPanel from '../components/WoodPanel';
import ParchmentPlaque from '../components/ParchmentPlaque';
import Button from '../components/Button';
import CaseCodeDisplay from '../components/CaseCodeDisplay';
import Seal from '../components/Seal';
import { fileCase } from '../lib/api';
import { supabase } from '../lib/supabase';

export default function FileCase() {
  const navigate = useNavigate();
  const [complainantName, setComplainantName] = useState('');
  const [defendantName, setDefendantName] = useState('');
  const [caseTitle, setCaseTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filedCase, setFiledCase] = useState(null);

  // When a case is filed, monitor in real time for when the defendant enters the code
  useEffect(() => {
    if (!filedCase?.code) return;
    const upperCode = filedCase.code.toUpperCase();

    const checkJoined = (record) => {
      // If defendant joined, status changes to 'waiting' or 'joined'
      if (record && (record.status === 'waiting' || record.status === 'joined' || record.defendant_token)) {
        navigate(`/waiting-room/${upperCode}`, { 
          state: { caseData: record, role: 'complainant' } 
        });
      }
    };

    // 1. Supabase Realtime channel
    const channel = supabase
      .channel(`file_case_listener_${upperCode}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cases', filter: `case_code=eq.${upperCode}` },
        (payload) => {
          if (payload.new) {
            checkJoined(payload.new);
          }
        }
      )
      .subscribe();

    // 2. Resilient polling fallback every 1.5 seconds
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('cases')
          .select('*')
          .eq('case_code', upperCode)
          .single();
        if (data) {
          checkJoined(data);
        }
      } catch (err) {
        // silent polling catch
      }
    }, 1500);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [filedCase, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!complainantName.trim() || !defendantName.trim() || !caseTitle.trim()) {
      setError('All court fields are required to file a formal case!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await fileCase({ complainantName, defendantName, caseTitle });
      setFiledCase(result);
    } catch (err) {
      setError(err.message || 'Could not file case. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterWaitingRoom = () => {
    if (filedCase) {
      navigate(`/waiting-room/${filedCase.code}`, { state: { caseData: filedCase, role: 'complainant' } });
    }
  };

  return (
    <BlurredHero>
      <div className="w-full max-w-xl mx-auto">
        <div className="text-center mb-6">
          <Seal size={54} className="mb-2" />
          <ParchmentPlaque className="inline-block text-center px-6 py-2">
            <h2 className="text-2xl font-bold tracking-wide">കേസ് രജിസ്ട്രേഷൻ / FILE A CASE</h2>
          </ParchmentPlaque>
        </div>

        <WoodPanel>
          {filedCase ? (
            <CaseCodeDisplay
              code={filedCase.code}
              defendantName={filedCase.defendant_name}
              onEnterCourtroom={handleEnterWaitingRoom}
            />
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {error && (
                <div className="bg-maroon/80 border border-red-500 text-parchment p-3 rounded text-sm text-center font-semibold animate-pulse">
                  ⚠️ {error}
                </div>
              )}

              <div>
                <label className="block text-parchment font-display font-semibold mb-2 text-sm uppercase tracking-wider">
                  Your Name (വാദി / Complainant)
                </label>
                <input
                  type="text"
                  value={complainantName}
                  onChange={(e) => setComplainantName(e.target.value)}
                  placeholder="e.g. Dasan"
                  className="w-full bg-wood-dark/80 border border-wood-grain rounded p-3 text-parchment placeholder-parchment/40 focus:outline-none focus:border-brass focus:ring-1 focus:ring-brass transition font-body"
                  required
                />
              </div>

              <div>
                <label className="block text-parchment font-display font-semibold mb-2 text-sm uppercase tracking-wider">
                  Defendant's Name (പ്രതി / Defendant)
                </label>
                <input
                  type="text"
                  value={defendantName}
                  onChange={(e) => setDefendantName(e.target.value)}
                  placeholder="e.g. Vijayan"
                  className="w-full bg-wood-dark/80 border border-wood-grain rounded p-3 text-parchment placeholder-parchment/40 focus:outline-none focus:border-brass focus:ring-1 focus:ring-brass transition font-body"
                  required
                />
              </div>

              <div>
                <label className="block text-parchment font-display font-semibold mb-2 text-sm uppercase tracking-wider">
                  What's the case about? (കേസ് വിഷയം)
                </label>
                <textarea
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  placeholder="What's this even about? e.g. Ate my last Porotta without asking!"
                  rows={3}
                  className="w-full bg-wood-dark/80 border border-wood-grain rounded p-3 text-parchment placeholder-parchment/40 focus:outline-none focus:border-brass focus:ring-1 focus:ring-brass transition font-body resize-none"
                  required
                />
              </div>

              <div className="flex gap-4 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/')}
                  className="w-1/3"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="w-2/3"
                >
                  {loading ? 'Filing Case...' : 'File the Case'}
                </Button>
              </div>
            </form>
          )}
        </WoodPanel>
      </div>
    </BlurredHero>
  );
}
