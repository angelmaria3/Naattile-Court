export default function WoodPanel({ children, className = '' }) {
  return (
    <div
      className={`relative bg-wood-mid border-2 border-wood-grain shadow-panel rounded-panel p-6 md:p-8 ${className}`}
    >
      {/* Brass Corner Rivets */}
      <div className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-brass-light to-brass-dark shadow-sm" />
      <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-brass-light to-brass-dark shadow-sm" />
      <div className="absolute bottom-2 left-2 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-brass-light to-brass-dark shadow-sm" />
      <div className="absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-brass-light to-brass-dark shadow-sm" />

      {children}
    </div>
  );
}
