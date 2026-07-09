"use client";

import Link from "next/link";
import { useState } from "react";
import WamaLogo from "../../components/WamaLogo";

const defaultForm = {
  company_name: "Empresa Demo SpA",
  brand_name: "Demo Retail",
  website: "https://empresa-demo.cl",
  industry: "Retail",
  contact_name: "Camila Perez",
  contact_email: "camila@empresa-demo.cl",
  contact_phone: "+56 9 1111 1111",
  deal_title: "Implementación Sales Hub",
  amount_uf: "120",
  stage: "target_account",
  next_step: "Enviar presentación WAMA",
};

export default function SalesHubOnboardingPage() {
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState("");

  function updateField(field: keyof typeof defaultForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function createModel() {
    setMessage("Creando modelo comercial...");

    try {
      const accountResponse = await fetch("/api/sales/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: form.company_name,
          brand_name: form.brand_name,
          website: form.website,
          industry: form.industry,
          source: "Onboarding WAMA",
          initial_comment: "Cuenta creada desde onboarding comercial.",
          assigned_to: "Comercial",
          created_by: "WAMA",
        }),
      });

      const accountJson = await accountResponse.json();

      if (!accountResponse.ok || !accountJson.ok) {
        throw new Error(accountJson.error || "No se pudo crear la cuenta.");
      }

      const dealResponse = await fetch("/api/sales/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: accountJson.data?.id,
          title: form.deal_title,
          stage: form.stage,
          amount_uf: Number(form.amount_uf || 0),
          assigned_to: "Comercial",
          next_step: form.next_step,
          notes: `Contacto: ${form.contact_name} · ${form.contact_email} · ${form.contact_phone}`,
          created_by: "WAMA",
        }),
      });

      const dealJson = await dealResponse.json();

      if (!dealResponse.ok || !dealJson.ok) {
        throw new Error(dealJson.error || "No se pudo crear el deal.");
      }

      setMessage("Modelo comercial creado. Ya puedes abrir Sales Hub.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error creando modelo comercial.");
    }
  }

  return (
    <main className="wama-marketing-page">
      <section className="marketing-hero">
        <div className="marketing-container">
          <WamaLogo type="horizontal" variant="dark" size="sm" />

          <p className="eyebrow">Onboarding Sales Hub</p>
          <h1>Crea el primer modelo comercial de tu empresa.</h1>
          <p className="marketing-copy">
            Ingresa una empresa manualmente o carga una plantilla compatible con Excel para que WAMA
            cree cuentas, contactos, deals y el primer pipeline comercial.
          </p>

          <div className="hero-actions">
            <a href="/templates/wama-sales-hub-template.csv" className="btn-primary" download>
              Descargar plantilla CSV
            </a>
            <a href="/templates/wama-sales-hub-guia.csv" className="btn-outline-dark" download>
              Descargar Excel guía
            </a>
            <Link href="/sales-hub" className="btn-outline-dark">
              Abrir Sales Hub
            </Link>
          </div>
        </div>
      </section>

      <section className="onboarding-section">
        <div className="onboarding-grid">
          <section className="onboarding-card wide">
            <h2>Formulario rápido</h2>
            <p>Ideal para crear el primer cliente y comenzar a trabajar inmediatamente.</p>

            <div className="form-grid">
              <label>
                Empresa
                <input value={form.company_name} onChange={(event) => updateField("company_name", event.target.value)} />
              </label>
              <label>
                Marca
                <input value={form.brand_name} onChange={(event) => updateField("brand_name", event.target.value)} />
              </label>
              <label>
                Web
                <input value={form.website} onChange={(event) => updateField("website", event.target.value)} />
              </label>
              <label>
                Rubro
                <input value={form.industry} onChange={(event) => updateField("industry", event.target.value)} />
              </label>
              <label>
                Contacto
                <input value={form.contact_name} onChange={(event) => updateField("contact_name", event.target.value)} />
              </label>
              <label>
                Correo
                <input value={form.contact_email} onChange={(event) => updateField("contact_email", event.target.value)} />
              </label>
              <label>
                Teléfono
                <input value={form.contact_phone} onChange={(event) => updateField("contact_phone", event.target.value)} />
              </label>
              <label>
                Deal
                <input value={form.deal_title} onChange={(event) => updateField("deal_title", event.target.value)} />
              </label>
              <label>
                Monto UF
                <input value={form.amount_uf} onChange={(event) => updateField("amount_uf", event.target.value)} />
              </label>
              <label>
                Etapa
                <select value={form.stage} onChange={(event) => updateField("stage", event.target.value)}>
                  <option value="target_account">Target Account</option>
                  <option value="first_contact">First Contact</option>
                  <option value="qualified_lead">Qualified Lead</option>
                  <option value="proposal_sent">Proposal Sent</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="closing">Closing</option>
                </select>
              </label>
            </div>

            <label className="full-label">
              Próximo paso
              <input value={form.next_step} onChange={(event) => updateField("next_step", event.target.value)} />
            </label>

            <button className="btn-primary" type="button" onClick={createModel}>
              Crear modelo comercial
            </button>

            {message ? <div className="form-message">{message}</div> : null}
          </section>

          <aside className="onboarding-card">
            <h2>Carga por archivo</h2>
            <p>
              Para más volumen, completa la plantilla en Excel y guarda una copia como CSV para
              cargarla automáticamente.
            </p>

            <div className="upload-box">
              <strong>Archivo permitido en esta fase</strong>
              <span>CSV compatible con Excel</span>
              <input type="file" accept=".csv" />
            </div>

            <div className="price-box">
              <span>Precio base</span>
              <strong>USD 10 / mes por cada 10 usuarios del módulo</strong>
            </div>

            <div className="soft-box">
              <span>Próxima mejora</span>
              <p>Importación directa .xlsx con validación visual antes de crear datos.</p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
