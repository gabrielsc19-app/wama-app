"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import WamaLogo from "../components/WamaLogo";

const areas = ["Operaciones", "Mantención", "Seguridad", "Aseo", "Comercial", "Contabilidad", "Administración"];
const problems = ["Alertas desordenadas", "Tareas sin seguimiento", "Falta de evidencia", "Control de sucursales", "Falta de reportes", "Seguimiento comercial débil", "Conciliación manual"];

function priceFor(modules: number, users: number) {
  return modules * Math.ceil(Math.max(users, 10) / 10) * 10;
}

export default function DemoBuilder() {
  const [company, setCompany] = useState("Empresa Demo");
  const [industry, setIndustry] = useState("Retail");
  const [contact, setContact] = useState("Gabriel");
  const [email, setEmail] = useState("contacto@empresa.cl");
  const [phone, setPhone] = useState("+56 9");
  const [users, setUsers] = useState(30);
  const [locations, setLocations] = useState(3);
  const [selectedAreas, setSelectedAreas] = useState(["Operaciones", "Mantención", "Contabilidad"]);
  const [selectedProblems, setSelectedProblems] = useState(["Alertas desordenadas", "Tareas sin seguimiento", "Falta de reportes"]);

  const recommended = useMemo(() => {
    const list = ["Generar Casos", "Control de Tareas", "Reportes Ejecutivos"];
    if (selectedAreas.includes("Comercial")) list.push("Seguimiento Comercial");
    if (selectedAreas.includes("Contabilidad")) list.push("Consolidación Banco");
    if (selectedProblems.includes("Control de sucursales")) list.push("Comunicaciones");
    return Array.from(new Set(list));
  }, [selectedAreas, selectedProblems]);

  const price = priceFor(recommended.length, users);

  function toggle(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  return (
    <main className="page-panel">
      <header className="panel-header">
        <div className="container site-header__inner">
          <WamaLogo variant="light" size="sm" />
          <Link href="/" className="btn btn--outline">Volver</Link>
        </div>
      </header>

      <section className="panel-main">
        <div className="container builder-layout">
          <section className="form-card">
            <span className="eyebrow">Diseña tu WAMA</span>
            <h1 className="builder-title">Crea un modelo para tu empresa.</h1>
            <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>Completa datos comerciales y genera una configuración modular recomendada.</p>

            <div className="form-grid" style={{ marginTop: 24 }}>
              <div className="form-field"><label>Empresa</label><input value={company} onChange={(e) => setCompany(e.target.value)} /></div>
              <div className="form-field"><label>Rubro</label><input value={industry} onChange={(e) => setIndustry(e.target.value)} /></div>
              <div className="form-field"><label>Contacto</label><input value={contact} onChange={(e) => setContact(e.target.value)} /></div>
              <div className="form-field"><label>Correo</label><input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="form-field"><label>Teléfono</label><input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div className="form-field"><label>Usuarios estimados</label><input type="number" value={users} onChange={(e) => setUsers(Number(e.target.value))} /></div>
              <div className="form-field"><label>Sedes / ubicaciones</label><input type="number" value={locations} onChange={(e) => setLocations(Number(e.target.value))} /></div>
              <div className="form-field full"><label>Áreas interesadas</label><div className="check-grid">{areas.map((area) => <label key={area}><input type="checkbox" checked={selectedAreas.includes(area)} onChange={() => toggle(selectedAreas, area, setSelectedAreas)} /> {area}</label>)}</div></div>
              <div className="form-field full"><label>Problemas a resolver</label><div className="check-grid">{problems.map((item) => <label key={item}><input type="checkbox" checked={selectedProblems.includes(item)} onChange={() => toggle(selectedProblems, item, setSelectedProblems)} /> {item}</label>)}</div></div>
            </div>
          </section>

          <aside className="recommendation-card">
            <span className="eyebrow">Modelo recomendado</span>
            <h2>{company}</h2>
            <p>{industry} · {locations} sede{locations === 1 ? "" : "s"} · {users} usuarios estimados.</p>
            <div className="reco-list">
              {recommended.map((item) => <span key={item}>{item}<strong>USD {Math.ceil(users / 10) * 10}</strong></span>)}
            </div>
            <div className="price-box"><span>Total mensual estimado</span><br /><strong>USD {price}</strong><p>{recommended.length} módulos / mes</p></div>
            <p><strong>Plan sugerido:</strong> Semana 1 configuración, semana 2 capacitación, semana 3 marcha blanca operativa.</p>
            <button className="btn btn--primary" type="button" style={{ marginTop: 16 }}>Solicitar demo comercial</button>
          </aside>
        </div>
      </section>
    </main>
  );
}
