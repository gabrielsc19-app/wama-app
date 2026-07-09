import { ReactNode } from "react";

type WamaCardProps = {
  children: ReactNode;
  className?: string;
};

export default function WamaCard({ children, className = "" }: WamaCardProps) {
  return (
    <div
      className={`
        rounded-3xl border border-white/10
        bg-white/[0.035]
        shadow-[0_20px_80px_rgba(0,0,0,0.35)]
        backdrop-blur-xl
        ${className}
      `}
    >
      {children}
    </div>
  );
}