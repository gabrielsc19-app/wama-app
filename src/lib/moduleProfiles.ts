export type ModuleProfile = {
  value:string;
  label:string;
  description:string;
  activities:string[];
};

export const MODULE_PROFILES:Record<string,ModuleProfile[]> = {
  expense:[
    {value:"expense_manager",label:"Gerente de Administración y Finanzas",description:"Supervisa el proceso financiero completo y sus indicadores.",activities:["Controlar rendiciones, fondos y pagos","Aprobar según políticas y montos","Revisar presupuesto, excepciones e historial"]},
    {value:"expense_admin",label:"Administrador de Expense Hub",description:"Configura y administra el funcionamiento del módulo.",activities:["Administrar proyectos y centros de costo","Configurar políticas y flujos","Supervisar usuarios y reportes"]},
    {value:"expense_approver",label:"Aprobador",description:"Autoriza o rechaza solicitudes revisadas.",activities:["Revisar solicitudes pendientes","Aprobar, rechazar u observar","Controlar vencimientos de aprobación"]},
    {value:"expense_reviewer",label:"Revisor",description:"Valida antecedentes antes de la aprobación.",activities:["Comprobar documentos y montos","Solicitar correcciones","Enviar solicitudes a aprobación"]},
    {value:"expense_treasurer",label:"Tesorero",description:"Ejecuta y documenta pagos aprobados.",activities:["Pagar solicitudes aprobadas","Adjuntar comprobantes","Registrar abonos y devoluciones"]},
    {value:"expense_submitter",label:"Rendidor",description:"Registra gastos y fondos propios.",activities:["Crear rendiciones y fondos","Adjuntar evidencias","Corregir observaciones y seguir estados"]},
    {value:"expense_auditor",label:"Auditor / Solo consulta",description:"Fiscaliza el proceso sin modificar información.",activities:["Consultar rendiciones y documentos","Revisar aprobaciones y pagos","Exportar y auditar historial"]},
  ],
  sales:[
    {value:"sales_manager",label:"Gerente comercial",description:"Controla resultados, proyección y desempeño comercial.",activities:["Revisar pipeline y forecast","Controlar metas y win rate","Analizar desempeño del equipo"]},
    {value:"sales_supervisor",label:"Supervisor comercial",description:"Coordina al equipo y destraba oportunidades.",activities:["Reasignar oportunidades","Controlar seguimientos y tareas","Detectar negocios estancados"]},
    {value:"sales_executive",label:"Ejecutivo comercial",description:"Gestiona prospectos y oportunidades asignadas.",activities:["Crear y actualizar oportunidades","Registrar contactos y actividades","Completar seguimientos comerciales"]},
    {value:"sales_financial_evaluator",label:"Evaluador financiero",description:"Valida cierres ganados antes de activar al cliente.",activities:["Revisar antecedentes financieros","Validar documentación","Aprobar u observar la habilitación"]},
    {value:"sales_admin",label:"Administrador de Sales Hub",description:"Configura el CRM, catálogos y accesos.",activities:["Configurar etapas y probabilidades","Administrar productos y monedas","Supervisar permisos y reportes"]},
    {value:"sales_auditor",label:"Auditor / Solo consulta",description:"Consulta pipeline e historial sin intervenir.",activities:["Consultar oportunidades y archivos","Revisar historial de cambios","Acceder a informes comerciales"]},
  ],
};

export const profilesFor=(moduleKey:string)=>MODULE_PROFILES[moduleKey]||[];
export const profileFor=(moduleKey:string,value:string)=>profilesFor(moduleKey).find(item=>item.value===value);
export const profileLabel=(moduleKey:string,value:string)=>value==="module_admin"?"Acceso total":profileFor(moduleKey,value)?.label||value;
