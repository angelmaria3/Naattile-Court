export default function Seal({ size = 48, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`inline-block ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="46" stroke="#c99a3d" strokeWidth="4" />
      <circle cx="50" cy="50" r="40" stroke="#8a6a28" strokeWidth="2" strokeDasharray="3 3" />
      <path
        d="M35 60 L60 35 L65 40 L40 65 Z"
        fill="#c99a3d"
      />
      <rect x="58" y="30" width="12" height="6" rx="2" transform="rotate(-45 58 30)" fill="#e0b95c" />
      <rect x="25" y="65" width="20" height="4" rx="1" transform="rotate(-45 25 65)" fill="#c99a3d" />
      <text
        x="50"
        y="82"
        textAnchor="middle"
        fill="#c99a3d"
        fontSize="8"
        fontWeight="bold"
        fontFamily="Cinzel"
      >
        NAATILE COURT
      </text>
    </svg>
  );
}
