export type WamaStage =
  | "MARCA OBJETIVO"
  | "PRIMER CONTACTO"
  | "PROPUESTA ENVIADA"
  | "NEGOCIACIÓN"
  | "CIERRE GANADO"
  | "CIERRE PERDIDO";

export type WamaDeal = {
  id: string;
  brand: string;
  description: string;
  stage: WamaStage;
  amountUf: number;
  probability: number;
  logo: string;
  owner: string;
};

export type WamaTrialClient = {
  id: string;
  companyName: string;
  moduleName: string;
  email: string;
  password: string;
  rut: string;
  industry: string;
  logoText: string;
  trialDays: number;
  userLimit: number;
  monthlyPrice: string;
  deals: WamaDeal[];
};

export const trialClients: WamaTrialClient[] = [
  {
    id: "andes-facility",
    companyName: "Andes Facility Services SpA",
    moduleName: "Sales Hub",
    email: "demo@andesfacility.cl",
    password: "WamaTrial2026!",
    rut: "77.482.913-6",
    industry: "Facility management, mantención y operación de edificios",
    logoText: "AF",
    trialDays: 14,
    userLimit: 10,
    monthlyPrice: "US$10 / módulo",
    deals: [
      {
        id: "deal-1",
        brand: "Centro Empresarial Apoquindo",
        description: "Prospecto para servicio recurrente de mantención.",
        stage: "MARCA OBJETIVO",
        amountUf: 420,
        probability: 10,
        logo: "CE",
        owner: "Camila Torres",
      },
      {
        id: "deal-2",
        brand: "Clínica Nueva Cordillera",
        description: "Primera reunión para operación integral.",
        stage: "PRIMER CONTACTO",
        amountUf: 680,
        probability: 20,
        logo: "CN",
        owner: "Camila Torres",
      },
      {
        id: "deal-3",
        brand: "Condominio Parque Los Robles",
        description: "Propuesta enviada para contrato anual.",
        stage: "PROPUESTA ENVIADA",
        amountUf: 520,
        probability: 30,
        logo: "PR",
        owner: "Rodrigo Fuentes",
      },
    ],
  },
  {
    id: "nexo-facility",
    companyName: "Nexo Facility Group SpA",
    moduleName: "Sales Hub",
    email: "demo@nexofacility.cl",
    password: "WamaTrial2026!",
    rut: "77.684.219-4",
    industry: "Servicios operacionales para edificios corporativos",
    logoText: "NF",
    trialDays: 14,
    userLimit: 10,
    monthlyPrice: "US$10 / módulo",
    deals: [],
  },
];

export function findTrialClient(email: string, password: string) {
  return trialClients.find(
    (client) =>
      client.email.toLowerCase() === email.trim().toLowerCase() &&
      client.password === password.trim()
  );
}