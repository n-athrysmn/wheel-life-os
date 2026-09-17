import {
  authorization,
  createFeedbackRecord,
} from "@/lib/firebase/server-rest";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { message?: unknown };
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) {
      return Response.json(
        { error: "Feedback cannot be empty." },
        { status: 400 },
      );
    }
    if (message.length > 5000) {
      return Response.json(
        { error: "Feedback must be 5,000 characters or fewer." },
        { status: 400 },
      );
    }
    return Response.json(
      await createFeedbackRecord(authorization(request), message),
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Could not send feedback.",
      },
      { status: 500 },
    );
  }
}
