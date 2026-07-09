import Link from "next/link";
import { ReactNode } from "react";

type WamaButtonProps = {
  href?: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

export default function WamaButton({
  href,
  children,
  variant = "primary",
  className = "",
}: WamaButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200";

  const variants = {
    primary:
      "bg-[#00E5D6] text-[#0B0C0E] hover:shadow-[0_0_30px_rgba(0,229,214,0.35)]",
    secondary:
      "border border-white/15 bg-white/[0.04] text-[#F5F6F7] hover:border-[#00E5D6]/50 hover:bg-[#00E5D6]/10",
    ghost: "text-[#C4C7CC] hover:text-[#F5F6F7]",
  };

  const classes = `${base} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return <button className={classes}>{children}</button>;
}