import WamaShell from "../../src/components/brand/WamaShell";
import WamaButton from "../../src/components/brand/WamaButton";
import WamaCard from "../../src/components/brand/WamaCard";

export default function SalesHubAccessPublicPage() {
  return (
    <WamaShell>
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex rounded-full border border-[#00E5D6]/30 bg-[#00E5D6]/10 px-4 py-2 text-sm font-semibold text-[#00E5D6]">
            Sales Hub WAMA
          </div>

          <h1 className="text-5xl font-black leading-tight tracking-[-0.04em] text-[#F5F6F7] md:text-7xl">
            Accede a tu portal comercial.
          </h1>

          <p className="mt-6 text-lg leading-8 text-[#C4C7CC]">
            Si tu empresa ya activó una prueba gratuita o tiene una licencia
            contratada, ingresa al portal privado con tu correo y clave.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <WamaButton href="/login">Accede a tu portal</WamaButton>

            <WamaButton href="/trial" variant="secondary">
              Activar prueba gratis
            </WamaButton>
          </div>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-3">
          <WamaCard className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 text-sm font-black text-[#00E5D6]">
              01
            </div>

            <h3 className="text-2xl font-black text-[#F5F6F7]">
              Portal privado
            </h3>

            <p className="mt-4 text-sm leading-7 text-[#C4C7CC]">
              WAMA no muestra información de empresas antes del inicio de sesión.
            </p>
          </WamaCard>

          <WamaCard className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 text-sm font-black text-[#00E5D6]">
              02
            </div>

            <h3 className="text-2xl font-black text-[#F5F6F7]">
              Acceso seguro
            </h3>

            <p className="mt-4 text-sm leading-7 text-[#C4C7CC]">
              Cada usuario accede con correo y clave asignados a su empresa.
            </p>
          </WamaCard>

          <WamaCard className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#00E5D6]/30 bg-[#00E5D6]/10 text-sm font-black text-[#00E5D6]">
              03
            </div>

            <h3 className="text-2xl font-black text-[#F5F6F7]">
              Módulo contratado
            </h3>

            <p className="mt-4 text-sm leading-7 text-[#C4C7CC]">
              Después del login, cada empresa ve solo sus módulos activos y sus datos.
            </p>
          </WamaCard>
        </div>
      </section>
    </WamaShell>
  );
}