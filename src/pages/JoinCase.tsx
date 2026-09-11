import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function JoinCase() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [defendantName, setDefendantName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const upperCode = code.trim().toUpperCase()

    const { data, error: fetchError } = await supabase
      .from('cases')
      .select('*')
      .eq('case_code', upperCode)
      .single()

    if (fetchError || !data) {
      setLoading(false)
      setError('No case found with that code.')
      return
    }

    await supabase
      .from('cases')
      .update({ defendant: defendantName })
      .eq('case_code', upperCode)

    setLoading(false)
    navigate(`/courtroom/${upperCode}`)
  }

  return (
    <form onSubmit={handleJoin} style={{ maxWidth: 400, margin: '0 auto', padding: 20 }}>
      <h1>⚖️ Enter Case Code</h1>
      <input
        placeholder="Case code (e.g. A1B2C3)"
        value={code}
        onChange={e => setCode(e.target.value)}
        required
        style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }}
      />
      <input
        placeholder="Your name"
        value={defendantName}
        onChange={e => setDefendantName(e.target.value)}
        required
        style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }}
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit" disabled={loading} style={{ padding: '10px 20px' }}>
        {loading ? 'Joining...' : 'Join Courtroom'}
      </button>
    </form>
  )
}