export default function BlurredHero({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-wood-dark">
      <div 
        className="fixed inset-0 bg-cover bg-center filter blur-md brightness-50 scale-105"
        style={{ backgroundImage: "url('/hero-courtroom.jpg?v=3')" }}
      />
      <div className="fixed inset-0 bg-gradient-to-t from-wood-dark via-wood-dark/60 to-transparent" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
}
