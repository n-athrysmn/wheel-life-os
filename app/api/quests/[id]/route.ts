import {
  authorization,
  getUserRecord,
  updateUserRecord,
} from "@/lib/firebase/server-rest";
export async function GET(
  request: Request,
  context: RouteContext<"/api/quests/[id]">,
) {
  try {
    const { id } = await context.params;
    const quest = await getUserRecord(authorization(request), "quests", id);
    return quest
      ? Response.json(quest)
      : Response.json({ error: "Quest not found." }, { status: 404 });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Could not load quest.",
      },
      { status: 500 },
    );
  }
}
export async function PATCH(
  request: Request,
  context: RouteContext<"/api/quests/[id]">,
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    return Response.json(
      await updateUserRecord(authorization(request), "quests", id, {
        ...body,
        updatedAt: new Date().toISOString(),
      }),
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Could not update quest.",
      },
      { status: 500 },
    );
  }
}
