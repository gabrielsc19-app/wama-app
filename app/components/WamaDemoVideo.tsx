"use client";

type WamaDemoVideoProps = {
  caption?: string;
  className?: string;
};

export default function WamaDemoVideo({
  caption = "Demostración del entorno WAMA Sales Hub con datos completamente ficticios.",
  className = "",
}: WamaDemoVideoProps) {
  return (
    <div className={className}>
      <div className="overflow-hidden rounded-[1.75rem] border border-[#D3D8DE] bg-black shadow-[0_35px_100px_rgba(11,12,14,0.2)]">
        <video
          autoPlay
          muted
          loop
          controls
          preload="auto"
          playsInline
          className="aspect-video w-full bg-black object-contain"
        >
          <source
            src="/videos/wama-sales-demo-v2.mp4"
            type="video/mp4"
          />
          Tu navegador no puede reproducir este video.
        </video>
      </div>

      <p className="mt-4 text-sm leading-6 text-[#737C87]">
        {caption}
      </p>
    </div>
  );
}
