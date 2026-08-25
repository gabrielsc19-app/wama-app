import { NextResponse } from "next/server";
import { getUserTenantContext, isTenantAdmin, requireWamaUser } from "../../../../src/lib/server/wamaAdmin";

export async function GET(request: Request) {
  try {
    const user = await requireWamaUser(request);
    const { admin, membership, profile } = await getUserTenantContext(user.id);
    const adminUser = isTenantAdmin(membership.role);
    let query = admin.from("wama_projects").select("*,wama_project_members(profile_id,role,wama_profiles(full_name,email)),wama_project_modules(tenant_module_license_id,wama_tenant_module_licenses(wama_module_catalog(module_key,name)))").eq("tenant_id", membership.tenant_id).neq("status", "archived").order("created_at", { ascending: false });
    if (!adminUser) query = query.eq("wama_project_members.profile_id", profile.id);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ projects: data || [], currentRole: membership.role, currentProfileId: profile.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireWamaUser(request);
    const { admin, profile, membership } = await getUserTenantContext(user.id);
    if (!isTenantAdmin(membership.role)) return NextResponse.json({ error: "Sin permisos." }, { status: 403 });
    const body = await request.json() as { name?: string; code?: string; description?: string; moduleKey?: "operations"|"expense"|"sales"; memberProfileIds?: string[]; adminProfileIds?: string[] };
    if (!body.name?.trim()) return NextResponse.json({ error: "Nombre obligatorio." }, { status: 400 });
    const moduleKey = body.moduleKey || "operations";
    const code = body.code?.trim() || `PR-${Date.now().toString().slice(-5)}`;
    const { data: license, error: licenseError } = await admin.from("wama_tenant_module_licenses").select("id,wama_module_catalog!inner(module_key,name)").eq("tenant_id", membership.tenant_id).eq("wama_module_catalog.module_key", moduleKey).in("status", ["trial", "active"]).maybeSingle();
    if (licenseError) throw licenseError;
    if (!license) return NextResponse.json({ error: `El módulo ${moduleKey} no está activo para Pumay.` }, { status: 409 });
    const { data: project, error } = await admin.from("wama_projects").insert({ tenant_id: membership.tenant_id, code, name: body.name.trim(), description: body.description?.trim() || null, status: "active", created_by: profile.id }).select("*").single();
    if (error || !project) throw error;
    const { error: moduleError } = await admin.from("wama_project_modules").insert({ project_id: project.id, tenant_module_license_id: license.id });
    if (moduleError) throw moduleError;
    const requested = [...new Set([profile.id, ...(body.memberProfileIds || []), ...(body.adminProfileIds || [])])];
    const { data: valid } = await admin.from("wama_module_user_assignments").select("profile_id").eq("tenant_module_license_id", license.id).in("status", ["active", "invited"]).in("profile_id", requested);
    const validIds = new Set((valid || []).map(x => x.profile_id));
    const admins = new Set([profile.id, ...(body.adminProfileIds || [])]);
    const rows = requested.filter(id => validIds.has(id)).map(profile_id => ({ project_id: project.id, profile_id, role: admins.has(profile_id) ? "admin" : "member" }));
    if (rows.length) {
      const { error: membersError } = await admin.from("wama_project_members").upsert(rows, { onConflict: "project_id,profile_id" });
      if (membersError) throw membersError;
    }
    return NextResponse.json({ ok: true, project });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireWamaUser(request);
    const { admin, membership } = await getUserTenantContext(user.id);
    if (!isTenantAdmin(membership.role)) return NextResponse.json({ error: "Sin permisos." }, { status: 403 });
    const body = await request.json() as { projectId?: string; memberProfileIds?: string[]; adminProfileIds?: string[] };
    if (!body.projectId) return NextResponse.json({ error: "Falta el proyecto." }, { status: 400 });
    const { data: project } = await admin.from("wama_projects").select("id").eq("id", body.projectId).eq("tenant_id", membership.tenant_id).maybeSingle();
    if (!project) return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
    const { data: projectModule } = await admin.from("wama_project_modules").select("tenant_module_license_id,wama_tenant_module_licenses!inner(wama_module_catalog!inner(module_key))").eq("project_id", project.id).eq("wama_tenant_module_licenses.wama_module_catalog.module_key", "operations").maybeSingle();
    if (!projectModule) return NextResponse.json({ error: "Este proyecto no está vinculado a Operations Hub." }, { status: 409 });
    const requested = [...new Set([...(body.memberProfileIds || []), ...(body.adminProfileIds || [])])];
    let validIds = new Set<string>();
    if (requested.length) {
      const { data: valid } = await admin.from("wama_module_user_assignments").select("profile_id").eq("tenant_module_license_id", projectModule.tenant_module_license_id).in("status", ["active", "invited"]).in("profile_id", requested);
      validIds = new Set((valid || []).map(x => x.profile_id));
    }
    await admin.from("wama_project_members").delete().eq("project_id", project.id);
    const admins = new Set(body.adminProfileIds || []);
    const rows = requested.filter(id => validIds.has(id)).map(profile_id => ({ project_id: project.id, profile_id, role: admins.has(profile_id) ? "admin" : "member" }));
    if (rows.length) {
      const { error } = await admin.from("wama_project_members").insert(rows);
      if (error) throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}
