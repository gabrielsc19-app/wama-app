import WamaModuleLanding from "../../../src/components/brand/WamaModuleLanding";

export default function OperationModulePage() {
  return (
    <WamaModuleLanding
      eyebrow="Operación WAMA"
      title="Controla alertas, casos y responsables."
      subtitle="Gestión operativa diaria con trazabilidad y evidencia."
      description="Operación WAMA permite registrar alertas, asignar responsables, controlar SLA, adjuntar evidencias y mantener visibilidad sobre lo que ocurre en terreno."
      primaryCta="Activar Operación"
      secondaryCta="Hablar con WAMA"
      secondaryHref="/trial"
      accentLabel="Control operativo"
      selfServiceTitle="Cada equipo puede gestionar sus propios casos."
      selfServiceDescription="Los usuarios pueden reportar, asignar, responder y cerrar casos desde su portal. La empresa mantiene trazabilidad sin depender de planillas, mensajes sueltos o reportes manuales."
      guideTitle="Te ayudo a resolver y priorizar."
      guideDescription="En Operación, WAMA funciona como apoyo para revisar alertas, detectar casos atrasados, orientar responsables y ordenar prioridades."
      guidePrompts={[
        "¿Qué casos están fuera de plazo?",
        "¿Quién debe tomar esta alerta?",
        "¿Qué debería revisar primero el equipo?",
      ]}
      features={[
        "Alertas y casos",
        "Responsables por área",
        "SLA y prioridades",
        "Evidencia fotográfica",
        "Comentarios y seguimiento",
        "Dashboard operativo",
        "Reportes por área",
        "Historial de gestión",
      ]}
      workflow={[
        "Reporta una alerta o solicitud",
        "Asigna responsable y prioridad",
        "Adjunta evidencia o comentarios",
        "Controla SLA y estado",
        "Genera reporte operativo",
      ]}
      metrics={[
        {
          label: "Casos abiertos",
          value: "18",
          detail: "Alertas activas",
          progress: "64%",
        },
        {
          label: "SLA cumplido",
          value: "94%",
          detail: "Gestión dentro de plazo",
          progress: "94%",
        },
        {
          label: "Áreas activas",
          value: "5",
          detail: "Equipos trabajando",
          progress: "72%",
        },
      ]}
      demoCards={[
        {
          title: "Alerta nueva",
          detail: "Caso creado y asignado a responsable.",
          value: "LIVE",
        },
        {
          title: "Fuera de SLA",
          detail: "Casos que requieren atención inmediata.",
          value: "3",
        },
        {
          title: "Cierre semanal",
          detail: "Cumplimiento operativo consolidado.",
          value: "86%",
        },
      ]}
    />
  );
}