"use client";

import { useState } from "react";
import WamaAppShell from "../components/WamaAppShell";

type UserRow = { id: number; name: string; email: string; role: string; location: string };

const initialUsers: UserRow[] = [
  { id: 1, name: "Admin Demo", email: "admin@empresa.cl", role: "Administrador", location: "Todas" },
  { id: 2, name: "Supervisor Norte", email: "supervisor@empresa.cl", role: "Supervisor", location: "Sucursal Norte" },
  { id: 3, name: "Operador Centro", email: "operador@empresa.cl", role: "Equipo operativo", location: "Sucursal Centro" },
];

export default function UsuariosPage() {
  const [users, setUsers] = useState(initialUsers);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Equipo operativo");
  const [location, setLocation] = useState("Todas");

  function addUser() {
    if (!name.trim() || !email.trim()) return;
    setUsers((current) => [{ id: Date.now(), name: name.trim(), email: email.trim(), role, location }, ...current]);
    setName("");
    setEmail("");
  }

  return (
    <WamaAppShell title="Usuarios y roles" subtitle="Roles genéricos para vender WAMA a cualquier empresa.">
      <section className="app-grid">
        <div className="panel">
          <h2>Crear usuario demo</h2>
          <div className="form-grid two">
            <div className="field"><label>Nombre</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre usuario" /></div>
            <div className="field"><label>Correo</label><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@empresa.cl" /></div>
            <div className="field"><label>Rol</label><select value={role} onChange={(e) => setRole(e.target.value)}><option>Owner</option><option>Administrador</option><option>Supervisor</option><option>Equipo operativo</option><option>Cliente / Sucursal</option><option>Visualizador</option></select></div>
            <div className="field"><label>Ubicación</label><select value={location} onChange={(e) => setLocation(e.target.value)}><option>Todas</option><option>Sucursal Norte</option><option>Sucursal Centro</option><option>Sucursal Costanera</option></select></div>
          </div>
          <button className="btn-primary" style={{ marginTop: 14 }} onClick={addUser}>Crear usuario</button>
        </div>

        <div className="panel">
          <h2>Usuarios</h2>
          <div className="rows-list">
            {users.map((user) => (
              <div key={user.id} className="alert-row">
                <div>
                  <div className="row-title">{user.name}</div>
                  <div className="row-meta">{user.email} · {user.location}</div>
                </div>
                <span className="badge cyan">{user.role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Matriz de permisos</h2>
        <p>{"Owner: control total · Administrador: opera y configura · Supervisor: revisa equipo · Equipo operativo: toma y cierra casos · Cliente / Sucursal: reporta y responde · Visualizador: solo lectura"}</p>
      </section>
    </WamaAppShell>
  );
}
