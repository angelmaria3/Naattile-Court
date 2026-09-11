export default function ParchmentPlaque({ children, className = '', rotate = true }) {
  return (
    <div
      className={`bg-parchment text-maroon font-display shadow-inset rounded-sm px-4 py-2 border border-parchment-shadow ${
        rotate ? '-rotate-1' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
