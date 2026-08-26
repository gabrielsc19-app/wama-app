import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();

console.log("");
console.log("WAMA - CLAVES PUSH");
console.log("------------------");
console.log("NEXT_PUBLIC_VAPID_PUBLIC_KEY=" + keys.publicKey);
console.log("VAPID_PRIVATE_KEY=" + keys.privateKey);
console.log("VAPID_SUBJECT=mailto:contacto@wamaapp.com");
console.log("");
console.log("Copia las 3 variables a .env.local y a Vercel Production.");
console.log("La clave privada nunca debe publicarse ni subirse a Git.");
