import Link from "next/link";

type WamaButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
};

export default function WamaButton({
  href,
  children,
  variant = "primary",
  className = "",
}: WamaButtonProps) {
  const baseClass =
    "wama-button-motion inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-black";

  const variantClass =
    variant === "secondary"
      ? "border border-white/15 bg-white/[0.04] text-[#F5F6F7] hover:border-[#00E5D6]/50 hover:bg-[#00E5D6]/10"
      : "bg-[#00E5D6] text-[#0B0C0E] hover:shadow-[0_0_28px_rgba(0,229,214,0.35)]";

  return (
    <Link href={href} className={`${baseClass} ${variantClass} ${className}`}>
      {children}
    </Link>
  );
}