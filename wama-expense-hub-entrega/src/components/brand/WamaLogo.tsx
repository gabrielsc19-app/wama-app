import Image from "next/image";
import Link from "next/link";

type WamaLogoVariant = "principal" | "horizontal" | "isotipo";

type WamaLogoProps = {
  variant?: WamaLogoVariant;
  href?: string;
  className?: string;
  priority?: boolean;
};

const logoMap: Record<
  WamaLogoVariant,
  {
    src: string;
    width: number;
    height: number;
    alt: string;
  }
> = {
  principal: {
    src: "/brand/wama-logo-principal.svg",
    width: 420,
    height: 180,
    alt: "WAMA - Warn and Manage",
  },
  horizontal: {
    src: "/brand/wama-logo-horizontal.svg",
    width: 280,
    height: 72,
    alt: "WAMA",
  },
  isotipo: {
    src: "/brand/wama-isotipo.svg",
    width: 96,
    height: 96,
    alt: "WAMA isotipo",
  },
};

export default function WamaLogo({
  variant = "horizontal",
  href = "/",
  className = "",
  priority = false,
}: WamaLogoProps) {
  const logo = logoMap[variant];

  const image = (
    <Image
      src={logo.src}
      width={logo.width}
      height={logo.height}
      alt={logo.alt}
      priority={priority}
      className={className}
    />
  );

  if (!href) return image;

  return (
    <Link href={href} aria-label="Ir al inicio de WAMA">
      {image}
    </Link>
  );
}