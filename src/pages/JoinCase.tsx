import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BlurredHero from '../components/BlurredHero';
import WoodPanel from '../components/WoodPanel';
import ParchmentPlaque from '../components/ParchmentPlaque';
import Button from '../components/Button';
import Seal from '../components/Seal';
import { supabase } from '../lib/supabase';

export default function JoinCase() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim() || !name.trim()) {
      setError('Both fields are required to enter the courtroom!');
      return;
    }

    setLoading(true);
    setError('');

    const upperCode = code.trim().toUpperCase();

    try {
      const { data, error: fetchError } = await supabase
        .from('cases')
        .select('*')
        .eq('case_code', upperCode)
        .single();

      if (fetchError || !data) {
        setError('No case found with that code.');
        setLoading(false);
        return;
      }

      // Case ALREADY has a defendant → this person joins as jury, no DB write needed
      if (data.status === 'joined' || data.defendant) {
        const caseData = {
          code: data.case_code,
          defendant_name: data.defendant,
          defendant_joined_name: data.defendant,
          complainant_name: data.plaintiff,
          case_title: data.complaint,
          ...data,
        };
        navigate('/courtroom', {
          state: { caseData, role: 'jury', voterName: name.trim() },
        });
        return;
      }

      // No defendant yet → this person becomes the defendant
      const { data: updatedData, error: updateError } = await supabase
        .from('cases')
        .update({ defendant: name.trim(), status: 'joined' })
        .eq('case_code', upperCode)
        .select()
        .single();

      if (updateError || !updatedData) {
        setError('Could not join the case. Please try again.');
        setLoading(false);
        return;
      }

      const caseData = {
        code: updatedData.case_code,
        defendant_name: updatedData.defendant,
        defendant_joined_name: name.trim(),
        complainant_name: updatedData.plaintiff,
        case_title: updatedData.complaint,
        ...updatedData,
      };

      navigate('/courtroom', { state: { caseData, role: 'defendant' } });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BlurredHero>
      <div className="w-full max-w-xl mx-auto">
        <div className="text-center mb-6">
          <Seal size={54} className="mb-2" />
          <ParchmentPlaque className="inline-block text-center px-6 py-2">
            <h2 className="text-2xl font-bold tracking-wide">കോടതിയിൽ കയറുക / JOIN A CASE</h2>
          </ParchmentPlaque>
        </div>

        <WoodPanel>
          <form onSubmit={handleJoin} className="flex flex-col gap-5">
            {error && (
              <div className="bg-maroon/80 border border-red-500 text-parchment p-3 rounded text-sm text-center font-semibold animate-pulse">
                ⚠️ {error}
              </div>
            )}

            <div>
              <label className="block text-parchment font-display font-semibold mb-2 text-sm uppercase tracking-wider">
                Case Code (കേസ് കോഡ്)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. A1B2C3"
                className="w-full bg-wood-dark/80 border border-wood-grain rounded p-3 text-parchment placeholder-parchment/40 focus:outline-none focus:border-brass focus:ring-1 focus:ring-brass transition font-body uppercase tracking-widest text-center text-lg"
                required
              />
            </div>

            <div>
              <label className="block text-parchment font-display font-semibold mb-2 text-sm uppercase tracking-wider">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vijayan"
                className="w-full bg-wood-dark/80 border border-wood-grain rounded p-3 text-parchment placeholder-parchment/40 focus:outline-none focus:border-brass focus:ring-1 focus:ring-brass transition font-body"
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
                onClick={() => {}}
                disabled={loading}
                className="w-2/3"
              >
                {loading ? 'Joining Case...' : 'Enter Courtroom 🚪'}
              </Button>
            </div>
          </form>
        </WoodPanel>
      </div>
    </BlurredHero>
  );
}