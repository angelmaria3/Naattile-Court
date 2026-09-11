import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

import './courtroom.css'

const AVATAR_COLORS = ['#8B5A2B', '#3D6B54', '#8B2222', '#4A5A8B', '#8B6A2B']
const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
const WITNESS_PERSONAS = [
  {
    name: 'Ammachi',
    tagline: "Knows everything. Especially what she didn't see.",
    lines: [
      'I saw the whole thing from the balcony, and let me tell you, it was scandalous.',
      'In my time, this would have been settled with a slipper, not a court case.',
      'I did not see anything, but I have a strong feeling about who is wrong.'
    ]
  },
  {
    name: 'Canteen Chettan',
    tagline: 'Saw something. Probably.',
    lines: [
      'They were arguing near the counter, I remember because I burnt the dosa.',
      'Both of them owe me money also, separate issue, but worth mentioning.',
      'I only heard shouting. Could have been about this. Could have been cricket.'
    ]
  },
  {
    name: 'Auto Chettan',
    tagline: 'Has an opinion on everything.',
    lines: [
      'I dropped one of them home that day, very tense mood in my auto.',
      'This is a simple case. Compensation and apology. Case closed. Meter running.',
      'People these days fight over small things. In my time we shared everything.'
    ]
  },
  {
    name: 'College Friend',
    tagline: 'Neutral. Maybe.',
    lines: [
      "Honestly? Both are a little bit right and a little bit dramatic.",
      'I was not there, but this sounds exactly like something they would do.',
      "I'm not taking sides, but if I had to... okay maybe I'm taking a side."
    ]
  }
]

const LAW_BOOK: Record<string, { section: string; title: string; punishment: string }[]> = {
  Roommate: [
    { section: 'Section 420-P', title: 'Unauthorized Snack Consumption', punishment: 'Replace item + 1 chaya' },
    { section: 'Section 304-F', title: 'Minor Household Theft', punishment: 'Written apology' },
    { section: 'Section 101-C', title: 'Shared Space Violation', punishment: 'Clean common area for a week' }
  ],
  Family: [
    { section: 'Section 210-A', title: 'Unsolicited Advice', punishment: 'One favour owed, no questions asked' },
    { section: 'Section 305-M', title: 'Comparison to Cousin', punishment: 'Public retraction at next family function' },
    { section: 'Section 118-H', title: 'Broken Promise (Minor)', punishment: 'Treat to same item' }
  ],
  Friends: [
    { section: 'Section 220-B', title: 'Group Chat Negligence', punishment: 'Public apology in the chat' },
    { section: 'Section 330-L', title: 'Plan Cancellation, Late Notice', punishment: 'Host the next outing' },
    { section: 'Section 999-U', title: 'General Useless Behaviour', punishment: "As per judge's mood" }
  ],
  Money: [
    { section: 'Section 501-D', title: 'Unpaid Small Debt', punishment: 'Repay with interest (one chaya)' },
    { section: 'Section 502-S', title: 'Split Bill Discrepancy', punishment: 'Settle in full, publicly' },
    { section: 'Section 999-U', title: 'General Useless Behaviour', punishment: "As per judge's mood" }
  ],
  Love: [
    { section: 'Section 601-R', title: 'Left on Read (Aggravated)', punishment: 'Immediate, sincere reply' },
    { section: 'Section 602-J', title: 'Jealousy Without Basis', punishment: 'Public reassurance required' },
    { section: 'Section 101-C', title: 'Emotional Damage', punishment: 'Treat to same item' }
  ]
}

export default function Courtroom() {
  const { caseId } = useParams() // this is actually the case_code
  const navigate = useNavigate()

  const [caseData, setCaseData] = useState<any>(null)
  const [evidenceList, setEvidenceList] = useState<any[]>([])
  const [witnessList, setWitnessList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isPlaintiff, setIsPlaintiff] = useState(false)

  const [evidenceText, setEvidenceText] = useState('')
  const [savingEvidence, setSavingEvidence] = useState(false)
  const [summoning, setSummoning] = useState<string | null>(null)

  const [guiltyVotes, setGuiltyVotes] = useState(0)
  const [notGuiltyVotes, setNotGuiltyVotes] = useState(0)
  const [hasVoted, setHasVoted] = useState(false)

  const [verdict, setVerdict] = useState<any>(null)
  const [verdictLoading, setVerdictLoading] = useState(false)

  useEffect(() => {
    const run = async () => {
      const { data: c, error } = await supabase
        .from('cases')
        .select('*')
        .eq('case_code', caseId)
        .single()

      if (error || !c) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setCaseData(c)
      setIsPlaintiff(localStorage.getItem(`case_${caseId}_token`) === c.creator_token)
      setHasVoted(localStorage.getItem(`case_${caseId}_voted`) === 'true')

      await Promise.all([loadEvidence(c.id), loadWitnesses(c.id), loadVotes(c.id)])
      setLoading(false)
    }
    run()
  }, [caseId])

  const loadEvidence = async (caseUuid: string) => {
    const { data } = await supabase.from('evidence').select('*').eq('case_id', caseUuid).order('created_at', { ascending: true })
    setEvidenceList(data ?? [])
  }

  const loadWitnesses = async (caseUuid: string) => {
    const { data } = await supabase.from('witness_statements').select('*').eq('case_id', caseUuid).order('created_at', { ascending: true })
    setWitnessList(data ?? [])
  }

  const loadVotes = async (caseUuid: string) => {
    const { data } = await supabase.from('votes').select('vote').eq('case_id', caseUuid)
    setGuiltyVotes((data ?? []).filter(v => v.vote === 'guilty').length)
    setNotGuiltyVotes((data ?? []).filter(v => v.vote === 'not_guilty').length)
  }

 const handleAddEvidence = async () => {
  if (!evidenceText.trim() && !evidenceFile) return
  setSavingEvidence(true)

  let fileUrl: string | null = null

  if (evidenceFile) {
    const filePath = `${caseData.id}/${Date.now()}-${evidenceFile.name}`
    const { error: uploadError } = await supabase.storage
      .from('evidence-files')
      .upload(filePath, evidenceFile)

    if (uploadError) {
      alert('File upload failed: ' + uploadError.message)
      setSavingEvidence(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('evidence-files')
      .getPublicUrl(filePath)
    fileUrl = urlData.publicUrl
  }

  await supabase.from('evidence').insert({
    case_id: caseData.id,
    description: evidenceText.trim() || null,
    file_url: fileUrl,
  })

  setEvidenceText('')
  setEvidenceFile(null)
  await loadEvidence(caseData.id)
  setSavingEvidence(false)
}

  const handleSummon = async (persona: typeof WITNESS_PERSONAS[number]) => {
    setSummoning(persona.name)
    const line = persona.lines[Math.floor(Math.random() * persona.lines.length)]
    await supabase.from('witness_statements').insert({
      case_id: caseData.id,
      witness_name: persona.name,
      statement: line
    })
    await loadWitnesses(caseData.id)
    setSummoning(null)
  }

  const handleVote = async (vote: 'guilty' | 'not_guilty') => {
    if (hasVoted || isPlaintiff) return
    await supabase.from('votes').insert({ case_id: caseData.id, vote })
    localStorage.setItem(`case_${caseId}_voted`, 'true')
    setHasVoted(true)
    await loadVotes(caseData.id)
  }

  const getVerdict = async () => {
    setVerdictLoading(true)
    const res = await fetch('https://fciltngewiorcbhaofsk.supabase.co/functions/v1/judge-verdict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sb_publishable_obQzJtwbQ78yJ9aRBP8sLg_s-dMNd9b'
      },
      body: JSON.stringify({
        complaint: caseData.complaint,
        plaintiff: caseData.plaintiff,
        defendant: caseData.defendant || 'Unknown',
        evidence: evidenceList.map(e => e.description),
        jury_percent: totalVotes > 0 ? Math.round((guiltyVotes / totalVotes) * 100) : 50
      })
    })
    const v = await res.json()
    setVerdict(v)
    setVerdictLoading(false)
  }

  if (notFound) return <div className="nc-page"><div className="nc-shell"><p>❌ Case not found.</p></div></div>
  if (loading) return <div className="nc-page"><div className="nc-shell"><p>🔨 Loading courtroom...</p></div></div>

  const totalVotes = guiltyVotes + notGuiltyVotes
  const guiltyPct = totalVotes > 0 ? Math.round((guiltyVotes / totalVotes) * 100) : 0
  const outcomeIsGuilty = verdict?.verdict?.toLowerCase().includes('guilty') && !verdict?.verdict?.toLowerCase().includes('not guilty')
  const laws = LAW_BOOK[caseData.category] ?? LAW_BOOK.Roommate
  const filedDate = new Date(caseData.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const proceedings = [
    { speaker: 'Judge', time: '', text: `Court is now in session for Case #${caseData.case_code}. Let both parties present their arguments.` },
    { speaker: caseData.plaintiff, time: '', text: caseData.complaint }
  ]

  return (
    <div className="nc-page">
      <div className="nc-shell">
        {/* Nav */}
        <div className="nc-nav">
          <div className="nc-nav-logo">⚖️ NAATILE COURT</div>
          <div className="nc-nav-tabs">
            <span className="nc-nav-tab active">🏛️ Courtroom</span>
            <span className="nc-nav-tab">📋 Case File</span>
            <span className="nc-nav-tab">📖 Law Book</span>
            <span className="nc-nav-tab">👥 Leaderboard</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className="nc-case-badge">
              <b>Case #{caseData.case_code}</b><br />Filed {filedDate}
            </div>
            <button className="nc-btn" onClick={() => navigate('/')}>Exit Court</button>
          </div>
        </div>

        {/* Hero */}
        <div className="nc-hero">
          <h1 className="nc-hero-title">നാട്ടിലെ COURT</h1>
          <p className="nc-hero-sub">Small cases. Big drama.</p>
        </div>

        {/* Plaintiff | Proceedings + Evidence | Defendant */}
        <div className="nc-grid-3">
          <div className="nc-panel">
            <h3>🙋 Plaintiff</h3>
            <div className="nc-party-avatar" style={{ background: AVATAR_COLORS[0] }}>
              {caseData.plaintiff?.[0]?.toUpperCase() ?? '?'}
            </div>
            <p className="nc-party-name">{caseData.plaintiff}</p>
            <p className="nc-party-quote">"{caseData.complaint.slice(0, 80)}{caseData.complaint.length > 80 ? '...' : ''}"</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="nc-panel">
              <h3>🗣️ Court Proceedings</h3>
              <div className="nc-proceedings">
                {proceedings.map((p, i) => (
                  <div className="nc-proceedings-item" key={i}>
                    <span className="nc-proceedings-speaker">{p.speaker}</span>
                    <span className="nc-proceedings-time">{p.time}</span>
                    <div>{p.text}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="nc-panel">
              <div className="nc-panel-header-row">
                <h3>📎 Evidence</h3>
              </div>
              {evidenceList.length === 0 && <p className="nc-empty-note">No evidence entered into the record yet.</p>}
              <div className="nc-evidence-grid">
                {evidenceList.map(e => (
  <div className="nc-evidence-tile" key={e.id}>
    {e.file_url && (
      <img src={e.file_url} alt="evidence" style={{ maxWidth: '100%', borderRadius: 6, marginBottom: 6 }} />
    )}
    {e.description}
  </div>
))}
              </div>
              {isPlaintiff && (
                <>
                <input
  type="file"
  accept="image/*"
  onChange={e => setEvidenceFile(e.target.files?.[0] ?? null)}
  className="nc-textarea"
  style={{ marginBottom: 8 }}
/>
                  <textarea
                    className="nc-textarea"
                    placeholder="Describe a piece of evidence..."
                    rows={2}
                    value={evidenceText}
                    onChange={e => setEvidenceText(e.target.value)}
                  />
                  <button className="nc-btn" onClick={handleAddEvidence} disabled={savingEvidence}>
                    {savingEvidence ? 'Adding...' : '+ Add Evidence'}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="nc-panel">
            <h3>🙎 Defendant</h3>
            <div className="nc-party-avatar" style={{ background: AVATAR_COLORS[1] }}>
              {caseData.defendant?.[0]?.toUpperCase() ?? '?'}
            </div>
            <p className="nc-party-name">{caseData.defendant || 'Unknown Defendant'}</p>
            <p className="nc-empty-note">No statement submitted yet.</p>
          </div>
        </div>

        {/* Witnesses | Jury | Laws */}
        <div className="nc-grid-3b">
          <div className="nc-panel">
            <h3>🎙️ Witnesses</h3>
            {WITNESS_PERSONAS.map(p => (
              <div className="nc-witness-row" key={p.name}>
                <div className="nc-witness-avatar">{p.name[0]}</div>
                <div className="nc-witness-info">
                  <div className="nc-witness-name">{p.name}</div>
                  <div className="nc-witness-tagline">{p.tagline}</div>
                </div>
                <button className="nc-btn-small" onClick={() => handleSummon(p)} disabled={summoning === p.name}>
                  {summoning === p.name ? '...' : 'Summon'}
                </button>
              </div>
            ))}
            {witnessList.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {witnessList.map(w => (
                  <div className="nc-evidence-tile" key={w.id} style={{ marginBottom: 8 }}>
                    <strong>{w.witness_name}:</strong> {w.statement}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="nc-panel">
            <h3>👥 Jury Panel ({totalVotes} voted)</h3>
            <div className="nc-jury-avatars">
              {Array.from({ length: Math.max(totalVotes, 5) }).slice(0, 5).map((_, i) => {
                const voted = i < totalVotes
                return (
                  <div className="nc-juror" key={i}>
                    <div className={`nc-juror-circle ${voted ? '' : 'awaiting'}`}>{i + 1}</div>
                    <span className={`nc-juror-tag ${voted ? 'voted' : 'awaiting'}`}>{voted ? 'Voted' : 'Waiting'}</span>
                  </div>
                )
              })}
            </div>

            <p className="nc-empty-note" style={{ marginBottom: 8 }}>
              {isPlaintiff ? 'You filed this case, so you do not get a vote.' : hasVoted ? 'Your vote has been recorded.' : 'Cast your vote based on the evidence above.'}
            </p>

            <div className="nc-vote-row">
              <button className="nc-vote-btn nc-vote-guilty" disabled={isPlaintiff || hasVoted} onClick={() => handleVote('guilty')}>Guilty</button>
              <button className="nc-vote-btn nc-vote-notguilty" disabled={isPlaintiff || hasVoted} onClick={() => handleVote('not_guilty')}>Not Guilty</button>
            </div>
            <p className="nc-empty-note" style={{ marginTop: 8 }}>Guilty {guiltyPct}% · Not Guilty {100 - guiltyPct}%</p>
          </div>

          <div className="nc-panel">
            <h3>📖 Relevant Laws</h3>
            {laws.map(l => (
              <div className="nc-law-item" key={l.section}>
                <span className="nc-law-section">{l.section} — {l.title}</span>
                <span className="nc-law-punishment">Punishment: {l.punishment}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Deliver + Verdict */}
        {!verdict && isPlaintiff && (
          <div className="nc-deliver-wrap">
            <button className="nc-gavel-btn" onClick={getVerdict} disabled={verdictLoading}>
              {verdictLoading ? 'The court is deliberating...' : 'Deliver Verdict 🔨'}
            </button>
          </div>
        )}

        {verdict && (
          <div className={`nc-verdict-strip ${outcomeIsGuilty ? 'is-guilty' : 'is-notguilty'}`}>
            <div className="nc-verdict-cols">
              <div>
                <p className="nc-verdict-label">⚖️ Verdict</p>
                <div className={`nc-verdict-stamp ${outcomeIsGuilty ? '' : 'is-notguilty'}`}>{verdict.verdict}</div>
                <p className="nc-reasoning">{verdict.reasoning}</p>
              </div>
              <div>
                <p className="nc-verdict-label">🔨 Punishment</p>
                <p className="nc-punishment-text">{verdict.punishment}</p>
                <p className="nc-reasoning">Cited under: {verdict.fictional_law}</p>
              </div>
            </div>
            <p className="nc-verdict-quote">"{verdict.reasoning}" — Hon. Naatile Judge</p>
          </div>
        )}
      </div>
    </div>
  )
}