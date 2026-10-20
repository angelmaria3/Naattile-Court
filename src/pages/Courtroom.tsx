import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Seal from '../components/Seal'
import Avatar, { specFor, avatarFromName } from '../components/Avatar'
import JuryPanel from '../components/JuryPanel'
import type { JurorView } from '../components/JuryPanel'
import {
  Gavel,
  Scale,
  FileText,
  BookOpen,
  Users,
  LogOut,
  MessageSquare,
} from 'lucide-react'
import './courtroom.css'

const FN_URL = 'https://fciltngewiorcbhaofsk.supabase.co/functions/v1'
const FN_HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer sb_publishable_obQzJtwbQ78yJ9aRBP8sLg_s-dMNd9b'
}

const COMPLAINANT_WITNESSES = [
  {
    name: 'Ammachi',
    role: 'ബാൽക്കണി സാക്ഷി (Balcony)',
    tagline: "Knows everything. Especially what she didn't see.",
  },
  {
    name: 'College Friend',
    role: 'റൂംമേറ്റ് (Roommate)',
    tagline: 'Neutral, but definitely leaning towards complainant.',
  }
]

const DEFENDANT_WITNESSES = [
  {
    name: 'Auto Chettan',
    role: 'ഓട്ടോ ചേട്ടൻ (Auto Driver)',
    tagline: 'Has an opinion on everything. Meter running.',
  },
  {
    name: 'Canteen Chettan',
    role: 'കാന്റീൻ ചേട്ടൻ (Canteen)',
    tagline: 'Saw something. Burnt the dosa because of shouting.',
  }
]

// ids must match the juror ids in supabase/functions/_shared/malayalam.ts
const JURORS = [
  { id: 'anjali', name: 'Anjali', tagline: 'Strict teacher · rules first' },
  { id: 'rohit', name: 'Rohit', tagline: 'Engineer · show me proof' },
  { id: 'meera', name: 'Meera', tagline: 'Soft heart · feels for the hurt' },
  { id: 'vishnu', name: 'Vishnu', tagline: 'Chaya-kada regular · goes by vibes' },
  { id: 'kiran', name: 'Kiran', tagline: 'Sarcastic senior · loves drama' },
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

  const [isPlaintiff, setIsPlaintiff] = useState(false)
  const [isDefendant, setIsDefendant] = useState(false)

  const [plaintiffEvidenceText, setPlaintiffEvidenceText] = useState('')
  const [plaintiffEvidenceFile, setPlaintiffEvidenceFile] = useState<File | null>(null)
  const [savingPlaintiffEvidence, setSavingPlaintiffEvidence] = useState(false)

  const [defendantStatementInput, setDefendantStatementInput] = useState('')
  const [savingDefenseStatement, setSavingDefenseStatement] = useState(false)

  const [defendantEvidenceText, setDefendantEvidenceText] = useState('')
  const [defendantEvidenceFile, setDefendantEvidenceFile] = useState<File | null>(null)
  const [savingDefendantEvidence, setSavingDefendantEvidence] = useState(false)

  const [summoning, setSummoning] = useState<string | null>(null)

  // AI jury: saved votes (from DB) + local loading/error state per juror
  const [juryRows, setJuryRows] = useState<Record<string, any>>({})
  const [juryLocal, setJuryLocal] = useState<Record<string, { status: 'loading' | 'error'; error?: string }>>({})

  const [verdict, setVerdict] = useState<any>(null)
  const [verdictLoading, setVerdictLoading] = useState(false)
  const [verdictError, setVerdictError] = useState('')
  const [showVerdictSplash, setShowVerdictSplash] = useState(false)
  const [showLawBook, setShowLawBook] = useState(false)
  const splashTimeoutRef = useRef<any>(null)
  const proceedingsEndRef = useRef<HTMLDivElement>(null)

  const triggerVerdictSplash = () => {
    if (splashTimeoutRef.current) clearTimeout(splashTimeoutRef.current)
    setShowVerdictSplash(true)
    splashTimeoutRef.current = setTimeout(() => setShowVerdictSplash(false), 10000)
  }
  const closeVerdictSplash = () => {
  if (splashTimeoutRef.current) clearTimeout(splashTimeoutRef.current)
  setShowVerdictSplash(false)
}

  useEffect(() => {
    return () => {
      if (splashTimeoutRef.current) clearTimeout(splashTimeoutRef.current)
    }
  }, [])

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

  const loadJury = async (caseUuid: string) => {
    const { data } = await supabase
      .from('jury_votes')
      .select('*')
      .eq('case_id', caseUuid)
    const rows: Record<string, any> = {}
    ;(data ?? []).forEach((r) => {
      rows[r.juror_id] = r
    })
    setJuryRows(rows)
  }

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

      await Promise.all([loadEvidence(c.id), loadWitnesses(c.id), loadJury(c.id)])
      setLoading(false)

      channel = supabase
        .channel(`courtroom_live_${c.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'evidence', filter: `case_id=eq.${c.id}` }, () => loadEvidence(c.id))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'witness_statements', filter: `case_id=eq.${c.id}` }, () => loadWitnesses(c.id))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'jury_votes', filter: `case_id=eq.${c.id}` }, () => loadJury(c.id))
        .subscribe()
    }

    run()

    const interval = setInterval(() => {
      if (caseData?.id) {
        loadEvidence(caseData.id)
        loadWitnesses(caseData.id)
        loadJury(caseData.id)
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

  const handleAddPlaintiffEvidence = async () => {
    if (!plaintiffEvidenceText.trim() && !plaintiffEvidenceFile) return
    setSavingPlaintiffEvidence(true)

    let fileUrl: string | null = null
    if (plaintiffEvidenceFile) {
      const filePath = `${caseData.id}/${Date.now()}-${plaintiffEvidenceFile.name}`
      const { error: uploadError } = await supabase.storage.from('evidence-files').upload(filePath, plaintiffEvidenceFile)
      if (uploadError) {
        alert('File upload failed: ' + uploadError.message)
        setSavingPlaintiffEvidence(false)
        return
      }
      const { data: urlData } = supabase.storage.from('evidence-files').getPublicUrl(filePath)
      fileUrl = urlData.publicUrl
    }

    const { error: insertErr } = await supabase.from('evidence').insert({
      case_id: caseData.id,
      description: plaintiffEvidenceText.trim() || null,
      file_url: fileUrl,
      submitted_by: 'plaintiff'
    })

    if (insertErr) {
      alert('Failed to add evidence: ' + insertErr.message)
      setSavingPlaintiffEvidence(false)
      return
    }

    setPlaintiffEvidenceText('')
    setPlaintiffEvidenceFile(null)
    await loadEvidence(caseData.id)
    setSavingPlaintiffEvidence(false)
  }

  const handleSaveDefenseStatement = async () => {
    const text = defendantStatementInput.trim()
    if (!text) return
    setSavingDefenseStatement(true)

    const existing = evidenceList.find(e => e.submitted_by === 'defendant_statement')
    const { error } = existing
      ? await supabase.from('evidence').update({ description: text }).eq('id', existing.id)
      : await supabase.from('evidence').insert({
          case_id: caseData.id,
          description: text,
          submitted_by: 'defendant_statement'
        })

    setSavingDefenseStatement(false)
    if (error) {
      alert('Could not save defense statement: ' + error.message)
      return
    }

    localStorage.setItem(`case_${caseId}_defendant_statement`, text)
    await loadEvidence(caseData.id)
    setDefendantStatementInput('')
  }

  const handleAddDefendantEvidence = async () => {
    if (!defendantEvidenceText.trim() && !defendantEvidenceFile) return
    setSavingDefendantEvidence(true)

    let fileUrl: string | null = null
    if (defendantEvidenceFile) {
      const filePath = `${caseData.id}/${Date.now()}-def-${defendantEvidenceFile.name}`
      const { error: uploadError } = await supabase.storage.from('evidence-files').upload(filePath, defendantEvidenceFile)
      if (uploadError) {
        alert('File upload failed: ' + uploadError.message)
        setSavingDefendantEvidence(false)
        return
      }
      const { data: urlData } = supabase.storage.from('evidence-files').getPublicUrl(filePath)
      fileUrl = urlData.publicUrl
    }

    const { error: insertErr } = await supabase.from('evidence').insert({
      case_id: caseData.id,
      description: defendantEvidenceText.trim() || null,
      file_url: fileUrl,
      submitted_by: 'defendant'
    })
    if (insertErr) {
      alert('Failed to add evidence: ' + insertErr.message)
      setSavingDefendantEvidence(false)
      return
    }

    setDefendantEvidenceText('')
    setDefendantEvidenceFile(null)
    await loadEvidence(caseData.id)
    setSavingDefendantEvidence(false)
  }

  const handleSummon = async (
    persona: { name: string; role: string; tagline: string },
    side: 'plaintiff' | 'defendant'
    
    
  ) => {
    setSummoning(persona.name)
    try {
      const evidenceNotes = evidenceList
        .filter(e => e.description && e.submitted_by !== 'defendant_statement')
        .map(e => `${e.submitted_by === 'defendant' ? 'പ്രതി' : 'വാദി'}: ${e.description}`)

      const res = await fetch(`${FN_URL}/witness-statement`, {
        method: 'POST',
        headers: FN_HEADERS,
        body: JSON.stringify({
          witness_name: persona.name,
          witness_personality: `${persona.role}. ${persona.tagline}`,
          side,
          plaintiff: caseData.plaintiff,            // ← add
  defendant: caseData.defendant || '',      // ← add
  complaint_text: caseData.complaint,
  defense_text: currentDefenseStatement,
  evidence: evidenceNotes
        })
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body.statement) throw new Error(body.error || 'Witness could not be reached')

      await supabase.from('witness_statements').insert({
        case_id: caseData.id,
        witness_name: `${persona.name} (${side === 'plaintiff' ? 'വാദി' : 'പ്രതി'})`,
        statement: body.statement
      })
      await loadWitnesses(caseData.id)
    } catch (err: any) {
      alert('Failed to summon witness: ' + (err.message || 'unknown error'))
    } finally {
      setSummoning(null)
    }
  }

  // Each juror is a separate, independent AI call (no juror sees another's vote)
  const askJuror = async (jurorId: string) => {
    if (!caseData) return
    const juror = JURORS.find(j => j.id === jurorId)
    if (!juror) return

    setJuryLocal(p => ({ ...p, [jurorId]: { status: 'loading' } }))
    try {
      const res = await fetch(`${FN_URL}/jury-vote`, {
        method: 'POST',
        headers: FN_HEADERS,
        body: JSON.stringify({
          juror_id: jurorId,
          plaintiff: caseData.plaintiff,
          defendant: caseData.defendant || 'Unknown',
          complaint_text: caseData.complaint,
          defense_text: currentDefenseStatement,
          plaintiff_evidence: plaintiffEvidence.map(e => e.description || 'Photo/Document evidence'),
          defendant_evidence: defendantEvidence.map(e => e.description || 'Photo/Document counter-evidence'),
          witnesses: witnessList.map(w => `${w.witness_name}: ${w.statement}`)
        })
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body.vote || !body.reasoning) {
        throw new Error(body.error || 'Juror could not be reached')
      }

      const { error } = await supabase.from('jury_votes').insert({
        case_id: caseData.id,
        juror_id: jurorId,
        juror_name: juror.name,
        vote: body.vote,
        reasoning: body.reasoning
      })
      // 23505 = another browser already saved this juror's vote; that is fine
      if (error && error.code !== '23505') throw new Error(error.message)

      await loadJury(caseData.id)
      setJuryLocal(p => {
        const next = { ...p }
        delete next[jurorId]
        return next
      })
    } catch (err: any) {
      setJuryLocal(p => ({ ...p, [jurorId]: { status: 'error', error: err.message || 'Something went wrong' } }))
    }
  }

  const conveneJury = () => {
    JURORS.forEach(j => {
      if (juryRows[j.id] || juryLocal[j.id]?.status === 'loading') return
      askJuror(j.id)
    })
  }

  const getVerdict = async () => {
    setVerdictLoading(true)
    setVerdictError('')

    const defendantStatement = currentDefenseStatement || 'No formal defense statement submitted.'

    const doneJurors = jurorViews.filter(j => j.status === 'done')
    const guiltyCount = doneJurors.filter(j => j.vote === 'guilty').length
    const guiltyPct = doneJurors.length ? Math.round((guiltyCount / doneJurors.length) * 100) : 50

    const juryLines = doneJurors.map(
      j => `[Juror ${j.name} voted ${j.vote === 'guilty' ? 'GUILTY' : 'NOT GUILTY'}]: ${j.reasoning}`
    )

    try {
      const res = await fetch(`${FN_URL}/judge-verdict`, {
        method: 'POST',
        headers: FN_HEADERS,
        body: JSON.stringify({
          complaint: `[PLAINTIFF ${caseData.plaintiff} STATEMENT]: "${caseData.complaint}"\n[DEFENDANT ${caseData.defendant} DEFENSE]: "${defendantStatement}"`,
          plaintiff: caseData.plaintiff,
          defendant: caseData.defendant || 'Unknown',
          evidence: [
            ...plaintiffEvidence.map(e => `[Complainant Evidence]: ${e.description || 'Photo/Document Evidence'}`),
            ...defendantEvidence.map(e => `[Defendant Evidence]: ${e.description || 'Counter-Evidence Photo/Doc'}`),
            ...witnessList.map(w => `[Witness ${w.witness_name}]: ${w.statement}`),
            `[JURY: ${guiltyCount} of ${doneJurors.length} independent jurors voted guilty]`,
            ...juryLines
          ].join('\n') || 'Oral arguments only',
          juryGuiltyPercent: guiltyPct
        })
      })

      const v = await res.json().catch(() => ({}))
      if (!res.ok || !v.verdict) throw new Error(v.error || 'The judge could not be reached')

      setVerdict(v)
      triggerVerdictSplash()
    } catch (err: any) {
      setVerdictError(err.message || 'The judge could not be reached')
    } finally {
      setVerdictLoading(false)
    }
  }

  const handleFinalVerdictClick = () => {
    if (verdict) {
      triggerVerdictSplash()
      return
    }
    getVerdict()
  }

  const plaintiffEvidence = evidenceList.filter(e => e.submitted_by !== 'defendant' && e.submitted_by !== 'defendant_statement')
  const defendantEvidence = evidenceList.filter(e => e.submitted_by === 'defendant')
  const currentDefenseStatement = evidenceList.find(e => e.submitted_by === 'defendant_statement')?.description
    || localStorage.getItem(`case_${caseId}_defendant_statement`)
    || ''

  const complainantWitnesses = witnessList.filter(w => w.witness_name?.includes('വാദി'))
  const defendantWitnesses = witnessList.filter(w => w.witness_name?.includes('പ്രതി'))

  const jurorViews: JurorView[] = JURORS.map(j => {
    const row = juryRows[j.id]
    if (row) return { ...j, status: 'done', vote: row.vote, reasoning: row.reasoning }
    const local = juryLocal[j.id]
    if (local) return { ...j, status: local.status, error: local.error }
    return { ...j, status: 'idle' }
  })
  const juryDoneCount = jurorViews.filter(j => j.status === 'done').length
  const juryGuiltyCount = jurorViews.filter(j => j.status === 'done' && j.vote === 'guilty').length
  const allJurorsDone = juryDoneCount === JURORS.length

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

  const outcomeIsGuilty = verdict?.verdict?.toLowerCase().includes('guilty') && !verdict?.verdict?.toLowerCase().includes('not guilty')
  const laws = LAW_BOOK[caseData?.category] ?? LAW_BOOK.Roommate
  const filedDate = caseData?.created_at
    ? new Date(caseData.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Recently'
  const confettiColors = outcomeIsGuilty
    ? ['#ef4444', '#f59e0b', '#fde68a']
    : ['#22c55e', '#ffd778', '#ffffff']

  const finalButtonLabel = verdictLoading
    ? 'Judge is deliberating...'
    : !currentDefenseStatement
    ? "Waiting for defendant's statement"
    : !allJurorsDone
    ? `Waiting for jury (${juryDoneCount}/${JURORS.length})`
    : verdictError
    ? '↻ RETRY FINAL VERDICT 🔨'
    : 'FINAL VERDICT 🔨'

  return (
    <div className="courtroom-viewport">
      {showVerdictSplash && verdict && (
        <div
          id="center-verdict-splash"
          onClick={closeVerdictSplash}
          style={{ zIndex: 99999 }}
          // onClick={() => setShowVerdictSplash(false)}
          className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md cursor-pointer overflow-hidden transition-all duration-300"
        >
          {Array.from({ length: 28 }).map((_, i) => (
            <span
              key={i}
              className="confetti-piece"
              style={{
                left: `${(i * 37) % 100}%`,
                background: confettiColors[i % confettiColors.length],
                animationDuration: `${2.4 + (i % 5) * 0.5}s`,
                animationDelay: `${(i % 7) * 0.25}s`
              }}
            />
          ))}

          <div className={`relative p-6 sm:p-8 rounded-2xl border-4 text-center max-w-lg w-[92%] sm:w-full mx-4 shadow-2xl verdict-stamp-animation court-shake ${
            outcomeIsGuilty
              ? 'bg-gradient-to-b from-[#421010] via-[#250909] to-[#120303] border-red-500 shadow-[0_0_80px_rgba(239,68,68,0.85)]'
              : 'bg-gradient-to-b from-[#0e381b] via-[#082210] to-[#041208] border-green-500 shadow-[0_0_80px_rgba(34,197,94,0.85)]'
          }`}>
            <div className="rivet-tl" />
            <div className="rivet-tr" />
            <div className="rivet-bl" />
            <div className="rivet-br" />

            <div className="gavel-slam text-5xl sm:text-6xl leading-none mb-1">🔨</div>

            <div className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.25em] uppercase text-[#ffd778]">
              അന്തിമ വിധി പ്രഖ്യാപനം • FINAL VERDICT
            </div>

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

            <div className="reveal-up mt-2 pt-3 border-t border-white/20 space-y-2 text-left" style={{ animationDelay: '1.1s' }}>
              <p className="text-[10px] font-mono text-white/60 uppercase tracking-wider text-center">
                Jury: {juryGuiltyCount} guilty · {juryDoneCount - juryGuiltyCount} not guilty
              </p>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#ffd778]">⚖️ നിയമം (Law)</span>
                <p className="text-xs sm:text-sm font-malayalam font-bold text-[#fffdf5] leading-snug">{verdict.fictional_law}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#ffd778]">
  {outcomeIsGuilty ? '🔨 ശിക്ഷ (Punishment)' : '🎁 വിടുതലും സമ്മാനവും (Released & Rewarded)'}
</span>
                <p className="text-xs sm:text-sm font-malayalam font-bold text-[#fffdf5] leading-snug">{verdict.punishment}</p>
              </div>
            </div>

            <div className="mt-4 w-full bg-black/50 h-2 rounded-full overflow-hidden border border-white/20">
              <div className={`h-full verdict-progress ${outcomeIsGuilty ? 'bg-red-500' : 'bg-green-400'}`} />
            </div>
            <div className="text-[10px] font-mono text-white/60 tracking-wider uppercase mt-1">
              Tap anywhere to close
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          position: 'fixed', inset: 0, width: '100vw', height: '100vh',
          backgroundImage: "url('/hero-courtroom.jpg?v=3')",
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'blur(3px) brightness(0.85) contrast(1.05)',
          transform: 'scale(1.03)', pointerEvents: 'none', zIndex: 0
        }}
      />
      <div
        style={{
          position: 'fixed', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(43,26,16,0.25), rgba(0,0,0,0.45))',
          pointerEvents: 'none', zIndex: 1
        }}
      />

      <header className="courtroom-header">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <Seal size={30} />
          <span className="font-display font-black text-base text-[#ffdf79] tracking-wider drop-shadow-sm">
            നാട്ടിലെ COURT
          </span>
        </div>

        <nav className="flex items-center gap-1">
          <span className="px-3 py-1.5 rounded text-xs font-display font-bold uppercase bg-[#5a381e] text-[#ffdf79] border border-[#e0b95c] flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5" /> Courtroom
          </span>
          <span className="px-3 py-1.5 rounded text-xs font-display font-bold uppercase text-white/50 flex items-center gap-1.5 cursor-not-allowed">
            <FileText className="w-3.5 h-3.5" /> Case File
          </span>
          <button
            onClick={() => setShowLawBook(!showLawBook)}
            className="px-3 py-1.5 rounded text-xs font-display font-bold uppercase text-white/70 hover:text-[#ffdf79] flex items-center gap-1.5 cursor-pointer transition"
          >
            <BookOpen className="w-3.5 h-3.5" /> Law Book
          </button>
          <span className="px-3 py-1.5 rounded text-xs font-display font-bold uppercase text-white/50 flex items-center gap-1.5 cursor-not-allowed">
            <Users className="w-3.5 h-3.5" /> Leaderboard
          </span>
        </nav>

        <div className="flex items-center gap-2 bg-[#4a2e18] border-2 border-[#e0b95c]/80 px-3.5 py-1 rounded shadow-sm text-xs">
          <span className="font-bold text-[#ffdf79]">DOCKET:</span>
          <span className="font-mono font-black text-white tracking-widest text-sm">#{caseData.case_code}</span>
          <span className="text-[#e0b95c]/50">|</span>
          <span className="text-white/90 font-mono text-[11px]">{filedDate}</span>
        </div>

        <button
          onClick={() => navigate('/')}
          className="px-3 py-1 rounded text-xs font-display font-bold uppercase bg-[#4a1c14] hover:bg-[#5f241a] text-white border border-red-500/50 transition flex items-center gap-1 cursor-pointer shadow-sm"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit</span>
        </button>
      </header>

      <main className="courtroom-arena">

        <section className="courtroom-box-left">
          <div className="rivet-tl" />
          <div className="rivet-tr" />
          <div className="rivet-bl" />
          <div className="rivet-br" />

          <div className="flex-shrink-0 flex items-center justify-between border-b-2 border-[#a67432] pb-1.5 mb-2">
            <div className="flex items-center gap-2">
              <Avatar spec={avatarFromName(caseData.plaintiff, 'plaintiff')} size={44} label={caseData.plaintiff} />
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

          <div className="flex-shrink-0 mb-2">
            <span className="text-[10px] uppercase font-bold text-[#ffdf79] block mb-1">
              പരാതി (COMPLAINT STATEMENT)
            </span>
            <div className="bg-[#fffdf5] text-[#241206] p-2.5 rounded shadow-md border border-[#dfcca0] font-malayalam text-xs font-bold italic max-h-16 overflow-y-auto leading-relaxed custom-scroll">
              "{caseData.complaint}"
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col mb-2 overflow-hidden">
            <div className="flex items-center justify-between mb-1 flex-shrink-0">
              <span className="text-[11px] uppercase font-extrabold text-[#ffdf79] flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span>തെളിവുകൾ (PLAINTIFF EVIDENCE) ({plaintiffEvidence.length})</span>
              </span>
            </div>

            <div className="flex-1 min-h-0 overflow-x-auto flex gap-2 pb-1 bg-[#3a2213] p-2 rounded border border-[#a67432]/70 custom-scroll">
              {plaintiffEvidence.length === 0 ? (
                <p className="text-xs text-white/50 italic p-1">No evidence submitted yet.</p>
              ) : (
                plaintiffEvidence.map((e, i) => (
                  <div
                    key={e.id}
                    className="flex-shrink-0 w-24 bg-[#fffdf5] p-1.5 pb-2 rounded shadow-lg border border-black/10"
                    style={{ transform: `rotate(${i % 2 === 0 ? -2 : 2}deg)` }}
                  >
                    {e.file_url ? (
                      <img src={e.file_url} alt="evidence" className="w-full h-16 object-cover rounded-sm" />
                    ) : (
                      <div className="w-full h-16 bg-[#e8dfc8] rounded-sm flex items-center justify-center text-lg">📄</div>
                    )}
                    <p className="text-[9px] text-[#241206] font-body mt-1 text-center truncate">
                      {e.description || 'Photo/Document'}
                    </p>
                  </div>
                ))
              )}
            </div>

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

          <div className="flex-shrink-0 pt-1.5 border-t-2 border-[#a67432]">
            <span className="text-[10px] uppercase font-bold text-[#ffdf79] block mb-1">
              🎙️ സാക്ഷികൾ (WITNESSES)
            </span>
            <div className="space-y-1.5 mb-1.5">
              {COMPLAINANT_WITNESSES.map((w) => (
                <div key={w.name} className="flex items-center justify-between bg-[#4a2e1a] border border-[#a67432] rounded p-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar spec={specFor(w.name)} size={32} label={w.name} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{w.name}</p>
                      <p className="text-[9px] text-white/50 truncate">{w.tagline}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSummon(w, 'plaintiff')}
                    disabled={summoning === w.name}
                    className="text-[10px] font-bold px-2 py-1 rounded bg-[#5a381e] hover:bg-[#ffd778] hover:text-[#1c0e04] text-[#ffdf79] border border-[#e0b95c]/60 flex-shrink-0 cursor-pointer transition disabled:opacity-50"
                  >
                    {summoning === w.name ? '...' : 'Summon'}
                  </button>
                </div>
              ))}
            </div>

            {complainantWitnesses.length > 0 && (
              <div className="max-h-20 overflow-y-auto space-y-1.5 bg-[#fffdf5] p-2 rounded border border-[#dfcca0] text-xs text-[#241206] font-malayalam custom-scroll font-semibold">
                {complainantWitnesses.map((cw) => (
                  <div key={cw.id} className="flex gap-1.5 leading-snug">
                    <Avatar spec={specFor(cw.witness_name)} size={22} label={cw.witness_name} />
                    <div className="min-w-0">
                      <strong className="text-[#7a2020]">{cw.witness_name}:</strong> {cw.statement}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="courtroom-box-center">
          <div className="rivet-tl" />
          <div className="rivet-tr" />
          <div className="rivet-bl" />
          <div className="rivet-br" />

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
                <span className="font-black text-[#7a2020] flex items-center gap-1.5">
                  <Avatar spec={specFor('Judge')} size={18} label="Judge" /> Hon. Judge:
                </span>
                <span className="font-semibold">"Court is now in session for Case #{caseData.case_code}. Let both parties present their arguments."</span>
              </div>
              <div className="pb-1.5 border-b border-[#7a2020]/20">
                <span className="font-black text-[#7a2020] flex items-center gap-1.5">
                  <Avatar spec={avatarFromName(caseData.plaintiff, 'plaintiff')} size={18} label={caseData.plaintiff} /> {caseData.plaintiff} (Complaint):
                </span>
                <span className="font-malayalam font-bold text-[#1a0c04]">"{caseData.complaint}"</span>
              </div>
              {currentDefenseStatement && (
                <div className="pb-1.5 border-b border-[#7a2020]/20 bg-[#f7efdc] p-1.5 rounded">
                  <span className="font-black text-[#7a2020] flex items-center gap-1.5">
                    <Avatar spec={avatarFromName(caseData.defendant || 'Defendant', 'defendant')} size={18} label={caseData.defendant} /> {caseData.defendant} (Defense):
                  </span>
                  <span className="font-malayalam font-bold text-[#1a0c04]">"{currentDefenseStatement}"</span>
                </div>
              )}
              {witnessList.map((w) => (
                <div key={w.id} className="pb-1.5 border-b border-[#7a2020]/20 animate-fade-in">
                  <span className="font-black text-[#7a2020] flex items-center gap-1.5">
                    <Avatar spec={specFor(w.witness_name)} size={18} label={w.witness_name} /> {w.witness_name}:
                  </span>
                  <span className="font-malayalam font-semibold">"{w.statement}"</span>
                </div>
              ))}
              {evidenceList
                .filter(e => e.submitted_by !== 'defendant_statement')
                .map((e) => (
                  <div key={e.id} className="text-[11px] text-[#5c1f1f] font-semibold italic animate-fade-in">
                    📎 Evidence ({e.submitted_by === 'defendant' ? 'Defendant' : 'Plaintiff'}): "{e.description || 'Photo/Document'}"
                  </div>
                ))}
              <div ref={proceedingsEndRef} />
            </div>
          </div>

          {verdict && (
            <div
              onClick={triggerVerdictSplash}
              className="flex-shrink-0 animate-scale-in mb-2 cursor-pointer hover:brightness-105 active:scale-98 transition"
            >
              <div className="bg-[#fffdf5] rounded-lg p-4 border-2 border-[#dfcca0] shadow-xl">
                <div className="grid grid-cols-2 gap-4 divide-x divide-[#dfcca0]">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#7a2020]/60 flex items-center gap-1 mb-1">
                      <Scale className="w-3 h-3" /> Verdict
                    </span>
                    <div
                      className={`inline-block px-3 py-1 rounded border-2 font-display font-black text-lg uppercase tracking-wider ${
                        outcomeIsGuilty
                          ? 'border-red-600 text-red-700 bg-red-50'
                          : 'border-green-600 text-green-700 bg-green-50'
                      }`}
                      style={{ transform: 'rotate(-3deg)' }}
                    >
                      {outcomeIsGuilty ? 'GUILTY' : 'NOT GUILTY'}
                    </div>
                  </div>
                  <div className="pl-4">
                    <span className="text-[10px] uppercase font-bold text-[#7a2020]/60 flex items-center gap-1 mb-1">
                      <Gavel className="w-3 h-3" /> {outcomeIsGuilty ? 'Punishment' : 'Released & Rewarded'}
                    </span>
                    <p className="text-xs text-[#241206] font-malayalam font-semibold leading-snug">
                      {verdict.punishment}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-[#5c1f1f] font-malayalam italic mt-3 pt-3 border-t border-[#dfcca0]">
                  "{verdict.reasoning}" — Hon. Naatile Judge
                </p>
                <p className="text-[10px] text-[#7a2020]/60 font-malayalam mt-1">{verdict.fictional_law}</p>
              </div>
            </div>
          )}

          <div className="flex-shrink-0 bg-[#3a2213] p-2.5 rounded border-2 border-[#e0b95c]/60 space-y-1.5">
            <JuryPanel
              jurors={jurorViews}
              canConvene={Boolean(currentDefenseStatement)}
              conveneHint="Waiting for defendant's statement"
              onConvene={conveneJury}
              onRetry={askJuror}
            />

            {verdictError && (
              <p className="text-[11px] text-red-300 text-center">{verdictError}</p>
            )}

            <button
              id="final-verdict-btn"
              onClick={handleFinalVerdictClick}
              disabled={verdictLoading || !allJurorsDone || !currentDefenseStatement}
              className="w-full mt-1 py-2 rounded font-display font-black text-sm uppercase tracking-wider bg-gradient-to-b from-[#ffd778] via-[#e4b248] to-[#be8624] text-[#1c0e04] border-2 border-white/60 hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-md"
            >
              <Gavel className="w-4 h-4" />
              <span>{finalButtonLabel}</span>
            </button>
          </div>
        </section>

        <section className="courtroom-box-right">
          <div className="rivet-tl" />
          <div className="rivet-tr" />
          <div className="rivet-bl" />
          <div className="rivet-br" />

          <div className="flex-shrink-0 flex items-center justify-between border-b-2 border-[#a67432] pb-1.5 mb-2">
            <div className="flex items-center gap-2">
              <Avatar spec={avatarFromName(caseData.defendant || 'Defendant', 'defendant')} size={44} label={caseData.defendant || 'Defendant'} />
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

            <div className="mt-1.5 flex gap-1.5">
              <input
                type="text"
                placeholder="Enter defense statement..."
                value={defendantStatementInput}
                onChange={(e) => setDefendantStatementInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveDefenseStatement()}
                className="flex-1 bg-[#2e190d] border border-[#a67432] rounded px-2 py-1 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#ffd778]"
              />
              <button
                onClick={handleSaveDefenseStatement}
                disabled={savingDefenseStatement}
                className="bg-gradient-to-b from-[#ffd778] to-[#be8624] text-[#1c0e04] text-xs font-black px-3 py-1 rounded cursor-pointer disabled:opacity-40 shadow-sm"
              >
                {savingDefenseStatement ? '...' : 'Submit'}
              </button>
            </div>
          </div>

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
                  className="p-1.5 text-xs font-bold rounded bg-[#4a2e1a] hover:bg-[#ffd778] hover:text-[#1c0e04] text-white border border-[#a67432] transition cursor-pointer text-left flex items-center justify-between gap-1 shadow-sm disabled:opacity-60"
                  title={w.role}
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <Avatar spec={specFor(w.name)} size={24} label={w.name} />
                    <span className="truncate">{summoning === w.name ? '...' : w.name}</span>
                  </span>
                  <span className="text-xs">📢</span>
                </button>
              ))}
            </div>

            {defendantWitnesses.length > 0 && (
              <div className="max-h-20 overflow-y-auto space-y-1.5 bg-[#fffdf5] p-2 rounded border border-[#dfcca0] text-xs text-[#241206] font-malayalam custom-scroll font-semibold">
                {defendantWitnesses.map((dw) => (
                  <div key={dw.id} className="flex gap-1.5 leading-snug">
                    <Avatar spec={specFor(dw.witness_name)} size={22} label={dw.witness_name} />
                    <div className="min-w-0">
                      <strong className="text-[#7a2020]">{dw.witness_name}:</strong> {dw.statement}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </main>

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