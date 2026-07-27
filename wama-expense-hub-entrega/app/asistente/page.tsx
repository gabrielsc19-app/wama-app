"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import WamaLogo from "../components/WamaLogo";

const quick = [
  "Quiero ordenar tareas internas",
  "Tengo varias sucursales",
  "Necesito controlar mantención",
  "Quiero seguimiento comercial",
  "Necesito conciliación banco/facturas",
  "Quiero reportes para gerencia",
  "No sé qué módulos necesito",
];

function blocks(users: number) {
  return Math.ceil(Math.max(users, 10) / 10);
}

export default function AsistenteWama() {
  const [problem, setProblem] = useState("Tengo varias sucursales y necesito controlar tareas y alertas");
  const [users, setUsers] = useState(30);
  const [locations, setLocations] = useState(3);

  const modules = useMemo(() => {
    const text = problem.toLowerCase();
    const list = ["Generar Casos", "Control de Tareas", "Reportes Ejecutivos"];
    if (text.includes("comercial") || text.includes("venta")) list.push("Seguimiento Comercial");
    if (text.includes("banco") || text.includes("factura") || text.includes("concili")) list.push("Consolidación Banco");
    if (text.includes("comunic")) list.push("Comunicaciones");
    return Array.from(new Set(list));
  }, [problem]);

  const price = modules.length * blocks(users) * 10;

  return (
    <main className="page-panel">
      <header className="panel-header">
        <div className="container site-header__inner">
          <WamaLogo variant="light" size="sm" />
          <Link href="/" className="btn btn--outline">Volver</Link>
        </div>
      </header>

      <section className="panel-main">
        <div className="container advisor-layout">
          <aside className="advisor-panel">
            <span className="eyebrow">Preguntas rápidas</span>
            <div className="quick-buttons">
              {quick.map((item) => (
                <button key={item} type="button" onClick={() => setProblem(item)}>{item}</button>
              ))}
            </div>
          </aside>

          <div className="form-card">
            <span className="eyebrow">Asistente WAMA</span>
            <h1 className="advisor-title">Cuéntame qué quieres resolver.</h1>
            <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
              Esta primera versión recomienda módulos según tu problema, usuarios y sedes. Luego se puede conectar a IA real.
            </p>

            <div className="form-grid" style={{ marginTop: 24 }}>
              <div className="form-field full">
                <label>Problema o necesidad</label>
                <textarea value={problem} onChange={(e) => setProblem(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Usuarios estimados</label>
                <input type="number" value={users} onChange={(e) => setUsers(Number(e.target.value))} />
              </div>
              <div className="form-field">
                <label>Sedes / ubicaciones</label>
                <input type="number" value={locations} onChange={(e) => setLocations(Number(e.target.value))} />
              </div>
            </div>

            <div className="recommendation-card" style={{ marginTop: 24, position: "static" }}>
              <h2>Recomendación inicial</h2>
              <p>Para {locations} sede{locations === 1 ? "" : "s"} y {users} usuarios, recomendamos partir con:</p>
              <div className="reco-list">
                {modules.map((item) => <span key={item}>{item}<strong>Activo</strong></span>)}
              </div>
              <div className="price-box"><span>Precio estimado</span><br /><strong>USD {price}</strong><p>/ mes</p></div>
              <Link href="/demo-builder" className="btn btn--primary" style={{ marginTop: 18 }}>Crear modelo completo</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
