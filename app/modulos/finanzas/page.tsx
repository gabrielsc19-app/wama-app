import WamaModuleLanding from "../../../src/components/brand/WamaModuleLanding";

export default function FinanceModulePage() {
  return (
    <WamaModuleLanding
      eyebrow="Finanzas WAMA"
      title="Ordena documentos, pagos y conciliación."
      subtitle="Control financiero simple para reducir pendientes y errores."
      description="Finanzas WAMA permite cargar documentos, validar cartolas, controlar pagos pendientes, revisar conciliación y generar reportes claros para la toma de decisiones."
      accentLabel="Control financiero"
      selfServiceTitle="El equipo puede cargar y validar información financiera."
      selfServiceDescription="La empresa puede subir documentos, revisar pendientes, marcar pagos, validar información y mantener control de su flujo financiero sin depender de archivos dispersos."
      aiTitle="IA para detectar pendientes y resumir riesgos."
      aiDescription="El Asistente WAMA puede ayudar a identificar documentos sin validar, pagos pendientes, inconsistencias y prioridades financieras antes del cierre semanal."
      features={[
        "Carga de documentos",
        "Control de pendientes",
        "Cartola bancaria",
        "Conciliación",
        "Validación de pagos",
        "Dashboard financiero",
        "Reportes ejecutivos",
        "Historial de documentos",
      ]}
      workflow={[
        "Carga documentos o archivos",
        "Clasifica pendientes",
        "Valida contra cartola",
        "Revisa diferencias",
        "Genera reporte financiero",
      ]}
      metrics={[
        {
          label: "Pendientes",
          value: "$42M",
          detail: "Documentos por validar",
          progress: "52%",
        },
        {
          label: "Conciliación",
          value: "76%",
          detail: "Avance de validación",
          progress: "76%",
        },
        {
          label: "Pagos revisados",
          value: "64%",
          detail: "Control semanal",
          progress: "64%",
        },
      ]}
      demoCards={[
        {
          title: "Documento cargado",
          detail: "Archivo recibido para validación.",
          value: "42",
        },
        {
          title: "Por conciliar",
          detail: "Pendientes contra cartola.",
          value: "$18M",
        },
        {
          title: "Pagos validados",
          detail: "Resumen financiero semanal.",
          value: "64%",
        },
      ]}
    />
  );
}