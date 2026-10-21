import { Users } from 'lucide-react'
import Avatar, { specFor } from './Avatar'

export type JurorView = {
  id: string
  name: string
  tagline: string
  status: 'idle' | 'loading' | 'done' | 'error'
  vote?: 'guilty' | 'not_guilty'
  reasoning?: string
  error?: string
}

type Props = {
  jurors: JurorView[]
  canConvene: boolean
  conveneHint?: string
  onConvene: () => void
  onRetry: (id: string) => void
}

export default function JuryPanel({ jurors, canConvene, conveneHint, onConvene, onRetry }: Props) {
  const done = jurors.filter((j) => j.status === 'done')
  const guilty = done.filter((j) => j.vote === 'guilty').length
  const notGuilty = done.length - guilty
  const guiltyPct = done.length ? Math.round((guilty / done.length) * 100) : 0
  const anyLoading = jurors.some((j) => j.status === 'loading')
  const anyError = jurors.some((j) => j.status === 'error')
  const nothingStarted = jurors.every((j) => j.status === 'idle')
  const needsAction = jurors.some((j) => j.status === 'idle' || j.status === 'error')

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs uppercase font-extrabold text-[#ffdf79] flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          <span>ജൂറി പാനൽ (JURY) — {done.length}/{jurors.length} Votes</span>
        </span>
        <div className="flex gap-3 text-xs font-mono font-black">
          <span className="text-red-400">
            Guilty: {guilty}
            {done.length > 0 && ` (${guiltyPct}%)`}
          </span>
          <span className="text-green-400">
            Not Guilty: {notGuilty}
            {done.length > 0 && ` (${100 - guiltyPct}%)`}
          </span>
        </div>
      </div>

      <div className="w-full h-2 bg-[#1f1106] rounded-full overflow-hidden flex border border-[#e0b95c]/40">
        {done.length > 0 && (
          <>
            <div style={{ width: `${guiltyPct}%` }} className="bg-red-600 transition-all duration-700" />
            <div style={{ width: `${100 - guiltyPct}%` }} className="bg-green-600 transition-all duration-700" />
          </>
        )}
      </div>

      <div className="jury-box">
  {jurors.map((j) => {
    const ringColor = j.status === 'done' ? (j.vote === 'guilty' ? '#ef4444' : '#22c55e') : undefined
    return (
      <div key={j.id} className={`jury-seat ${j.status === 'loading' ? 'jury-thinking' : ''}`}>
        {j.status === 'done' && (
          <span className={`jury-chip ${j.vote === 'guilty' ? 'chip-guilty' : 'chip-ng'}`}>
            {j.vote === 'guilty' ? 'G' : 'NG'}
          </span>
        )}
        {j.status === 'loading' && <span className="jury-chip chip-think">…</span>}
        <div className={j.status === 'idle' ? 'opacity-60 grayscale' : ''}>
          <Avatar spec={specFor(j.name)} size={38} label={j.name} ring={ringColor} />
        </div>
        <span className="jury-name">{j.name}</span>
      </div>
    )
  })}
</div>

      {anyLoading && (
        <p className="text-[10px] text-[#ffdf79] italic animate-pulse">
          Jurors are reading the case file and deliberating…
        </p>
      )}

      <div className="max-h-[14vh] overflow-y-auto pr-1 space-y-1.5 custom-scroll">
        {jurors.map((j) => {
          const tone =
            j.status === 'done'
              ? j.vote === 'guilty'
                ? 'bg-red-950/40 border-red-500/60'
                : 'bg-green-950/40 border-green-500/60'
              : j.status === 'error'
              ? 'bg-[#3d1414] border-red-500/70'
              : 'bg-[#4a2e1a] border-[#a67432]'
          const ring =
            j.status === 'done' ? (j.vote === 'guilty' ? '#ef4444' : '#22c55e') : undefined

          return (
            <div key={j.id} className={`flex items-start gap-2 rounded border p-1.5 transition ${tone}`}>
              <div className={j.status === 'idle' ? 'opacity-60 grayscale' : ''}>
                <Avatar spec={specFor(j.name)} size={36} label={j.name} ring={ring} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-white truncate">
                    {j.name} <span className="text-[9px] font-normal text-white/50">· {j.tagline}</span>
                  </p>
                  {j.status === 'done' && (
                    <span
                      className={`flex-shrink-0 text-[10px] font-black px-2 py-0.5 rounded border ${
                        j.vote === 'guilty'
                          ? 'bg-red-900/60 border-red-500 text-red-200'
                          : 'bg-green-900/60 border-green-500 text-green-200'
                      }`}
                    >
                      {j.vote === 'guilty' ? 'GUILTY' : 'NOT GUILTY'}
                    </span>
                  )}
                </div>

                {j.status === 'done' && (
                  <p className="font-malayalam text-[11px] text-[#fff3d6] leading-snug mt-0.5 animate-fade-in">
                    {j.reasoning}
                  </p>
                )}
                {j.status === 'loading' && (
                  <p className="text-[11px] text-[#ffdf79] italic animate-pulse mt-0.5">Reading the case file…</p>
                )}
                {j.status === 'error' && (
                  <>
                    <p className="text-[11px] text-red-300 mt-0.5">{j.error}</p>
                    <button
                      onClick={() => onRetry(j.id)}
                      className="mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-[#5a381e] hover:bg-[#ffd778] hover:text-[#1c0e04] text-[#ffdf79] border border-[#e0b95c]/60 cursor-pointer transition"
                    >
                      ↻ Retry
                    </button>
                  </>
                )}
                {j.status === 'idle' && (
                  <p className="text-[11px] text-white/40 italic mt-0.5">Waiting to be called…</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {needsAction && (
        <button
          onClick={onConvene}
          disabled={!canConvene || anyLoading}
          className="w-full py-1.5 rounded font-display font-black text-xs uppercase tracking-wider bg-gradient-to-b from-[#ffd778] via-[#e4b248] to-[#be8624] text-[#1c0e04] border border-white/60 hover:brightness-110 active:scale-95 transition cursor-pointer disabled:opacity-50"
        >
          {!canConvene
            ? conveneHint ?? 'Jury unavailable'
            : anyLoading
            ? 'Jury is deliberating…'
            : nothingStarted
            ? '⚖️ Convene the Jury'
            : anyError
            ? '↻ Retry failed jurors'
            : 'Call remaining jurors'}
        </button>
      )}
    </div>
  )
}