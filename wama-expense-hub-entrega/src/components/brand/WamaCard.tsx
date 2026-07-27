type WamaCardProps = {
  children: React.ReactNode;
  className?: string;
};

export default function WamaCard({ children, className = "" }: WamaCardProps) {
  return (
    <div
      className={`wama-card-motion rounded-[2rem] border border-white/10 bg-white/[0.035] shadow-[0_24px_80px_rgba(0,0,0,0.20)] ${className}`}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}