import { NextResponse } from "next/server";
import {
  getOperationsContext,
  operationsError,
} from "../../../../src/lib/server/operationsAccess";

const fail = (error: unknown) => {
  const result = operationsError(error);
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: unknown }).message || "")
      : "";
  return NextResponse.json(
    { error: message || result.message },
    { status: result.status },
  );
};

export async function GET(request: Request) {
  try {
    const context = await getOperationsContext(request);
    const { admin, tenantId, license, profile } = context;

    const { data: links, error: linksError } = await admin
      .from("wama_project_modules")
      .select("project_id")
      .eq("tenant_module_license_id", license.id);

    if (linksError) throw linksError;

    const linkedIds = (links || []).map((item) => item.project_id);
    if (!linkedIds.length) {
      return NextResponse.json({
        projects: [],
        currentProfileId: profile.id,
        canAdmin: context.canAdmin,
      });
    }

    let allowedIds = linkedIds;

    if (!context.canAdmin) {
      const { data: memberships, error: membershipsError } = await admin
        .from("wama_project_members")
        .select("project_id")
        .eq("profile_id", profile.id)
        .in("project_id", linkedIds);

      if (membershipsError) throw membershipsError;
      allowedIds = (memberships || []).map((item) => item.project_id);
    }

    if (!allowedIds.length) {
      return NextResponse.json({
        projects: [],
        currentProfileId: profile.id,
        canAdmin: context.canAdmin,
      });
    }

    const [
      { data: projects, error: projectsError },
      { data: members, error: membersError },
      { data: locations, error: locationsError },
      { data: plans, error: plansError },
      { data: projectTeams, error: projectTeamsError },
    ] = await Promise.all([
      admin
        .from("wama_projects")
        .select("id,code,name,description,status,created_at")
        .eq("tenant_id", tenantId)
        .in("id", allowedIds)
        .order("created_at", { ascending: false }),
      admin
        .from("wama_project_members")
        .select("project_id,profile_id,role")
        .in("project_id", allowedIds),
      admin
        .from("wama_operations_locations")
        .select(
          "id,project_id,code,name,address,location_type,sort_order,plan_x,plan_y,status",
        )
        .eq("tenant_id", tenantId)
        .in("project_id", allowedIds)
        .eq("status", "active")
        .order("sort_order")
        .order("name"),
      admin
        .from("wama_operations_project_plans")
        .select(
          "id,project_id,sheet_code,title,revision,revision_date,scale,storage_path,file_name,mime_type,file_size,created_at",
        )
        .eq("tenant_id", tenantId)
        .in("project_id", allowedIds)
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
      admin
        .from("wama_operations_project_teams")
        .select("project_id,team_id")
        .in("project_id", allowedIds),
    ]);

    if (projectsError) throw projectsError;
    if (membersError) throw membersError;
    if (locationsError) throw locationsError;
    if (plansError) throw plansError;
    if (projectTeamsError) throw projectTeamsError;

    const profileIds = [
      ...new Set((members || []).map((item) => item.profile_id)),
    ];

    const { data: profiles, error: profilesError } = profileIds.length
      ? await admin
          .from("wama_profiles")
          .select("id,full_name,email,status")
          .in("id", profileIds)
      : { data: [], error: null };

    if (profilesError) throw profilesError;

    const teamIds = [
      ...new Set((projectTeams || []).map((item) => item.team_id)),
    ];

    const { data: teams, error: teamsError } = teamIds.length
      ? await admin
          .from("wama_operations_teams")
          .select("id,name,color,status")
          .in("id", teamIds)
      : { data: [], error: null };

    if (teamsError) throw teamsError;

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    const teamMap = new Map((teams || []).map((t) => [t.id, t]));

    const planRows = await Promise.all(
      (plans || []).map(async (plan) => {
        const { data } = await admin.storage
          .from("operations-plans")
          .createSignedUrl(plan.storage_path, 60 * 60);

        return { ...plan, url: data?.signedUrl || null };
      }),
    );

    return NextResponse.json({
      currentProfileId: profile.id,
      canAdmin: context.canAdmin,
      projects: (projects || []).map((project) => ({
        ...project,
        members: (members || [])
          .filter((item) => item.project_id === project.id)
          .map((item) => ({
            profile_id: item.profile_id,
            role: item.role,
            profile: profileMap.get(item.profile_id) || null,
          })),
        locations: (locations || []).filter(
          (item) => item.project_id === project.id,
        ),
        plans: planRows.filter((item) => item.project_id === project.id),
        teams: (projectTeams || [])
          .filter((item) => item.project_id === project.id)
          .map((item) => teamMap.get(item.team_id))
          .filter(Boolean),
      })),
    });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await getOperationsContext(request);
    if (!context.canAdmin) {
      return NextResponse.json(
        { error: "Solo un administrador puede modificar proyectos." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as {
      action?: "create_project" | "create_location" | "link_team";
      projectId?: string;
      name?: string;
      code?: string;
      description?: string;
      locationType?: string;
      address?: string;
      teamId?: string;
    };

    if (body.action === "create_project") {
      if (!body.name?.trim()) {
        return NextResponse.json(
          { error: "Ingresa el nombre del proyecto." },
          { status: 400 },
        );
      }

      const code =
        body.code?.trim().toUpperCase() ||
        `PRJ-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

      const { data: project, error: projectError } = await context.admin
        .from("wama_projects")
        .insert({
          tenant_id: context.tenantId,
          code,
          name: body.name.trim(),
          description: body.description?.trim() || null,
          status: "active",
          created_by: context.profile.id,
        })
        .select("id,code,name,description,status")
        .single();

      if (projectError) throw projectError;

      const { error: moduleError } = await context.admin
        .from("wama_project_modules")
        .insert({
          project_id: project.id,
          tenant_module_license_id: context.license.id,
        });

      if (moduleError) throw moduleError;

      const { error: memberError } = await context.admin
        .from("wama_project_members")
        .upsert(
          {
            project_id: project.id,
            profile_id: context.profile.id,
            role: "admin",
          },
          { onConflict: "project_id,profile_id" },
        );

      if (memberError) throw memberError;

      return NextResponse.json({ ok: true, project }, { status: 201 });
    }

    if (body.action === "create_location") {
      if (!body.projectId || !body.name?.trim()) {
        return NextResponse.json(
          { error: "Falta proyecto o nombre de locación." },
          { status: 400 },
        );
      }

      const { data: project } = await context.admin
        .from("wama_projects")
        .select("id")
        .eq("id", body.projectId)
        .eq("tenant_id", context.tenantId)
        .maybeSingle();

      if (!project) {
        return NextResponse.json(
          { error: "Proyecto no válido." },
          { status: 400 },
        );
      }

      const { data: location, error } = await context.admin
        .from("wama_operations_locations")
        .insert({
          tenant_id: context.tenantId,
          project_id: body.projectId,
          code: body.code?.trim() || null,
          name: body.name.trim(),
          address: body.address?.trim() || null,
          location_type: body.locationType || "other",
          created_by: context.profile.id,
        })
        .select("*")
        .single();

      if (error) throw error;
      return NextResponse.json({ ok: true, location }, { status: 201 });
    }

    if (body.action === "link_team") {
      if (!body.projectId || !body.teamId) {
        return NextResponse.json(
          { error: "Falta proyecto o equipo." },
          { status: 400 },
        );
      }

      const [{ data: project }, { data: team }] = await Promise.all([
        context.admin
          .from("wama_projects")
          .select("id")
          .eq("id", body.projectId)
          .eq("tenant_id", context.tenantId)
          .maybeSingle(),
        context.admin
          .from("wama_operations_teams")
          .select("id")
          .eq("id", body.teamId)
          .eq("tenant_id", context.tenantId)
          .eq("status", "active")
          .maybeSingle(),
      ]);

      if (!project || !team) {
        return NextResponse.json(
          { error: "Proyecto o equipo no válido." },
          { status: 400 },
        );
      }

      const { error } = await context.admin
        .from("wama_operations_project_teams")
        .upsert(
          { project_id: body.projectId, team_id: body.teamId },
          { onConflict: "project_id,team_id" },
        );

      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { error: "Acción no válida." },
      { status: 400 },
    );
  } catch (error) {
    return fail(error);
  }
}
