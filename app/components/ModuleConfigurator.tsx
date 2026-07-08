"use client";

import { useMemo, useState } from "react";

type ModuleItem = {
  id: string;
  area: string;
  title: string;
  description: string;
  example: string;
  users: number;
  selected: boolean;
  badge: string;
};

const INITIAL_MODULES: ModuleItem[] = [
  {
    id: "cases",
    area: "Operaciones",
    title: "Generar Casos",
    description:
      "Reporta alertas, asigna responsables, recibe evidencia y controla el cierre con trazabilidad.",
    example: "Baño sucio → Aseo recibe aviso → resuelve → cierre informado.",
    users: 20,
    selected: true,
    badge: "Alertas",
  },
  {
    id: "tasks",
    area: "Operaciones",
    title: "Control de Tareas",
    description:
      "Crea tareas periódicas o puntuales, controla cumplimiento y notifica a jefaturas.",
    example: "Seguridad revisa bodegas → evidencia → reporte automático.",
    users: 10,
    selected: false,
    badge: "Tareas",
  },
  {
    id: "communications",
    area: "Administración",
    title: "Comunicaciones",
    description:
      "Envía comunicados segmentados por usuario, sucursal, equipo o cliente con historial.",
    example: "Administración comunica protocolo → usuarios reciben y queda trazado.",
    users: 10,
    selected: false,
    badge: "Comunicados",
  },
  {
    id: "crm",
    area: "Comercial",
    title: "Seguimiento Comercial",
    description:
      "Administra candidatos, pipeline, oportunidades, documentos y avance comercial.",
    example: "5 candidatos → 3 contactados → 1 propuesta → 1 venta cerrada.",
    users: 10,
    selected: false,
    badge: "Pipeline",
  },
  {
    id: "finance",
    area: "Contabilidad",
    title: "Consolidación Banco",
    description:
      "Cruza facturas, pagos y movimientos bancarios para detectar pendientes y diferencias.",
    example: "120 facturas → 98 conciliadas → 22 pendientes de pago.",
    users: 10,
    selected: true,
    badge: "Conciliación",
  },
  {
    id: "reports",
    area: "Gerencia",
    title: "Reportes Ejecutivos",
    description:
      "Indicadores, SLA, cumplimiento, costos y resumen ejecutivo para toma de decisiones.",
    example: "Gerencia revisa estado semanal por área, sede y responsable.",
    users: 10,
    selected: false,
    badge: "BI",
  },
];

function modulePrice(users: number) {
  return Math.ceil(Math.max(users, 10) / 10) * 10;
}

export default function ModuleConfigurator() {
  const [modules, setModules] = useState<ModuleItem[]>(INITIAL_MODULES);

  const selected = useMemo(() => modules.filter((item) => item.selected), [modules]);
  const total = useMemo(
    () => selected.reduce((sum, item) => sum + modulePrice(item.users), 0),
    [selected],
  );

  function toggleModule(id: string) {
    setModules((current) =>
      current.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item,
      ),
    );
  }

  function changeUsers(id: string, direction: "up" | "down") {
    setModules((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const nextUsers = direction === "up" ? item.users + 10 : Math.max(10, item.users - 10);
        return { ...item, users: nextUsers };
      }),
    );
  }

  return (
    <section id="modules" className="section section--light">
      <div className="container">
        <div className="section-heading">
          <span className="eyebrow">Catálogo modular</span>
          <h2>Módulos que se activan según la necesidad del cliente.</h2>
          <p>
            Precio transparente: USD 10 cada 10 usuarios por módulo al mes. Sin paquetes cerrados.
          </p>
        </div>

        <div className="module-grid">
          {modules.map((item) => (
            <article
              key={item.id}
              className={`module-card ${item.selected ? "module-card--active" : ""}`}
            >
              <div className="module-card__top">
                <div>
                  <span className="module-card__area">{item.area}</span>
                  <h3>{item.title}</h3>
                </div>
                <span className="module-card__badge">{item.badge}</span>
              </div>

              <p>{item.description}</p>
              <div className="module-card__example">{item.example}</div>

              {item.selected && (
                <div className="module-users">
                  <span>Usuarios</span>
                  <div className="stepper">
                    <button type="button" onClick={() => changeUsers(item.id, "down")}>−</button>
                    <strong>{item.users}</strong>
                    <button type="button" onClick={() => changeUsers(item.id, "up")}>+</button>
                  </div>
                </div>
              )}

              <div className="module-card__footer">
                <strong>USD {modulePrice(item.users)} /mes</strong>
                <button
                  type="button"
                  className={item.selected ? "btn btn--ghost" : "btn btn--dark"}
                  onClick={() => toggleModule(item.id)}
                >
                  {item.selected ? "Quitar" : "Agregar módulo"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="config-bar">
        <div className="config-bar__items">
          {selected.length === 0 ? (
            <span className="config-pill">Sin módulos seleccionados</span>
          ) : (
            selected.map((item) => (
              <span key={item.id} className="config-pill">
                {item.title} · {item.users}u
              </span>
            ))
          )}
        </div>
        <div className="config-bar__total">
          <strong>USD {total}</strong>
          <span>{selected.length} módulo{selected.length === 1 ? "" : "s"} / mes</span>
        </div>
      </div>
    </section>
  );
}
