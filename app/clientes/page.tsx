"use client";

import { useState } from "react";
import WamaAppShell from "../components/WamaAppShell";

type LocationRow = {
  id: number;
  name: string;
  city: string;
  users: number;
  status: string;
  modules: string[];
};

const initialRows: LocationRow[] = [
  { id: 1, name: "Sucursal Centro", city: "Santiago", users: 18, status: "Activa", modules: ["Casos", "Tareas"] },
  { id: 2, name: "Sucursal Norte", city: "La Serena", users: 12, status: "Activa", modules: ["Casos"] },
  { id: 3, name: "Sucursal Costanera", city: "Viña del Mar", users: 24, status: "Implementación", modules: ["Casos", "Reportes"] },
];

export default function ClientesPage() {
  const [rows, setRows] = useState(initialRows);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");

  function addLocation() {
    if (!name.trim() || !city.trim()) return;
    setRows((current) => [
      { id: Date.now(), name: name.trim(), city: city.trim(), users: 10, status: "Nueva", modules: ["Casos"] },
      ...current,
    ]);
    setName("");
    setCity("");
  }

  return (
    <WamaAppShell title="Clientes y sedes" subtitle="Administra empresas, sucursales o ubicaciones de un cliente WAMA.">
      <section className="app-grid">
        <div className="panel">
          <h2>Crear sede demo</h2>
          <div className="form-grid two">
            <div className="field"><label>Nombre sede</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sucursal Las Condes" /></div>
            <div className="field"><label>Ciudad</label><input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Santiago" /></div>
          </div>
          <button className="btn-primary" style={{ marginTop: 14 }} onClick={addLocation}>Crear sede</button>
        </div>

        <div className="panel">
          <h2>Sedes configuradas</h2>
          <div className="rows-list">
            {rows.map((row) => (
              <div key={row.id} className="alert-row">
                <div>
                  <div className="row-title">{row.name}</div>
                  <div className="row-meta">{row.city} · {row.users} usuarios · {row.modules.join(", ")}</div>
                </div>
                <span className="badge cyan">{row.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </WamaAppShell>
  );
}
