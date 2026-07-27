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
  trialStartedAt?: string;
  trialEndsAt?: string;
  contactName?: string;
  contactPhone?: string;
};

export const trialClients: WamaTrialClient[] = [
  {
    id: "vertex-facilities",
    companyName: "Vertex Facilities",
    moduleName: "Sales Hub",
    email: "demo@vertexfacilities.com",
    password: "WamaTrial2026!",
    rut: "Empresa ficticia",
    industry: "Facility management y servicios integrales",
    logoText: "VF",
    trialDays: 14,
    userLimit: 10,
    monthlyPrice: "US$10 por módulo / mes",
    deals: [
      {
        id: "deal-1",
        brand: "Andes Retail",
        description: "Servicio integral para operación de sucursales.",
        stage: "MARCA OBJETIVO",
        amountUf: 320,
        probability: 10,
        logo: "AR",
        owner: "Camila Torres",
      },
      {
        id: "deal-2",
        brand: "Grupo Horizonte",
        description: "Propuesta de facility management corporativo.",
        stage: "PRIMER CONTACTO",
        amountUf: 260,
        probability: 20,
        logo: "GH",
        owner: "Diego Silva",
      },
      {
        id: "deal-3",
        brand: "Innova Foods",
        description: "Implementación de operación técnica.",
        stage: "PROPUESTA ENVIADA",
        amountUf: 380,
        probability: 40,
        logo: "IF",
        owner: "Martina Pérez",
      },
    ],
  },
];

export function findTrialClient(email: string, password: string) {
  return trialClients.find(
    (client) =>
      client.email.toLowerCase() === email.trim().toLowerCase() &&
      client.password === password.trim(),
  );
}
