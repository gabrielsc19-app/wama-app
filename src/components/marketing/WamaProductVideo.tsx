"use client";

type Props = {
  src: string;
  caption: string;
  poster?: string;
};

export default function WamaProductVideo({ src, caption, poster }: Props) {
  return (
    <div>
      <div className="overflow-hidden rounded-[1.75rem] border border-[#D3D8DE] bg-black shadow-[0_35px_100px_rgba(11,12,14,0.2)]">
        <video autoPlay muted loop controls preload="metadata" playsInline poster={poster} className="aspect-video w-full bg-black object-contain">
          <source src={src} type="video/mp4" />
          Tu navegador no puede reproducir este video.
        </video>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#737C87]">{caption}</p>
    </div>
  );
}
