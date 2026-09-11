export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  onClick,
  disabled = false,
  className = '',
}) {
  const baseStyles =
    'px-8 py-3 rounded-panel font-display font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-panel active:scale-[0.98]';

  const variants = {
    primary:
      'bg-gradient-to-b from-brass-light to-brass text-ink hover:from-brass hover:to-brass-dark hover:shadow-lg border border-brass-light/40',
    secondary:
      'border-2 border-leather text-parchment hover:bg-leather/30 hover:border-maroon',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
