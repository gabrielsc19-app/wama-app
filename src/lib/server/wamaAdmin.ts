import { createClient, type User } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getWamaAdmin() {
  if (!url || !serviceKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireWamaUser(request: Request): Promise<User> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("UNAUTHORIZED");
  const admin = getWamaAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new Error("UNAUTHORIZED");
  return data.user;
}

export async function getUserTenantContext(authUserId: string) {
  const admin = getWamaAdmin();
  const { data: profile, error: profileError } = await admin
    .from("wama_profiles")
    .select("id,full_name,email")
    .eq("auth_user_id", authUserId)
    .single();
  if (profileError || !profile) throw new Error("PROFILE_NOT_FOUND");

  const { data: membership, error: membershipError } = await admin
    .from("wama_tenant_memberships")
    .select("id,tenant_id,role,status,wama_tenants(id,name,code,status,trial_ends_at)")
    .eq("profile_id", profile.id)
    .in("status", ["active", "invited"])
    .limit(1)
    .single();
  if (membershipError || !membership) throw new Error("TENANT_NOT_FOUND");

  return { admin, profile, membership };
}

export function isTenantAdmin(role: string) {
  return role === "owner" || role === "admin";
}
