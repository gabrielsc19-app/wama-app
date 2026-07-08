"use client";

import { useState } from "react";
import WamaAppShell from "../components/WamaAppShell";

type CaseRow = {
  id: number;
  title: string;
  location: string;
  area: string;
  priority: string;
  status: string;
  history: string[];
};

const initialCases: CaseRow[] = [
  { id: 1, title: "Filtración en pasillo principal", location: "Sucursal Centro", area: "Mantención", priority: "Alta", status: "Nuevo", history: ["Caso creado", "Mantención notificada"] },
  { id: 2, title: "Reposición de señalética", location: "Sucursal Norte", area: "Operaciones", priority: "Media", status: "En proceso", history: ["Caso creado", "Operaciones tomó el caso"] },
  { id: 3, title: "Revisión cierre de bodega", location: "Sucursal Costanera", area: "Seguridad", priority: "Media", status: "Cerrado", history: ["Caso creado", "Seguridad validó cierre", "Caso cerrado"] },
];

export default function OperacionPage() {
  const [cases, setCases] = useState(initialCases);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("Sucursal Centro");
  const [area, setArea] = useState("Mantención");
  const [priority, setPriority] = useState("Media");

  function addCase() {
    if (!title.trim()) return;
    setCases((current) => [
      { id: Date.now(), title: title.trim(), location, area, priority, status: "Nuevo", history: ["Caso creado", `${area} notificada`] },
      ...current,
    ]);
    setTitle("");
  }

  function changeStatus(id: number, status: string) {
    setCases((current) => current.map((item) => item.id === id ? { ...item, status, history: [...item.history, `Estado actualizado a ${status}`] } : item));
  }

  return (
    <WamaAppShell title="Operación" subtitle="Crea, asigna, toma y cierra alertas operativas con trazabilidad tipo FixLoop.">
      <section className="app-grid">
        <div className="panel">
          <h2>Crear alerta</h2>
          <div className="form-grid two">
            <div className="field"><label>Título</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Falla de acceso principal" /></div>
            <div className="field"><label>Ubicación</label><select value={location} onChange={(e) => setLocation(e.target.value)}><option>Sucursal Centro</option><option>Sucursal Norte</option><option>Sucursal Costanera</option></select></div>
            <div className="field"><label>Área responsable</label><select value={area} onChange={(e) => setArea(e.target.value)}><option>Mantención</option><option>Operaciones</option><option>Seguridad</option><option>Aseo</option><option>Comercial</option></select></div>
            <div className="field"><label>Prioridad</label><select value={priority} onChange={(e) => setPriority(e.target.value)}><option>Baja</option><option>Media</option><option>Alta</option><option>Crítica</option></select></div>
          </div>
          <button className="btn-primary" style={{ marginTop: 14 }} onClick={addCase}>Crear alerta</button>
        </div>

        <div className="panel">
          <h2>Casos operativos</h2>
          <div className="rows-list">
            {cases.map((item) => (
              <div key={item.id} className="alert-row">
                <div>
                  <div className="row-title">{item.title}</div>
                  <div className="row-meta">{item.location} · {item.area} · {item.priority}</div>
                  <div className="timeline-mini">{item.history.join(" → ")}</div>
                </div>
                <div className="row-actions">
                  <span className="badge cyan">{item.status}</span>
                  {item.status !== "En proceso" && <button className="btn-ghost" onClick={() => changeStatus(item.id, "En proceso")}>Tomar</button>}
                  {item.status !== "Cerrado" && <button className="btn-ghost" onClick={() => changeStatus(item.id, "Cerrado")}>Cerrar</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </WamaAppShell>
  );
}
