import { authorization, updateUserRecord } from "@/lib/firebase/server-rest";

const allowed = new Set(["images", "subquests", "artifacts", "keepsakes"]);

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/quests/[id]/[collection]/[childId]">,
) {
  try {
    const { id, collection, childId } = await context.params;
    if (!allowed.has(collection))
      return Response.json({ error: "Not found." }, { status: 404 });
    return Response.json(
      await updateUserRecord(
        authorization(request),
        `quests/${id}/${collection}`,
        childId,
        await request.json(),
      ),
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Could not update record.",
      },
      { status: 500 },
    );
  }
}
