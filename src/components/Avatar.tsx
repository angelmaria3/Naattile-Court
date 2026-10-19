import { useId } from 'react'

export type AvatarSpec = {
  bg: string
  skin: string
  hair: string
  shirt: string
  style: 'short' | 'long' | 'bun' | 'cap' | 'bald' | 'curly'
  glasses?: boolean
  bindi?: boolean
  moustache?: boolean
  beard?: boolean
  headphones?: boolean
}

export const AVATARS: Record<string, AvatarSpec> = {
  Judge: { bg: '#e0b95c', skin: '#c98f64', hair: '#ececec', shirt: '#2b2b2b', style: 'bun', glasses: true, bindi: true },
  Ammachi: { bg: '#f4d9a8', skin: '#c98f64', hair: '#ececec', shirt: '#f7f1e3', style: 'bun', glasses: true, bindi: true },
  'Auto Chettan': { bg: '#f2c94c', skin: '#a8693f', hair: '#1e1511', shirt: '#6b7a4a', style: 'short', moustache: true },
  'Canteen Chettan': { bg: '#e9a07a', skin: '#b97b52', hair: '#1e1511', shirt: '#f4f1ea', style: 'bald', moustache: true },
  'College Friend': { bg: '#9ec9e8', skin: '#d9a077', hair: '#2a1b12', shirt: '#d9534f', style: 'short', headphones: true },
  Anjali: { bg: '#f3b6c8', skin: '#c88d66', hair: '#1b1210', shirt: '#2f7d6d', style: 'long', bindi: true, glasses: true },
  Rohit: { bg: '#b8c4f0', skin: '#b97b52', hair: '#18110d', shirt: '#34495e', style: 'short', glasses: true },
  Meera: { bg: '#f6d58e', skin: '#d9a077', hair: '#241610', shirt: '#c0568a', style: 'bun', bindi: true },
  Vishnu: { bg: '#bfe3b4', skin: '#9c6540', hair: '#1b1210', shirt: '#e0b341', style: 'curly', moustache: true },
  Kiran: { bg: '#c9b6ec', skin: '#c48a60', hair: '#3a2a1c', shirt: '#222222', style: 'cap', beard: true },
}

const SKINS = ['#d9a077', '#c98f64', '#b97b52', '#a8693f', '#8d5a3a']
const HAIRS = ['#18110d', '#241610', '#3a2a1c']
const BLUE_SHIRTS = ['#3b6ea5', '#2f7d6d', '#5b4b9a']
const RED_SHIRTS = ['#a63d40', '#c0568a', '#b5651d']
const STYLES: AvatarSpec['style'][] = ['short', 'long', 'curly', 'bun', 'cap']

const hash = (s: string) => {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}

export function avatarFromName(name: string, role: 'plaintiff' | 'defendant'): AvatarSpec {
  const h = hash(name.toLowerCase() + role)
  const pick = <T,>(arr: T[], shift: number) => arr[(h >>> shift) % arr.length]
  const style = pick(STYLES, 3)
  return {
    bg: role === 'plaintiff' ? '#ffe29a' : '#f2b8a8',
    skin: pick(SKINS, 0),
    hair: pick(HAIRS, 6),
    shirt: pick(role === 'plaintiff' ? BLUE_SHIRTS : RED_SHIRTS, 9),
    style,
    glasses: (h >>> 12) % 4 === 0,
    moustache: style !== 'long' && style !== 'bun' && (h >>> 14) % 3 === 0,
    bindi: (style === 'long' || style === 'bun') && (h >>> 16) % 2 === 0,
  }
}

// Works for "Ammachi", "Ammachi (വാദി)", juror names, etc.
export function specFor(name: string): AvatarSpec {
  const base = name.split(' (')[0].trim()
  return AVATARS[base] ?? avatarFromName(base, 'plaintiff')
}

export default function Avatar({
  spec,
  size = 40,
  label,
  ring,
}: {
  spec: AvatarSpec
  size?: number
  label?: string
  ring?: string
}) {
  const uid = useId().replace(/:/g, '')
  const clip = `av-${uid}`
  const { bg, skin, hair, shirt, style } = spec
  const ink = '#2b1a10'
  const front = 'M20 29 C19 14 45 14 44 29 C41 23 37 21 32 21 C27 21 23 23 20 29 Z'

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label={label ?? 'avatar'}
      style={{
        flexShrink: 0,
        borderRadius: '50%',
        boxShadow: `0 0 0 2px ${ring ?? 'rgba(224,185,92,0.75)'}`,
      }}
    >
      <defs>
        <clipPath id={clip}>
          <circle cx="32" cy="32" r="32" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width="64" height="64" fill={bg} />

        {style === 'long' && <path d="M18 30 C16 48 20 54 24 57 L40 57 C44 54 48 48 46 30 Z" fill={hair} />}
        {style === 'bun' && <circle cx="32" cy="12" r="5.5" fill={hair} />}
        {style === 'curly' && (
          <g fill={hair}>
            <circle cx="22" cy="22" r="5" />
            <circle cx="27" cy="17" r="5" />
            <circle cx="33" cy="15" r="5" />
            <circle cx="39" cy="17" r="5" />
            <circle cx="43" cy="23" r="5" />
          </g>
        )}

        <path d="M6 64 C6 50 18 46 32 46 C46 46 58 50 58 64 Z" fill={shirt} />
        <rect x="28" y="38" width="8" height="10" rx="3" fill={skin} />
        <rect x="28" y="38" width="8" height="4" fill="#000" opacity="0.12" />

        <circle cx="20.5" cy="31" r="2.6" fill={skin} />
        <circle cx="43.5" cy="31" r="2.6" fill={skin} />
        <ellipse cx="32" cy="30" rx="12" ry="14" fill={skin} />

        {(style === 'short' || style === 'long' || style === 'bun') && <path d={front} fill={hair} />}
        {style === 'curly' && <path d="M21 27 C22 20 42 20 43 27 C40 23 24 23 21 27 Z" fill={hair} />}
        {style === 'cap' && (
          <g fill={hair}>
            <path d="M19.5 25 C19.5 11 44.5 11 44.5 25 Z" />
            <path d="M32 24 H51 C51 27 46 28.5 32 28.5 Z" />
            <path d="M19.5 25 H44.5 V26.5 H19.5 Z" fill="#000" opacity="0.18" />
          </g>
        )}

        {spec.beard && <path d="M21 32 C21 47 43 47 43 32 C40 41 24 41 21 32 Z" fill={hair} opacity="0.95" />}

        <path d="M23.5 25.5 Q27 24 30 25.5" stroke={ink} strokeWidth="1.1" fill="none" strokeLinecap="round" />
        <path d="M34 25.5 Q37 24 40.5 25.5" stroke={ink} strokeWidth="1.1" fill="none" strokeLinecap="round" />
        <circle cx="27.3" cy="30" r="1.5" fill={ink} />
        <circle cx="36.7" cy="30" r="1.5" fill={ink} />
        <path d="M32 31 Q30.8 34.2 33.2 34.2" stroke="#000" strokeOpacity="0.25" strokeWidth="1" fill="none" strokeLinecap="round" />

        {spec.moustache && <path d="M26 35.4 Q32 32.6 38 35.4 Q32 37.4 26 35.4 Z" fill="#1e1511" />}
        <path d="M27 37.6 Q32 41.2 37 37.6" stroke="#7a2e2e" strokeWidth="1.4" fill="none" strokeLinecap="round" />

        {spec.glasses && (
          <g fill="none" stroke="#222" strokeWidth="1.2">
            <circle cx="27.3" cy="30" r="4.3" />
            <circle cx="36.7" cy="30" r="4.3" />
            <path d="M31.6 30 H32.4" />
          </g>
        )}
        {spec.bindi && <circle cx="32" cy="24.2" r="1.3" fill="#c62828" />}
        {spec.headphones && (
          <g>
            <path d="M19 28 C19 9 45 9 45 28" fill="none" stroke="#222" strokeWidth="2.4" />
            <rect x="16" y="27" width="5" height="9" rx="2.5" fill="#222" />
            <rect x="43" y="27" width="5" height="9" rx="2.5" fill="#222" />
          </g>
        )}
      </g>
    </svg>
  )
}