import Link from "next/link";
import { ArrowRight, Building2, Check, Layers3, ReceiptText, ShieldAlert, Users } from "lucide-react";
import WamaShell from "../src/components/brand/WamaShell";

const modules = [
  {
    name: "Sales Hub", eyebrow: "Gestión comercial", icon: Users,
    title: "Convierte oportunidades en ventas con seguimiento real.",
    description: "Centraliza prospectos, negocios, tareas, propuestas, adjuntos e historial en un pipeline compartido.",
    features: ["Pipeline y deals", "Tareas y seguimiento", "Indicadores comerciales"],
    price: "US$10", href: "/modulos/sales-hub", trial: "sales",
  },
  {
    name: "Expense Hub", eyebrow: "Rendición de gastos", icon: ReceiptText,
    title: "Rinde, aprueba y controla gastos desde cualquier equipo.",
    description: "Fotografía documentos, extrae sus datos, envía rendiciones y conserva cada aprobación con evidencia.",
    features: ["Captura y lectura inteligente", "Aprobación y observaciones", "Control e historial"],
    price: "US$10", href: "/modulos/expense-hub", trial: "expense",
  },
  {
    name: "Operations Hub", eyebrow: "Gestión operacional", icon: ShieldAlert,
    title: "Reporta, asigna y controla cada incidente operacional.",
    description: "Ordena casos, alertas urgentes, equipos, responsables, evidencias, plazos y trazabilidad en terreno.",
    features: ["Casos y alertas urgentes", "Equipos y responsables", "SLA, evidencia e informes"],
    price: "US$10", href: "/modulos/operacion", trial: "operations",
  },
];

export default function HomePage() {
  return <WamaShell><main className="overflow-hidden bg-white text-[#0B0C0E]">
    <section className="relative bg-[#0B0C0E] text-white">
      <div className="pointer-events-none absolute inset-0"><div className="absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-[#00E5D6]/10 blur-[150px]"/><div className="absolute -left-48 bottom-0 h-[26rem] w-[26rem] rounded-full bg-[#00E5D6]/10 blur-[140px]"/></div>
      <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-6 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:py-28">
        <div><p className="text-sm font-black uppercase tracking-[.24em] text-[#00E5D6]">WAMA · Warn and Manage</p><h1 className="mt-6 max-w-5xl text-5xl font-black leading-[.94] tracking-[-.065em] sm:text-6xl md:text-7xl">Gestiona tu empresa módulo por módulo.</h1><p className="mt-7 max-w-3xl text-lg leading-8 text-[#B7BEC8]">Sales Hub, Expense Hub y Operations Hub dentro de un mismo portal. Activa solo las herramientas que tu empresa necesita.</p><div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link href="/trial" className="rounded-full bg-[#00E5D6] px-8 py-4 text-center text-sm font-black text-[#0B0C0E]">Probar gratis 15 días</Link><Link href="/acceso" className="rounded-full border border-white/20 px-8 py-4 text-center text-sm font-black text-white">Ingresar a mi portal</Link></div><a href="mailto:contacto@wamaapp.com" className="mt-6 inline-flex text-sm font-bold text-[#00E5D6]">¿Tienes consultas? contacto@wamaapp.com</a></div>
        <div className="rounded-[2rem] border border-white/10 bg-white/[.05] p-5 shadow-2xl backdrop-blur sm:p-7"><div className="flex items-center justify-between border-b border-white/10 pb-5"><div><p className="text-xs font-black uppercase tracking-[.2em] text-[#00E5D6]">Portal de empresa</p><p className="mt-2 text-2xl font-black">Todo WAMA en un lugar</p></div><Building2 className="h-9 w-9 text-[#00E5D6]"/></div><div className="mt-5 grid gap-3">{modules.map(({name,eyebrow,icon:Icon})=><div key={name} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#111419] p-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#00E5D6]/15 text-[#00E5D6]"><Icon className="h-5 w-5"/></span><div><p className="font-black">{name}</p><p className="text-xs text-[#9FA8B2]">{eyebrow}</p></div><ArrowRight className="ml-auto h-4 w-4 text-[#00E5D6]"/></div>)}</div></div>
      </div>
    </section>

    <section id="modulos" className="bg-[#F5F6F7]"><div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:py-28"><p className="text-sm font-black uppercase tracking-[.22em] text-[#008F87]">Módulos activos</p><h2 className="mt-4 max-w-4xl text-4xl font-black leading-tight tracking-[-.055em] md:text-6xl">Elige uno o activa los tres.</h2><p className="mt-5 max-w-3xl text-lg leading-8 text-[#66707C]">Cada módulo funciona de forma independiente, pero todos viven dentro del mismo portal WAMA.</p><div className="mt-12 grid gap-5 lg:grid-cols-3">{modules.map((module)=><ModuleCard key={module.name} {...module}/>)}</div></div></section>

    <section className="border-y border-[#DDE3E7] bg-[#0B0C0E] text-white"><div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:py-24"><div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-black uppercase tracking-[.22em] text-[#00E5D6]">Precios simples</p><h2 className="mt-4 text-4xl font-black tracking-[-.05em] md:text-5xl">15 días gratis por módulo.</h2><p className="mt-4 text-[#B7BEC8]">10 licencias iniciales por módulo. Durante la prueba pagas US$0.</p></div><Link href="/trial" className="rounded-full bg-[#00E5D6] px-8 py-4 text-center text-sm font-black text-[#0B0C0E]">Comenzar prueba gratuita</Link></div><div className="mt-10 grid gap-3 md:grid-cols-3">{modules.map(m=><div key={m.name} className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><p className="font-black">{m.name}</p><p className="mt-3 text-3xl font-black">{m.price}<span className="text-sm text-[#AEB6BF]"> / usuario / mes</span></p></div>)}</div></div></section>

    <section id="contacto" className="bg-[#F5F6F7]"><div className="mx-auto grid max-w-7xl gap-8 px-5 py-20 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="text-sm font-black uppercase tracking-[.22em] text-[#008F87]">Contacto</p><h2 className="mt-4 text-4xl font-black tracking-[-.05em] md:text-5xl">¿Tienes consultas sobre WAMA?</h2><p className="mt-5 text-lg text-[#66707C]">Escríbenos para resolver dudas sobre módulos, funcionalidades y planes.</p><a href="mailto:contacto@wamaapp.com" className="mt-4 inline-flex text-lg font-black underline decoration-[#00E5D6] decoration-2 underline-offset-4">contacto@wamaapp.com</a></div><a href="mailto:contacto@wamaapp.com?subject=Consulta%20sobre%20WAMA" className="rounded-full bg-[#0B0C0E] px-8 py-4 text-center text-sm font-black !text-white">Enviar consulta →</a></div></section>
  </main></WamaShell>;
}

function ModuleCard(module:(typeof modules)[number]){const Icon=module.icon;return <article className="flex h-full flex-col rounded-[2rem] border border-[#D8DFE4] bg-white p-6 shadow-[0_18px_55px_rgba(11,12,14,.07)] sm:p-7"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#00E5D6]/15 text-[#008F87]"><Icon className="h-6 w-6"/></span><p className="mt-6 text-xs font-black uppercase tracking-[.18em] text-[#008F87]">{module.eyebrow}</p><h3 className="mt-2 text-3xl font-black">{module.name}</h3><p className="mt-4 text-xl font-black leading-snug">{module.title}</p><p className="mt-4 leading-7 text-[#66707C]">{module.description}</p><ul className="mt-6 space-y-3">{module.features.map(f=><li key={f} className="flex gap-3 text-sm font-bold"><Check className="h-5 w-5 shrink-0 text-[#008F87]"/>{f}</li>)}</ul><div className="mt-auto pt-8"><p className="text-3xl font-black">{module.price}<span className="text-sm text-[#66707C]"> / usuario / mes</span></p><p className="mt-2 text-sm text-[#66707C]">10 licencias · prueba gratis 15 días</p><div className="mt-5 flex gap-3"><Link href={`/trial?module=${module.trial}`} className="flex-1 rounded-full bg-[#00E5D6] px-5 py-3 text-center text-sm font-black">Probar gratis</Link><Link href={module.href} className="rounded-full border border-[#CBD3D9] px-5 py-3 text-center text-sm font-black">Conocer</Link></div></div></article>}

function Flow({number,title,text}:{number:string;title:string;text:string}){return <div className="grid gap-3 border-b border-[#DDE3E7] py-5 last:border-0 sm:grid-cols-[3rem_.65fr_1fr]"><p className="font-black text-[#008F87]">{number}</p><p className="font-black">{title}</p><p className="text-[#66707C]">{text}</p></div>}
