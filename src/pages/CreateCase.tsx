import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function CreateCase() {
  const navigate = useNavigate()
  const [plaintiff, setPlaintiff] = useState('')
  const [category, setCategory] = useState('Roommate')
  const [complaint, setComplaint] = useState('')
  const [loading, setLoading] = useState(false)
  const [caseCode, setCaseCode] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase
      .from('cases')
      .insert({ plaintiff, category, complaint })
      .select()
      .single()

    setLoading(false)

    if (error) {
      alert('Error creating case: ' + error.message)
      return
    }

    setCaseCode(data.case_code)
  }

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 20 }}>
      {!caseCode ? (
        <form onSubmit={handleSubmit}>
          <h1>⚖️ File Your Case</h1>
          <input
            placeholder="Your name (plaintiff)"
            value={plaintiff}
            onChange={e => setPlaintiff(e.target.value)}
            required
            style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }}
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }}
          >
            <option>Roommate</option>
            <option>Family</option>
            <option>Friends</option>
            <option>Money</option>
            <option>Love</option>
          </select>
          <textarea
            placeholder="What happened?"
            value={complaint}
            onChange={e => setComplaint(e.target.value)}
            required
            rows={5}
            style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }}
          />
          <button type="submit" disabled={loading} style={{ padding: '10px 20px' }}>
            {loading ? 'Filing...' : 'File Case 🔨'}
          </button>
        </form>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <h2>Your Case Code:</h2>
          <div style={{ fontSize: 40, fontWeight: 'bold', letterSpacing: 4, margin: '20px 0' }}>
            {caseCode}
          </div>
          <p>Share this code with the defendant so they can join the courtroom.</p>
          <button onClick={() => navigate(`/courtroom/${caseCode}`)} style={{ padding: '10px 20px', marginTop: 10 }}>
            Enter Courtroom →
          </button>
        </div>
      )}
    </div>
  )
}