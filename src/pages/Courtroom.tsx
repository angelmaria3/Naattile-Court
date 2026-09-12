import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Seal from '../components/Seal'
import ParchmentPlaque from '../components/ParchmentPlaque'
import { 
  Gavel, 
  Scale, 
  FileText, 
  BookOpen, 
  Users, 
  LogOut,
  Send,
  MessageSquare,
  Sparkles
} from 'lucide-react'
import './courtroom.css'

const COMPLAINANT_WITNESSES = [
  {
    name: 'Ammachi',
    role: 'ബാൽക്കണി സാക്ഷി (Balcony)',
    tagline: "Knows everything. Especially what she didn't see.",
    lines: [
      'I saw the whole thing from the balcony, and let me tell you, it was scandalous.',
      'In my time, this would have been settled with a slipper, not a court case.',
      'I did not see anything, but I have a strong feeling about who is wrong.'
    ]
  },
  {
    name: 'College Friend',
    role: 'റൂംമേറ്റ് (Roommate)',
    tagline: 'Neutral, but definitely leaning towards complainant.',
    lines: [
      "Honestly? Both are dramatic, but the complainant has a very genuine point here.",
      'I was not there, but this sounds exactly like something the defendant would do.',
      "I'm not taking sides, but if I had to... okay maybe I'm taking the complainant's side."
    ]
  }
]

const DEFENDANT_WITNESSES = [
  {
    name: 'Auto Chettan',
    role: 'ഓട്ടോ ചേട്ടൻ (Auto Driver)',
    tagline: 'Has an opinion on everything. Meter running.',
    lines: [
      'I dropped the defendant home that day, very innocent and calm person!',
      'This is a simple misunderstanding. Compensation and apology. Case closed.',
      'People these days fight over small things. The defendant is being framed.'
    ]
  },
  {
    name: 'Canteen Chettan',
    role: 'കാന്റീൻ ചേട്ടൻ (Canteen)',
    tagline: 'Saw something. Burnt the dosa because of shouting.',
    lines: [
      'They were arguing near the counter, the defendant was completely polite!',
      'Both of them owe me money for tea, but defendant paid half yesterday.',
      'I only heard shouting. The defendant was just defending their lunch box.'
    ]
  }
]

const LAW_BOOK: Record<string, { section: string; title: string; punishment: string }[]> = {
  Roommate: [
    { section: 'Section 420-P', title: 'Unauthorized Snack Consumption (പൊറോട്ട ചതി)', punishment: 'Replace item + 1 special chaya' },
    { section: 'Section 304-F', title: 'Minor Household Theft (വാഷിംഗ് പൗഡർ മോഷണം)', punishment: 'Written apology on group chat' },
    { section: 'Section 101-C', title: 'Shared Space Violation (മുറി വൃത്തികേടാക്കൽ)', punishment: 'Clean common area for a week' }
  ],
  Family: [
    { section: 'Section 210-A', title: 'Unsolicited Advice (കാര്യമില്ലാത്ത ഉപദേശം)', punishment: 'One favour owed, no questions asked' },
    { section: 'Section 305-M', title: 'Comparison to Cousin (കസിൻ താരതമ്യം)', punishment: 'Public retraction at next family function' },
    { section: 'Section 118-H', title: 'Broken Promise (വാക്ക് മാറ്റം)', punishment: 'Treat whole family to biryani' }
  ],
  Friends: [
    { section: 'Section 220-B', title: 'Group Chat Negligence (മെസ്സേജ് സീൻ ആക്കൽ)', punishment: 'Public apology sticker in the group' },
    { section: 'Section 330-L', title: 'Plan Cancellation, Late Notice (മുങ്ങൽ)', punishment: 'Host the next outing with full bill' },
    { section: 'Section 999-U', title: 'General Useless Behaviour (വെറുപ്പിക്കൽ)', punishment: "As per Hon. Ammachi Judge's mood" }
  ],
  Money: [
    { section: 'Section 501-D', title: 'Unpaid Small Debt (കടം മറക്കൽ)', punishment: 'Repay with interest (two hot samosas)' },
    { section: 'Section 502-S', title: 'Split Bill Discrepancy (ബില്ല് മുക്കൽ)', punishment: 'Settle in full publicly via UPI' },
    { section: 'Section 999-U', title: 'General Useless Behaviour (വെറുപ്പിക്കൽ)', punishment: "As per judge's mood" }
  ],
  Love: [
    { section: 'Section 601-R', title: 'Left on Read (Seen അടിച്ചു വിടൽ)', punishment: 'Immediate 500-word sincere voice note' },
    { section: 'Section 602-J', title: 'Jealousy Without Basis (വെറുതെ സംശയം)', punishment: 'Public Instagram reassurance story' },
    { section: 'Section 101-C', title: 'Emotional Damage (മനസ്സ് തകർക്കൽ)', punishment: 'Treat to favorite dessert immediately' }
  ]
}

export default function Courtroom() {
  const { caseId } = useParams()
  const navigate = useNavigate()

  const [caseData, setCaseData] = useState<any>(null)
  const [evidenceList, setEvidenceList] = useState<any[]>([])
  const [witnessList, setWitnessList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Roles
  const [isPlaintiff, setIsPlaintiff] = useState(false)
  const [isDefendant, setIsDefendant] = useState(false)

  // Complainant Evidence Form
  const [plaintiffEvidenceText, setPlaintiffEvidenceText] = useState('')
  const [plaintiffEvidenceFile, setPlaintiffEvidenceFile] = useState<File | null>(null)
  const [savingPlaintiffEvidence, setSavingPlaintiffEvidence] = useState(false)

  // Defendant Statement Form
  const [defendantStatementInput, setDefendantStatementInput] = useState('')
  const [savingDefenseStatement, setSavingDefenseStatement] = useState(false)

  // Defendant Counter-Evidence Form
  const [defendantEvidenceText, setDefendantEvidenceText] = useState('')
  const [defendantEvidenceFile, setDefendantEvidenceFile] = useState<File | null>(null)
  const [savingDefendantEvidence, setSavingDefendantEvidence] = useState(false)

  // Witnesses & Jury
  const [summoning, setSummoning] = useState<string | null>(null)
  const [guiltyVotes, setGuiltyVotes] = useState(0)
  const [notGuiltyVotes, setNotGuiltyVotes] = useState(0)
  const [hasVoted, setHasVoted] = useState(false)

  // Verdict
  const [verdict, setVerdict] = useState<any>(null)
  const [verdictLoading, setVerdictLoading] = useState(false)
  const [showVerdictSplash, setShowVerdictSplash] = useState(false)
  const [showLawBook, setShowLawBook] = useState(false)
  const splashTimeoutRef = useRef<any>(null)

  const triggerVerdictSplash = () => {
    if (splashTimeoutRef.current) {
      clearTimeout(splashTimeoutRef.current)
    }
    setShowVerdictSplash(true)
    splashTimeoutRef.current = setTimeout(() => {
      setShowVerdictSplash(false)
    }, 2000)
  }

  useEffect(() => {
    return () => {
      if (splashTimeoutRef.current) {
        clearTimeout(splashTimeoutRef.current)
      }
    }
  }, [])

  const proceedingsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let channel: any

    const run = async () => {
      if (!caseId) return
      const upperCode = caseId.trim().toUpperCase()

      const { data: c, error } = await supabase
        .from('cases')
        .select('*')
        .eq('case_code', upperCode)
        .single()

      if (error || !c) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setCaseData(c)

      const creatorToken = localStorage.getItem(`case_${upperCode}_token`)
      const defToken = localStorage.getItem(`case_${upperCode}_defendant_token`)
      const defName = localStorage.getItem(`case_${upperCode}_defendant_name`)
      
      setIsPlaintiff(Boolean(creatorToken && creatorToken === c.creator_token))
      setIsDefendant(Boolean((defToken && defToken === c.defendant_token) || (defName && defName === c.defendant)))
      setHasVoted(localStorage.getItem(`case_${upperCode}_voted`) === 'true')

      await Promise.all([loadEvidence(c.id), loadWitnesses(c.id), loadVotes(c.id)])
      setLoading(false)

      channel = supabase
        .channel(`courtroom_live_${c.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'evidence', filter: `case_id=eq.${c.id}` }, () => {
          loadEvidence(c.id)
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'witness_statements', filter: `case_id=eq.${c.id}` }, () => {
          loadWitnesses(c.id)
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `case_id=eq.${c.id}` }, () => {
          loadVotes(c.id)
        })
        .subscribe()
    }

    run()

    const interval = setInterval(() => {
      if (caseData?.id) {
        loadEvidence(caseData.id)
        loadWitnesses(caseData.id)
        loadVotes(caseData.id)
      }
    }, 2000)

    return () => {
      if (channel) supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [caseId, caseData?.id])

  useEffect(() => {
    proceedingsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [witnessList, evidenceList])

  const loadEvidence = async (caseUuid: string) => {
    const { data } = await supabase
      .from('evidence')
      .select('*')
      .eq('case_id', caseUuid)
      .order('created_at', { ascending: true })
    setEvidenceList(data ?? [])
  }

  const loadWitnesses = async (caseUuid: string) => {
    const { data } = await supabase
      .from('witness_statements')
      .select('*')
      .eq('case_id', caseUuid)
      .order('created_at', { ascending: true })
    setWitnessList(data ?? [])
  }

  const loadVotes = async (caseUuid: string) => {
    const { data } = await supabase
      .from('votes')
      .select('vote')
      .eq('case_id', caseUuid)
    setGuiltyVotes((data ?? []).filter(v => v.vote === 'guilty').length)
    setNotGuiltyVotes((data ?? []).filter(v => v.vote === 'not_guilty').length)
  }

  const handleAddPlaintiffEvidence = async () => {
    if (!plaintiffEvidenceText.trim() && !plaintiffEvidenceFile) return
    setSavingPlaintiffEvidence(true)

    let fileUrl: string | null = null

    if (plaintiffEvidenceFile) {
      const filePath = `${caseData.id}/${Date.now()}-${plaintiffEvidenceFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('evidence-files')
        .upload(filePath, plaintiffEvidenceFile)

      if (uploadError) {
        alert('File upload failed: ' + uploadError.message)
        setSavingPlaintiffEvidence(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('evidence-files')
        .getPublicUrl(filePath)
      fileUrl = urlData.publicUrl
    }

    await supabase.from('evidence').insert({
      case_id: caseData.id,
      description: plaintiffEvidenceText.trim() || null,
      file_url: fileUrl,
      submitted_by: 'plaintiff'
    })

    setPlaintiffEvidenceText('')
    setPlaintiffEvidenceFile(null)
    await loadEvidence(caseData.id)
    setSavingPlaintiffEvidence(false)
  }

  const handleSaveDefenseStatement = async () => {
    if (!defendantStatementInput.trim()) return
    setSavingDefenseStatement(true)

    const existing = evidenceList.find(e => e.submitted_by === 'defendant_statement')

    if (existing) {
      await supabase
        .from('evidence')
        .update({ description: defendantStatementInput.trim() })
        .eq('id', existing.id)
    } else {
      await supabase.from('evidence').insert({
        case_id: caseData.id,
        description: defendantStatementInput.trim(),
        submitted_by: 'defendant_statement'
      })
    }

    localStorage.setItem(`case_${caseId}_defendant_statement`, defendantStatementInput.trim())
    await loadEvidence(caseData.id)
    setSavingDefenseStatement(false)
    setDefendantStatementInput('')
  }

  const handleAddDefendantEvidence = async () => {
    if (!defendantEvidenceText.trim() && !defendantEvidenceFile) return
    setSavingDefendantEvidence(true)

    let fileUrl: string | null = null

    if (defendantEvidenceFile) {
      const filePath = `${caseData.id}/${Date.now()}-def-${defendantEvidenceFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('evidence-files')
        .upload(filePath, defendantEvidenceFile)

      if (uploadError) {
        alert('File upload failed: ' + uploadError.message)
        setSavingDefendantEvidence(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('evidence-files')
        .getPublicUrl(filePath)
      fileUrl = urlData.publicUrl
    }

    await supabase.from('evidence').insert({
      case_id: caseData.id,
      description: defendantEvidenceText.trim() || null,
      file_url: fileUrl,
      submitted_by: 'defendant'
    })

    setDefendantEvidenceText('')
    setDefendantEvidenceFile(null)
    await loadEvidence(caseData.id)
    setSavingDefendantEvidence(false)
  }

  const handleSummon = async (persona: { name: string; lines: string[] }, side: 'plaintiff' | 'defendant') => {
    setSummoning(persona.name)
    const line = persona.lines[Math.floor(Math.random() * persona.lines.length)]
    
    await supabase.from('witness_statements').insert({
      case_id: caseData.id,
      witness_name: `${persona.name} (${side === 'plaintiff' ? 'വാദി' : 'പ്രതി'})`,
      statement: line
    })

    await loadWitnesses(caseData.id)
    setSummoning(null)
  }

  const handleVote = async (vote: 'guilty' | 'not_guilty') => {
    if (hasVoted) return
    await supabase.from('votes').insert({ case_id: caseData.id, vote })
    localStorage.setItem(`case_${caseId}_voted`, 'true')
    setHasVoted(true)
    await loadVotes(caseData.id)
  }

  const getVerdict = async () => {
    setVerdictLoading(true)

    const defendantStatement = evidenceList.find(e => e.submitted_by === 'defendant_statement')?.description 
      || localStorage.getItem(`case_${caseId}_defendant_statement`) 
      || 'No formal defense statement submitted.'

    const totalVotes = guiltyVotes + notGuiltyVotes
    const guiltyPct = totalVotes > 0 ? Math.round((guiltyVotes / totalVotes) * 100) : 50

    const plaintiffEvidence = evidenceList
      .filter(e => e.submitted_by !== 'defendant' && e.submitted_by !== 'defendant_statement')
      .map(e => e.description || 'Photo/Document Evidence')

    const defendantEvidence = evidenceList
      .filter(e => e.submitted_by === 'defendant')
      .map(e => e.description || 'Counter-Evidence Photo/Doc')

    try {
      const res = await fetch('https://fciltngewiorcbhaofsk.supabase.co/functions/v1/judge-verdict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sb_publishable_obQzJtwbQ78yJ9aRBP8sLg_s-dMNd9b'
        },
        body: JSON.stringify({
          complaint: `[PLAINTIFF ${caseData.plaintiff} STATEMENT]: "${caseData.complaint}"\n[DEFENDANT ${caseData.defendant} DEFENSE]: "${defendantStatement}"`,
          plaintiff: caseData.plaintiff,
          defendant: caseData.defendant || 'Unknown',
          evidence: [
            ...plaintiffEvidence.map(e => `[Complainant Evidence]: ${e}`),
            ...defendantEvidence.map(e => `[Defendant Evidence]: ${e}`),
            ...witnessList.map(w => `[Witness ${w.witness_name}]: ${w.statement}`)
          ].join('\n') || 'Oral arguments only',
          jury_percent: guiltyPct,
          juryGuiltyPercent: guiltyPct
        })
      })

      if (res.ok) {
        const v = await res.json()
        if (v && v.verdict) {
          setVerdict(v)
          setVerdictLoading(false)
          triggerVerdictSplash()
          return
        }
      }
      throw new Error('Fallback to local judge engine')
    } catch (err) {
      const isGuilty = guiltyPct >= 50
      const localVerdict = {
        verdict: isGuilty ? 'GUILTY (കുറ്റക്കാരൻ)' : 'NOT GUILTY (കുറ്റവിമുക്തൻ)',
        reasoning: isGuilty
          ? `Ende Ammachi! Having examined the complaint of ${caseData.plaintiff}, along with ${caseData.defendant}'s defense: "${defendantStatement.slice(0, 70)}...", and ${totalVotes} jury votes (${guiltyPct}% guilty), the court finds the accused fully guilty! Aiyyo, what kind of behavior is this!`
          : `Aiyyo kashtam! After hearing both sides, ${caseData.defendant}'s reasonable defense, and the witnesses gossip, this court rules there is reasonable doubt. The complainant is making a mountain out of a molehill!`,
        fictional_law: isGuilty
          ? 'Section 420-P of the Kerala Daily Porotta & Friendship Sharing Act'
          : 'Section 101-C of the Unnecessary House Drama Prevention Act',
        punishment: isGuilty
          ? `Accused (${caseData.defendant}) must apologize to ${caseData.plaintiff}, buy 2 hot parottas with beef/veg roast, and pour special chaya.`
          : `Complainant (${caseData.plaintiff}) must buy ${caseData.defendant} a cold lime juice and promise not to drag silly matters to court again.`
      }

      setVerdict(localVerdict)
      setVerdictLoading(false)
      triggerVerdictSplash()
    }
  }

  const handleFinalVerdictClick = () => {
    if (verdict) {
      triggerVerdictSplash()
      return
    }
    getVerdict()
  }

  // Filtered lists
  const plaintiffEvidence = evidenceList.filter(e => e.submitted_by !== 'defendant' && e.submitted_by !== 'defendant_statement')
  const defendantEvidence = evidenceList.filter(e => e.submitted_by === 'defendant')
  const currentDefenseStatement = evidenceList.find(e => e.submitted_by === 'defendant_statement')?.description 
    || localStorage.getItem(`case_${caseId}_defendant_statement`) 
    || ''

  const complainantWitnesses = witnessList.filter(w => w.witness_name?.includes('വാദി'))
  const defendantWitnesses = witnessList.filter(w => w.witness_name?.includes('പ്രതി'))

  if (notFound) {
    return (
      <div className="courtroom-viewport flex items-center justify-center p-4">
        <div className="courtroom-box-center max-w-md text-center py-8">
          <Seal size={54} className="mb-3 mx-auto" />
          <h2 className="text-2xl font-bold text-red-300 mb-2">Notice of Dismissal</h2>
          <p className="text-white/90 font-body text-sm mb-6">❌ Case docket #{caseId} not found in court records.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded font-display font-bold uppercase bg-gradient-to-b from-[#ffd778] via-[#e4b248] to-[#be8624] text-[#1c0e04] shadow cursor-pointer"
          >
            Return to Entrance
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="courtroom-viewport flex items-center justify-center p-4">
        <div className="courtroom-box-center max-w-md text-center py-10">
          <Seal size={60} className="mb-4 mx-auto animate-spin-slow" />
          <h2 className="text-xl font-display font-black text-[#ffdf79] mb-2">കോടതി മുറി തയ്യാറാക്കുന്നു...</h2>
          <p className="text-white/80 font-body text-sm">Opening docket #{caseId}...</p>
        </div>
      </div>
    )
  }

  const totalVotes = guiltyVotes + notGuiltyVotes
  const guiltyPct = totalVotes > 0 ? Math.round((guiltyVotes / totalVotes) * 100) : 50
  const outcomeIsGuilty = verdict?.verdict?.toLowerCase().includes('guilty') && !verdict?.verdict?.toLowerCase().includes('not guilty')
  const laws = LAW_BOOK[caseData?.category] ?? LAW_BOOK.Roommate
  const filedDate = caseData?.created_at
    ? new Date(caseData.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Recently'

  return (
    <div className="courtroom-viewport">
      {/* 2-SECOND CENTER VERDICT SPLASH OVERLAY */}
      {showVerdictSplash && verdict && (
        <div 
          id="center-verdict-splash"
          style={{ zIndex: 99999 }}
          className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md pointer-events-none transition-all duration-300"
        >
          <div className={`relative p-6 sm:p-10 rounded-2xl border-4 text-center max-w-lg w-[92%] sm:w-full mx-4 shadow-2xl verdict-stamp-animation ${
            outcomeIsGuilty
              ? 'bg-gradient-to-b from-[#421010] via-[#250909] to-[#120303] border-red-500 shadow-[0_0_80px_rgba(239,68,68,0.85)]'
              : 'bg-gradient-to-b from-[#0e381b] via-[#082210] to-[#041208] border-green-500 shadow-[0_0_80px_rgba(34,197,94,0.85)]'
          }`}>
            <div className="rivet-tl" />
            <div className="rivet-tr" />
            <div className="rivet-bl" />
            <div className="rivet-br" />

            {/* Seal & Badge */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">⚖️</span>
              <span className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.25em] uppercase text-[#ffd778]">
                അന്തിമ വിധി പ്രഖ്യാപനം • FINAL VERDICT
              </span>
              <span className="text-2xl">⚖️</span>
            </div>

            {/* Big Stamp Verdict */}
            <div className="py-2">
              <div className={`text-5xl sm:text-7xl font-black font-display tracking-widest uppercase filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] ${
                outcomeIsGuilty ? 'text-red-500' : 'text-green-400'
              }`}>
                {outcomeIsGuilty ? 'GUILTY' : 'NOT GUILTY'}
              </div>

              <div className="text-3xl sm:text-4xl font-black font-malayalam text-white mt-1 drop-shadow-md">
                {outcomeIsGuilty ? 'കുറ്റക്കാരൻ!' : 'കുറ്റവിമുക്തൻ!'}
              </div>
            </div>

            {/* Accused & Case Subtext */}
            <div className="mt-3 pt-3 border-t border-white/20 text-xs sm:text-sm font-malayalam font-bold text-[#fffdf5]">
              <p>
                പ്രതി: <span className="text-[#ffd778] font-black">{caseData.defendant || 'Defendant'}</span> {outcomeIsGuilty ? 'കുറ്റക്കാരനാണെന്ന് കോടതി കണ്ടെത്തി!' : 'കുറ്റവിമുക്തനാണെന്ന് കോടതി വിധിച്ചു!'}
              </p>
            </div>

            {/* 2s Animated Countdown Bar */}
            <div className="mt-4 w-full bg-black/50 h-2 rounded-full overflow-hidden border border-white/20">
              <div className={`h-full verdict-countdown-bar ${outcomeIsGuilty ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-green-400 shadow-[0_0_10px_rgba(34,197,94,0.8)]'}`} />
            </div>
            <div className="text-[10px] font-mono text-white/60 tracking-wider uppercase mt-1">
              Displaying for 2s • 2 സെക്കൻഡ്
            </div>
          </div>
        </div>
      )}

      {/* Bright, Vibrant Courtroom Background Image */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          backgroundImage: "url('/hero-courtroom.jpg?v=3')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(3px) brightness(0.85) contrast(1.05)',
          transform: 'scale(1.03)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      {/* Light Warm Vignette */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(43,26,16,0.25), rgba(0,0,0,0.45))',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* Top Header Navigation */}
      <header className="courtroom-header">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <Seal size={30} />
          <span className="font-display font-black text-base text-[#ffdf79] tracking-wider drop-shadow-sm">
            നാട്ടിലെ COURT
          </span>
        </div>

        <div className="flex items-center gap-2 bg-[#4a2e18] border-2 border-[#e0b95c]/80 px-3.5 py-1 rounded shadow-sm text-xs">
          <span className="font-bold text-[#ffdf79]">DOCKET:</span>
          <span className="font-mono font-black text-white tracking-widest text-sm">#{caseData.case_code}</span>
          <span className="text-[#e0b95c]/50">|</span>
          <span className="text-white/90 font-mono text-[11px]">{filedDate}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLawBook(!showLawBook)}
            className="px-3 py-1 rounded text-xs font-display font-bold uppercase bg-[#5a381e] hover:bg-[#6e4425] text-[#ffdf79] border border-[#e0b95c] transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Law Book</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-3 py-1 rounded text-xs font-display font-bold uppercase bg-[#4a1c14] hover:bg-[#5f241a] text-white border border-red-500/50 transition flex items-center gap-1 cursor-pointer shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
        </div>
      </header>

      {/* Main Single-Screen 3-Box Arena */}
      <main className="courtroom-arena">
        
        {/* ========================================================= */}
        {/* BOX 1 (LEFT SIDE OF WINDOW): COMPLAINANT                  */}
        {/* ========================================================= */}
        <section className="courtroom-box-left">
          <div className="rivet-tl" />
          <div className="rivet-tr" />
          <div className="rivet-bl" />
          <div className="rivet-br" />

          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between border-b-2 border-[#a67432] pb-1.5 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">⚖️</span>
              <div>
                <h2 className="text-[11px] font-display font-black uppercase tracking-wider text-[#ffdf79]">
                  വാദി (COMPLAINANT)
                </h2>
                <p className="text-base font-black text-white font-display tracking-wide truncate max-w-[150px]">
                  {caseData.plaintiff}
                </p>
              </div>
            </div>
            {isPlaintiff && (
              <span className="text-[10px] bg-[#ffd778] text-[#241206] font-black px-2 py-0.5 rounded shadow-sm tracking-wider">
                YOU
              </span>
            )}
          </div>

          {/* Statement */}
          <div className="flex-shrink-0 mb-2">
            <span className="text-[10px] uppercase font-bold text-[#ffdf79] block mb-1">
              കുറ്റപത്രം (COMPLAINT STATEMENT)
            </span>
            <div className="bg-[#fffdf5] text-[#241206] p-2.5 rounded shadow-md border border-[#dfcca0] font-malayalam text-xs font-bold italic max-h-16 overflow-y-auto leading-relaxed custom-scroll">
              "{caseData.complaint}"
            </div>
          </div>

          {/* Evidence List */}
          <div className="flex-1 min-h-0 flex flex-col mb-2 overflow-hidden">
            <div className="flex items-center justify-between mb-1 flex-shrink-0">
              <span className="text-[11px] uppercase font-extrabold text-[#ffdf79] flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span>തെളിവുകൾ (PLAINTIFF EVIDENCE) ({plaintiffEvidence.length})</span>
              </span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 bg-[#3a2213] p-2 rounded border border-[#a67432]/70 custom-scroll">
              {plaintiffEvidence.length === 0 ? (
                <p className="text-xs text-white/50 italic p-1">No evidence submitted yet.</p>
              ) : (
                plaintiffEvidence.map((e) => (
                  <div key={e.id} className="bg-[#4a2e1a] p-2 rounded border border-[#a67432] text-xs text-white">
                    {e.file_url && (
                      <img src={e.file_url} alt="evidence" className="w-full h-16 object-cover rounded mb-1 border border-black/30" />
                    )}
                    <p className="font-body leading-tight text-white font-medium">{e.description || 'Photo/Document'}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Evidence Form */}
            <div className="flex-shrink-0 pt-2 space-y-1">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Describe evidence..."
                  value={plaintiffEvidenceText}
                  onChange={(e) => setPlaintiffEvidenceText(e.target.value)}
                  className="flex-1 bg-[#2e190d] border border-[#a67432] rounded px-2 py-1 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#ffd778]"
                />
                <label className="bg-[#5a381e] hover:bg-[#6e4425] border border-[#ffd778]/70 text-[#ffd778] text-xs font-bold px-2 py-1 rounded cursor-pointer flex items-center shadow-sm">
                  📎
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPlaintiffEvidenceFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={handleAddPlaintiffEvidence}
                  disabled={savingPlaintiffEvidence || (!plaintiffEvidenceText.trim() && !plaintiffEvidenceFile)}
                  className="bg-gradient-to-b from-[#ffd778] to-[#be8624] text-[#1c0e04] text-xs font-black px-3 py-1 rounded cursor-pointer disabled:opacity-40 shadow-sm"
                >
                  {savingPlaintiffEvidence ? '...' : '+ Add'}
                </button>
              </div>
            </div>
          </div>

          {/* Witnesses */}
          <div className="flex-shrink-0 pt-1.5 border-t-2 border-[#a67432]">
            <span className="text-[10px] uppercase font-bold text-[#ffdf79] block mb-1">
              🎙️ സാക്ഷികൾ (WITNESSES)
            </span>
            <div className="grid grid-cols-2 gap-1.5 mb-1.5">
              {COMPLAINANT_WITNESSES.map((w) => (
                <button
                  key={w.name}
                  onClick={() => handleSummon(w, 'plaintiff')}
                  disabled={summoning === w.name}
                  className="p-1.5 text-xs font-bold rounded bg-[#4a2e1a] hover:bg-[#ffd778] hover:text-[#1c0e04] text-white border border-[#a67432] transition truncate cursor-pointer text-left flex items-center justify-between shadow-sm"
                  title={w.role}
                >
                  <span className="truncate">{w.name}</span>
                  <span className="text-xs">📢</span>
                </button>
              ))}
            </div>

            {complainantWitnesses.length > 0 && (
              <div className="max-h-16 overflow-y-auto space-y-1 bg-[#fffdf5] p-2 rounded border border-[#dfcca0] text-xs text-[#241206] font-malayalam custom-scroll font-semibold">
                {complainantWitnesses.map((cw) => (
                  <div key={cw.id} className="leading-snug">
                    <strong className="text-[#7a2020]">{cw.witness_name}:</strong> {cw.statement}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ========================================================= */}
        {/* BOX 2 (CENTER OF WINDOW): THE JUDGE BENCH, JURY & VERDICT */}
        {/* ========================================================= */}
        <section className="courtroom-box-center">
          <div className="rivet-tl" />
          <div className="rivet-tr" />
          <div className="rivet-bl" />
          <div className="rivet-br" />

          {/* Judge Pedestal Header with Bright Plaque */}
          <div className="flex-shrink-0 text-center pb-2 border-b-2 border-[#e0b95c] flex items-center justify-center gap-3">
            <Seal size={38} className="drop-shadow-sm" />
            <div className="bg-[#fffdf5] px-4 py-1 rounded shadow-md border border-[#dfcca0] text-[#7a2020]">
              <h1 className="text-sm sm:text-base font-black font-display tracking-wider leading-tight">
                ബഹുമാനപ്പെട്ട കോടതി / THE COURT
              </h1>
              <p className="text-[10px] text-[#5c1f1f] uppercase tracking-widest font-extrabold">
                HON. AMMACHI JUDGE 👩‍⚖️🔨
              </p>
            </div>
          </div>

          {/* Live Proceedings Transcript with Bright Paper Styling */}
          <div className="flex-1 min-h-0 flex flex-col my-2 overflow-hidden">
            <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
              <span className="text-xs uppercase font-extrabold text-[#ffdf79] flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>കോടതി നടപടികൾ (PROCEEDINGS LOG)</span>
              </span>
              <span className="text-[10px] text-green-300 font-extrabold bg-green-950 px-2 py-0.5 rounded border border-green-500/80 flex items-center gap-1 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                <span>LIVE</span>
              </span>
            </div>

            <div className="flex-1 min-h-0 bg-[#fffdf5] text-[#241206] p-2.5 rounded-panel border-2 border-[#dfcca0] overflow-y-auto space-y-2 font-mono text-xs shadow-inner custom-scroll">
              <div className="pb-1.5 border-b border-[#7a2020]/20">
                <span className="font-black text-[#7a2020] block">⚖️ Hon. Judge:</span>
                <span className="font-semibold">"Court is now in session for Case #{caseData.case_code}. Let both parties present their arguments."</span>
              </div>
              <div className="pb-1.5 border-b border-[#7a2020]/20">
                <span className="font-black text-[#7a2020] block">🙋 {caseData.plaintiff} (Complaint):</span>
                <span className="font-malayalam font-bold text-[#1a0c04]">"{caseData.complaint}"</span>
              </div>
              {currentDefenseStatement && (
                <div className="pb-1.5 border-b border-[#7a2020]/20 bg-[#f7efdc] p-1.5 rounded">
                  <span className="font-black text-[#7a2020] block">🙎 {caseData.defendant} (Defense):</span>
                  <span className="font-malayalam font-bold text-[#1a0c04]">"{currentDefenseStatement}"</span>
                </div>
              )}
              {witnessList.map((w) => (
                <div key={w.id} className="pb-1.5 border-b border-[#7a2020]/20">
                  <span className="font-black text-[#7a2020] block">🎙️ {w.witness_name}:</span>
                  <span className="font-malayalam font-semibold">"{w.statement}"</span>
                </div>
              ))}
              {evidenceList.map((e) => (
                <div key={e.id} className="text-[11px] text-[#5c1f1f] font-semibold italic">
                  📎 Evidence ({e.submitted_by === 'defendant' ? 'Defendant' : 'Plaintiff'}): "{e.description || 'Photo/Document'}"
                </div>
              ))}
              <div ref={proceedingsEndRef} />
            </div>
          </div>

          {/* Official Verdict Result (Directly under the Judge/Proceedings) */}
          {verdict && (
            <div 
              onClick={triggerVerdictSplash}
              title="Click to view 2s Center Verdict Announcement"
              className="flex-shrink-0 animate-scale-in mb-2 cursor-pointer hover:brightness-110 active:scale-98 transition"
            >
              <div className={`p-3 rounded border-2 shadow-2xl ${
                outcomeIsGuilty
                  ? 'bg-[#3b1212] border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.35)]'
                  : 'bg-[#12361d] border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.35)]'
              }`}>
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/20">
                  <div className="flex items-center gap-1.5">
                    <Scale className={`w-4 h-4 ${outcomeIsGuilty ? 'text-red-400' : 'text-green-400'}`} />
                    <span className="text-xs font-black uppercase tracking-wider text-[#ffdf79] font-display">
                      OFFICIAL JUDGMENT / അന്തിമ വിധി
                    </span>
                  </div>
                  <span className={`text-xs font-black px-3 py-0.5 rounded border uppercase tracking-widest font-display shadow ${
                    outcomeIsGuilty ? 'bg-red-700 text-white border-red-300' : 'bg-green-700 text-white border-green-300'
                  }`}>
                    {verdict.verdict}
                  </span>
                </div>
                <p className="text-xs font-malayalam text-white leading-relaxed font-bold mb-1.5">
                  "{verdict.reasoning}"
                </p>
                <div className="flex items-center justify-between text-xs text-[#ffdf79] pt-1.5 border-t border-white/10 font-bold">
                  <span className="truncate max-w-[50%]"><strong>നിയമം:</strong> {verdict.fictional_law}</span>
                  <span className="text-amber-200 truncate max-w-[48%] text-right font-extrabold"><strong>ശിക്ഷ:</strong> {verdict.punishment}</span>
                </div>
              </div>
            </div>
          )}

          {/* Jury Panel & Deliver Verdict Button with High Contrast */}
          <div className="flex-shrink-0 bg-[#3a2213] p-2.5 rounded border-2 border-[#e0b95c]/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-extrabold text-[#ffdf79] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>ജൂറി പാനൽ (JURY) — {totalVotes} Votes</span>
              </span>
              <div className="flex gap-3 text-xs font-mono font-black">
                <span className="text-red-400">Guilty: {guiltyPct}%</span>
                <span className="text-green-400">Not Guilty: {100 - guiltyPct}%</span>
              </div>
            </div>

            {/* Split bar */}
            <div className="w-full h-2 bg-[#1f1106] rounded-full overflow-hidden flex border border-[#e0b95c]/40">
              <div style={{ width: `${guiltyPct}%` }} className="bg-red-600 transition-all duration-500" />
              <div style={{ width: `${100 - guiltyPct}%` }} className="bg-green-600 transition-all duration-500" />
            </div>

            {/* Voting & Gavel Buttons */}
            <div className="grid grid-cols-12 gap-2 pt-0.5">
              <button
                onClick={() => handleVote('guilty')}
                disabled={hasVoted}
                className="col-span-3 py-1.5 px-2 rounded text-xs font-display font-black uppercase bg-red-700 hover:bg-red-600 text-white border border-red-400 transition cursor-pointer disabled:opacity-50 shadow-sm"
              >
                🛑 GUILTY
              </button>
              <button
                onClick={() => handleVote('not_guilty')}
                disabled={hasVoted}
                className="col-span-3 py-1.5 px-2 rounded text-xs font-display font-black uppercase bg-green-700 hover:bg-green-600 text-white border border-green-400 transition cursor-pointer disabled:opacity-50 shadow-sm"
              >
                🟢 NOT GUILTY
              </button>
              <button
                id="final-verdict-btn"
                onClick={handleFinalVerdictClick}
                disabled={verdictLoading}
                className="col-span-6 py-1.5 px-3 rounded font-display font-black text-xs sm:text-sm uppercase tracking-wider bg-gradient-to-b from-[#ffd778] via-[#e4b248] to-[#be8624] text-[#1c0e04] border-2 border-white/60 hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60 shadow-md"
              >
                <Gavel className="w-4 h-4" />
                <span>{verdictLoading ? 'Deliberating...' : 'FINAL VERDICT 🔨'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* BOX 3 (RIGHT SIDE OF WINDOW): DEFENDANT                   */}
        {/* ========================================================= */}
        <section className="courtroom-box-right">
          <div className="rivet-tl" />
          <div className="rivet-tr" />
          <div className="rivet-bl" />
          <div className="rivet-br" />

          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between border-b-2 border-[#a67432] pb-1.5 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">📜</span>
              <div>
                <h2 className="text-[11px] font-display font-black uppercase tracking-wider text-[#ffdf79]">
                  പ്രതി (DEFENDANT)
                </h2>
                <p className="text-base font-black text-white font-display tracking-wide truncate max-w-[150px]">
                  {caseData.defendant || 'Unknown Defendant'}
                </p>
              </div>
            </div>
            {isDefendant && (
              <span className="text-[10px] bg-[#ffd778] text-[#241206] font-black px-2 py-0.5 rounded shadow-sm tracking-wider">
                YOU
              </span>
            )}
          </div>

          {/* Statement */}
          <div className="flex-shrink-0 mb-2">
            <span className="text-[10px] uppercase font-bold text-[#ffdf79] block mb-1">
              പ്രതിയുടെ മൊഴി (DEFENSE STATEMENT)
            </span>
            {currentDefenseStatement ? (
              <div className="bg-[#fffdf5] text-[#241206] p-2.5 rounded shadow-md border border-[#dfcca0] font-malayalam text-xs font-bold italic max-h-16 overflow-y-auto leading-relaxed custom-scroll">
                "{currentDefenseStatement}"
              </div>
            ) : (
              <div className="bg-[#3a2213] p-2 rounded border border-[#a67432] text-xs text-white/60 italic">
                No defense statement submitted yet.
              </div>
            )}

            {/* Input form */}
            <div className="mt-1.5 flex gap-1.5">
              <input
                type="text"
                placeholder="Enter defense statement..."
                value={defendantStatementInput}
                onChange={(e) => setDefendantStatementInput(e.target.value)}
                className="flex-1 bg-[#2e190d] border border-[#a67432] rounded px-2 py-1 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#ffd778]"
              />
              <button
                onClick={handleSaveDefenseStatement}
                disabled={savingDefenseStatement || !defendantStatementInput.trim()}
                className="bg-gradient-to-b from-[#ffd778] to-[#be8624] text-[#1c0e04] text-xs font-black px-3 py-1 rounded cursor-pointer disabled:opacity-40 shadow-sm"
              >
                {savingDefenseStatement ? '...' : 'Submit'}
              </button>
            </div>
          </div>

          {/* Counter-Evidence List */}
          <div className="flex-1 min-h-0 flex flex-col mb-2 overflow-hidden">
            <div className="flex items-center justify-between mb-1 flex-shrink-0">
              <span className="text-[11px] uppercase font-extrabold text-[#ffdf79] flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span>പ്രതിഭാഗം തെളിവുകൾ ({defendantEvidence.length})</span>
              </span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 bg-[#3a2213] p-2 rounded border border-[#a67432]/70 custom-scroll">
              {defendantEvidence.length === 0 ? (
                <p className="text-xs text-white/50 italic p-1">No counter-evidence submitted yet.</p>
              ) : (
                defendantEvidence.map((e) => (
                  <div key={e.id} className="bg-[#4a2e1a] p-2 rounded border border-[#a67432] text-xs text-white">
                    {e.file_url && (
                      <img src={e.file_url} alt="counter-evidence" className="w-full h-16 object-cover rounded mb-1 border border-black/30" />
                    )}
                    <p className="font-body leading-tight text-white font-medium">{e.description || 'Counter-evidence'}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Counter-Evidence Form */}
            <div className="flex-shrink-0 pt-2 space-y-1">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Describe counter-evidence..."
                  value={defendantEvidenceText}
                  onChange={(e) => setDefendantEvidenceText(e.target.value)}
                  className="flex-1 bg-[#2e190d] border border-[#a67432] rounded px-2 py-1 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#ffd778]"
                />
                <label className="bg-[#5a381e] hover:bg-[#6e4425] border border-[#ffd778]/70 text-[#ffd778] text-xs font-bold px-2 py-1 rounded cursor-pointer flex items-center shadow-sm">
                  📎
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setDefendantEvidenceFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={handleAddDefendantEvidence}
                  disabled={savingDefendantEvidence || (!defendantEvidenceText.trim() && !defendantEvidenceFile)}
                  className="bg-gradient-to-b from-[#ffd778] to-[#be8624] text-[#1c0e04] text-xs font-black px-3 py-1 rounded cursor-pointer disabled:opacity-40 shadow-sm"
                >
                  {savingDefendantEvidence ? '...' : '+ Add'}
                </button>
              </div>
            </div>
          </div>

          {/* Defendant Witnesses */}
          <div className="flex-shrink-0 pt-1.5 border-t-2 border-[#a67432]">
            <span className="text-[10px] uppercase font-bold text-[#ffdf79] block mb-1">
              🎙️ സാക്ഷികൾ (WITNESSES)
            </span>
            <div className="grid grid-cols-2 gap-1.5 mb-1.5">
              {DEFENDANT_WITNESSES.map((w) => (
                <button
                  key={w.name}
                  onClick={() => handleSummon(w, 'defendant')}
                  disabled={summoning === w.name}
                  className="p-1.5 text-xs font-bold rounded bg-[#4a2e1a] hover:bg-[#ffd778] hover:text-[#1c0e04] text-white border border-[#a67432] transition truncate cursor-pointer text-left flex items-center justify-between shadow-sm"
                  title={w.role}
                >
                  <span className="truncate">{w.name}</span>
                  <span className="text-xs">📢</span>
                </button>
              ))}
            </div>

            {defendantWitnesses.length > 0 && (
              <div className="max-h-16 overflow-y-auto space-y-1 bg-[#fffdf5] p-2 rounded border border-[#dfcca0] text-xs text-[#241206] font-malayalam custom-scroll font-semibold">
                {defendantWitnesses.map((dw) => (
                  <div key={dw.id} className="leading-snug">
                    <strong className="text-[#7a2020]">{dw.witness_name}:</strong> {dw.statement}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </main>

      {/* Law Book Modal */}
      {showLawBook && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="courtroom-box-center max-w-md w-full max-h-[80vh] overflow-y-auto border-[#ffd778] custom-scroll">
            <div className="flex items-center justify-between border-b-2 border-[#e0b95c] pb-2 mb-3">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#ffd778]" />
                <h3 className="font-display font-black text-sm text-[#ffd778] uppercase">
                  നിയമപുസ്തകം — LAW BOOK ({caseData.category || 'General'})
                </h3>
              </div>
              <button
                onClick={() => setShowLawBook(false)}
                className="text-white hover:text-[#ffd778] text-sm font-bold px-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {laws.map((l) => (
                <div key={l.section} className="bg-[#3a2213] p-2.5 rounded border border-[#b8863b] text-xs">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono font-black text-[#ffd778]">{l.section}</span>
                    <span className="font-display text-white font-black">{l.title}</span>
                  </div>
                  <p className="text-xs text-white/90 font-body">
                    <strong>ശിക്ഷ:</strong> {l.punishment}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-3 mt-3 border-t border-[#e0b95c] text-right">
              <button
                onClick={() => setShowLawBook(false)}
                className="px-4 py-1.5 rounded text-xs font-display font-black uppercase bg-gradient-to-b from-[#ffd778] to-[#be8624] text-[#1c0e04] hover:brightness-105 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}