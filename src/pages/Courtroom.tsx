import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Courtroom() {
  const { caseId } = useParams() // this is actually the case_code
  const [caseData, setCaseData] = useState<any>(null)
  const [verdict, setVerdict] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [verdictLoading, setVerdictLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [isPlaintiff, setIsPlaintiff] = useState(false)

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

      // Check if this browser is the one that created the case
      const localToken = localStorage.getItem(`case_${caseId}_token`)
      setIsPlaintiff(localToken === c.creator_token)

      setLoading(false)
    }
    run()
  }, [caseId])

  const getVerdict = async () => {
    setVerdictLoading(true)

    const res = await fetch(
      'https://fciltngewiorcbhaofsk.supabase.co/functions/v1/judge-verdict',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sb_publishable_obQzJtwbQ78yJ9aRBP8sLg_s-dMNd9b'
        },
        body: JSON.stringify({
          complaint: caseData.complaint,
          plaintiff: caseData.plaintiff,
          defendant: caseData.defendant || 'Unknown',
          evidence: [],
          jury_percent: 50
        })
      }
    )

    const v = await res.json()
    setVerdict(v)
    setVerdictLoading(false)
  }

  if (notFound) return <div style={{ padding: 20 }}>❌ Case not found.</div>
  if (loading) return <div style={{ padding: 20 }}>🔨 Loading courtroom...</div>

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <h1>{caseData.plaintiff} vs {caseData.defendant || 'Unknown Defendant'}</h1>
      <p><em>{caseData.complaint}</em></p>
      <p style={{ color: '#888' }}>Case Code: {caseData.case_code}</p>

      {isPlaintiff ? (
        <div style={{ border: '1px dashed #999', padding: 16, marginTop: 20, borderRadius: 8 }}>
          <h3>📎 Evidence & Witnesses (you filed this case)</h3>
          <p style={{ fontSize: 13, opacity: 0.8 }}>
            Evidence upload and witness statement inputs go here.
          </p>
        </div>
      ) : (
        <div style={{ border: '1px dashed #999', padding: 16, marginTop: 20, borderRadius: 8 }}>
          <h3>🗳️ Jury Panel</h3>
          <p style={{ fontSize: 13, opacity: 0.8 }}>
            Evidence display (read-only) and GUILTY / NOT GUILTY voting go here.
          </p>
        </div>
      )}

      {!verdict && (
        <button onClick={getVerdict} disabled={verdictLoading} style={{ marginTop: 20, padding: '10px 20px' }}>
          {verdictLoading ? 'The court is deliberating...' : 'Get Verdict 🔨'}
        </button>
      )}

      {verdict && (
        <div style={{ border: '2px solid #8B4513', padding: 20, marginTop: 20, borderRadius: 8 }}>
          <h2>🔨 VERDICT</h2>
          <p><strong>{verdict.verdict}</strong></p>
          <p>{verdict.reasoning}</p>
          <p><em>Under the ancient law of: {verdict.fictional_law}</em></p>
          <p><strong>Punishment:</strong> {verdict.punishment}</p>
        </div>
      )}
    </div>
  )
}