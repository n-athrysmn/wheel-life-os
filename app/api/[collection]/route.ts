import {
  assertEmblemEditor,
  authorization,
  createUserRecord,
  getUserRecords,
} from "@/lib/firebase/server-rest";
const allowed = new Set([
  "quests",
  "chapters",
  "chronicles",
  "emblems",
  "lore",
]);
export async function GET(
  request: Request,
  context: RouteContext<"/api/[collection]">,
) {
  try {
    const { collection } = await context.params;
    if (!allowed.has(collection))
      return Response.json({ error: "Not found." }, { status: 404 });
    const auth = authorization(request);
    return Response.json(await getUserRecords(auth, collection));
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Could not load records.",
      },
      { status: 500 },
    );
  }
}
export async function POST(
  request: Request,
  context: RouteContext<"/api/[collection]">,
) {
  try {
    const { collection } = await context.params;
    if (!allowed.has(collection))
      return Response.json({ error: "Not found." }, { status: 404 });
    const auth = authorization(request);
    if (collection === "emblems") await assertEmblemEditor(auth);
    const body = (await request.json()) as Record<string, unknown>;
    const documentId =
      typeof body._documentId === "string" ? body._documentId : undefined;
    delete body._documentId;
    const now = new Date().toISOString();
    const timestamped =
      collection === "lore"
        ? { ...body, createdAt: now }
        : { ...body, createdAt: now, updatedAt: now };
    return Response.json(
      await createUserRecord(auth, collection, timestamped, "", documentId),
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
