import WamaModuleLanding from "../../../src/components/brand/WamaModuleLanding";

export default function SalesHubModulePage() {
  return (
    <WamaModuleLanding
      eyebrow="Sales Hub WAMA"
      title="Vende con pipeline, foco y seguimiento."
      subtitle="CRM comercial para equipos que necesitan controlar oportunidades."
      description="Sales Hub permite ordenar prospectos, contactos, deals, documentos, actividades y reportes comerciales desde un portal simple y autogestionable."
      primaryCta="Activar Sales Hub"
      secondaryCta="Configurar onboarding"
      secondaryHref="/onboarding/sales-hub"
      accentLabel="Pipeline comercial"
      selfServiceTitle="Tu equipo puede cargar y gestionar sus oportunidades."
      selfServiceDescription="El cliente no depende de WAMA para operar. Puede crear prospectos, cargar contactos, mover deals por etapas, adjuntar documentos y revisar el avance desde su propio portal."
      guideTitle="Te ayudo a configurar tu CRM."
      guideDescription="En Sales Hub, WAMA acompaña la carga inicial: qué vende la empresa, tipo de venta, etapas, contactos y primeros deals."
      guidePrompts={[
        "¿Qué vende tu empresa?",
        "¿Tu venta es spot, recurrente o mixta?",
        "¿Quieres cargar tu primer deal?",
      ]}
      features={[
        "Pipeline visual por etapas",
        "Prospectos y contactos",
        "Deals con monto y probabilidad",
        "Documentos adjuntos",
        "Seguimiento comercial",
        "Dashboard ejecutivo",
        "Usuarios por empresa",
        "Prueba gratis de 14 días",
      ]}
      workflow={[
        "Configura qué vende la empresa",
        "Carga prospectos o clientes objetivo",
        "Crea deals y responsables",
        "Mueve oportunidades por etapa",
        "Revisa reportes para decidir",
      ]}
      metrics={[
        {
          label: "Pipeline estimado",
          value: "$128M",
          detail: "Vista comercial consolidada",
          progress: "78%",
        },
        {
          label: "Deals activos",
          value: "18",
          detail: "Oportunidades en curso",
          progress: "65%",
        },
        {
          label: "Seguimiento",
          value: "86%",
          detail: "Control de próximos pasos",
          progress: "86%",
        },
      ]}
      demoCards={[
        {
          title: "Target account",
          detail: "Empresas objetivo listas para contactar.",
          value: "34",
        },
        {
          title: "Proposal sent",
          detail: "Oportunidades con propuesta enviada.",
          value: "6",
        },
        {
          title: "Negotiation",
          detail: "Deals con mayor probabilidad de cierre.",
          value: "$42M",
        },
      ]}
    />
  );
}