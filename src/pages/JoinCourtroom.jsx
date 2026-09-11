import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BlurredHero from '../components/BlurredHero';
import WoodPanel from '../components/WoodPanel';
import ParchmentPlaque from '../components/ParchmentPlaque';
import Button from '../components/Button';
import Seal from '../components/Seal';
import { joinCase } from '../lib/api';

export default function JoinCourtroom() {
  const navigate = useNavigate();
  const [defendantJoinedName, setDefendantJoinedName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCodeChange = (e) => {
    const uppercaseVal = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(uppercaseVal);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!defendantJoinedName.trim() || !code.trim()) {
      setError('Please enter your name and case code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const caseData = await joinCase({ code, defendantJoinedName });
      navigate('/courtroom', { state: { caseData, role: 'defendant' } });
    } catch (err) {
      setError(err.message || 'Case not found. Check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = defendantJoinedName.trim().length > 0 && code.trim().length === 6;

  return (
    <BlurredHero>
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center mb-6">
          <Seal size={54} className="mb-2" />
          <ParchmentPlaque className="inline-block text-center px-6 py-2">
            <h2 className="text-2xl font-bold tracking-wide">കോടതിയിൽ ഹാജരാകുക / JOIN COURT ROOM</h2>
          </ParchmentPlaque>
        </div>

        <WoodPanel className={error ? 'border-maroon shadow-[0_0_20px_rgba(122,32,32,0.8)] transition-all' : ''}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div className="bg-maroon/90 border-2 border-red-500 text-parchment p-3.5 rounded text-sm text-center font-bold tracking-wide shadow-md animate-pulse">
                ❌ {error}
              </div>
            )}

            <div>
              <label className="block text-parchment font-display font-semibold mb-2 text-sm uppercase tracking-wider">
                Your Name (നിങ്ങളുടെ പേര്)
              </label>
              <input
                type="text"
                value={defendantJoinedName}
                onChange={(e) => setDefendantJoinedName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full bg-wood-dark/80 border border-wood-grain rounded p-3 text-parchment placeholder-parchment/40 focus:outline-none focus:border-brass focus:ring-1 focus:ring-brass transition font-body"
                required
              />
            </div>

            <div>
              <label className="block text-parchment font-display font-semibold mb-2 text-sm uppercase tracking-wider">
                Case Code (കേസ് കോഡ്)
              </label>
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                placeholder="6-LETTER CODE"
                maxLength={6}
                className="w-full bg-wood-dark/80 border border-wood-grain rounded p-3.5 text-center text-2xl font-mono tracking-[0.3em] uppercase text-brass placeholder-parchment/30 focus:outline-none focus:border-brass focus:ring-1 focus:ring-brass transition font-bold"
                required
              />
              <p className="text-xs text-parchment/60 mt-1 text-center font-body">
                Enter the 6-character code sent by the complainant.
              </p>
            </div>

            <div className="flex gap-4 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/')}
                className="w-1/3"
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!isFormValid || loading}
                className="w-2/3"
              >
                {loading ? 'Verifying Summons...' : 'Enter Court Room'}
              </Button>
            </div>
          </form>
        </WoodPanel>
      </div>
    </BlurredHero>
  );
}
