import {
  assertEmblemEditor,
  authorization,
  updateUserRecord,
} from "@/lib/firebase/server-rest";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/emblems/[id]">,
) {
  try {
    const auth = authorization(request);
    await assertEmblemEditor(auth);
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    return Response.json(
      await updateUserRecord(auth, "emblems", id, {
        ...body,
        updatedAt: new Date().toISOString(),
      }),
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Could not update emblem.",
      },
      { status: 403 },
    );
  }
}
