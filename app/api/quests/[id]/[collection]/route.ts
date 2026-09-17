import { authorization, createUserRecord } from "@/lib/firebase/server-rest";

const allowed = new Set(["images", "subquests", "artifacts", "keepsakes"]);

export async function POST(
  request: Request,
  context: RouteContext<"/api/quests/[id]/[collection]">,
) {
  try {
    const { id, collection } = await context.params;
    if (!allowed.has(collection))
      return Response.json({ error: "Not found." }, { status: 404 });
    return Response.json(
      await createUserRecord(
        authorization(request),
        collection,
        await request.json(),
        `quests/${id}`,
      ),
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Could not create record.",
      },
      { status: 500 },
    );
  }
}
