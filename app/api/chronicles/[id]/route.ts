import { authorization, updateUserRecord } from "@/lib/firebase/server-rest";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/chronicles/[id]">,
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    return Response.json(
      await updateUserRecord(authorization(request), "chronicles", id, {
        ...body,
        updatedAt: new Date().toISOString(),
      }),
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not update chronicle.",
      },
      { status: 500 },
    );
  }
}
