import { useLocation, useNavigate } from 'react-router-dom';
import BlurredHero from '../components/BlurredHero';
import WoodPanel from '../components/WoodPanel';
import ParchmentPlaque from '../components/ParchmentPlaque';
import Seal from '../components/Seal';
import Button from '../components/Button';

export default function Courtroom() {
  const location = useLocation();
  const navigate = useNavigate();
  const caseData = location.state?.caseData;
  const role = location.state?.role || 'party';

  if (!caseData) {
    return (
      <BlurredHero>
        <WoodPanel className="max-w-md text-center">
          <Seal size={60} className="mb-4" />
          <h2 className="text-2xl font-bold text-brass mb-3">No Active Case Found</h2>
          <p className="text-parchment/80 font-body mb-6">
            You must file a case or enter a valid case code to access the courtroom session.
          </p>
          <Button onClick={() => navigate('/')} variant="primary" className="w-full">
            Return to Court Entrance
          </Button>
        </WoodPanel>
      </BlurredHero>
    );
  }

  return (
    <BlurredHero>
      <div className="w-full max-w-2xl mx-auto text-center space-y-6">
        <div className="animate-fade-in">
          <Seal size={70} className="mb-2" />
          <ParchmentPlaque className="inline-block px-8 py-3">
            <h1 className="text-3xl font-extrabold tracking-wider">
              കോടതി നടപടികൾ ആരംഭിച്ചു!
            </h1>
            <p className="text-sm font-semibold tracking-widest text-maroon/80 uppercase mt-0.5">
              COURT IS NOW IN SESSION
            </p>
          </ParchmentPlaque>
        </div>

        <WoodPanel className="text-left space-y-6 animate-scale-in">
          <div className="flex items-center justify-between border-b border-wood-grain pb-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-brass font-bold block">
                CASE DOCKET NO.
              </span>
              <span className="font-mono text-2xl font-bold text-parchment tracking-widest">
                #{caseData.code}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase tracking-widest text-brass font-bold block">
                STATUS
              </span>
              <span
                className={`inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                  caseData.status === 'joined'
                    ? 'bg-green-900/80 text-green-200 border border-green-600'
                    : 'bg-amber-900/80 text-amber-200 border border-amber-600'
                }`}
              >
                {caseData.status === 'joined' ? '● BOTH PARTIES PRESENT' : '⏳ WAITING FOR DEFENDANT'}
              </span>
            </div>
          </div>

          <div className="bg-wood-dark/60 rounded p-4 border border-wood-grain">
            <h3 className="text-xs uppercase tracking-widest text-brass font-bold mb-2">
              CASE TITLE & DISPUTE
            </h3>
            <p className="text-xl font-bold text-parchment font-malayalam leading-relaxed">
              "{caseData.case_title}"
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-wood-dark/60 rounded p-4 border border-wood-grain">
              <span className="text-xs uppercase tracking-widest text-brass font-bold block mb-1">
                വാദി (COMPLAINANT)
              </span>
              <span className="text-lg font-semibold text-parchment">
                {caseData.complainant_name}
              </span>
              {role === 'complainant' && (
                <span className="ml-2 text-xs bg-brass/20 text-brass px-2 py-0.5 rounded border border-brass/30 font-bold">
                  (YOU)
                </span>
              )}
            </div>

            <div className="bg-wood-dark/60 rounded p-4 border border-wood-grain">
              <span className="text-xs uppercase tracking-widest text-brass font-bold block mb-1">
                പ്രതി (DEFENDANT)
              </span>
              <span className="text-lg font-semibold text-parchment">
                {caseData.defendant_joined_name || caseData.defendant_name}
              </span>
              {role === 'defendant' && (
                <span className="ml-2 text-xs bg-brass/20 text-brass px-2 py-0.5 rounded border border-brass/30 font-bold">
                  (YOU)
                </span>
              )}
            </div>
          </div>

          <ParchmentPlaque rotate={false} className="text-center py-4 bg-parchment/95">
            <p className="text-maroon font-bold text-base font-malayalam">
              ⚖️ ഇരു കക്ഷികളും കോടതി മുറിയിൽ പ്രവേശിച്ചു. (Both parties reached the Court Room).
            </p>
            <p className="text-xs text-maroon/70 mt-1 font-body">
              Phase 1 Milestone Complete: Landing → File Case → Join Courtroom → Enter Courtroom Action.
            </p>
          </ParchmentPlaque>

          <div className="pt-2 flex justify-center">
            <Button onClick={() => navigate('/')} variant="secondary" className="px-6 py-2 text-sm">
              Exit to Court Entrance
            </Button>
          </div>
        </WoodPanel>
      </div>
    </BlurredHero>
  );
}
