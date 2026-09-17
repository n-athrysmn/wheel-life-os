import {
  authorization,
  createWheelUser,
  getWheelUser,
  updateUserRecord,
} from "@/lib/firebase/server-rest";
export async function GET(request: Request) {
  try {
    return Response.json(await getWheelUser(authorization(request)));
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Could not load user.",
      },
      { status: 500 },
    );
  }
}
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const now = new Date().toISOString();
    return Response.json(
      await createWheelUser(authorization(request), {
        name: String(body.name ?? "").trim(),
        email: String(body.email ?? "")
          .trim()
          .toLowerCase(),
        birthday: body.birthday ?? null,
        preferences: { theme: "dark", rotateLogo: true },
        createdAt: now,
        updatedAt: now,
      }),
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Could not create user.",
      },
      { status: 400 },
    );
  }
}
export async function PATCH(request: Request) {
  try {
    const auth = authorization(request);
    const user = await getWheelUser(auth);
    if (typeof user.id !== "string")
      throw new Error("Wheel user ID is missing.");
    return Response.json(
      await updateUserRecord(auth, "users", user.id, await request.json()),
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Could not update user.",
      },
      { status: 500 },
    );
  }
}
