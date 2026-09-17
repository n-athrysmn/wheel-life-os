import "server-only";
type Value = Record<string, unknown>;
type Document = { name: string; fields?: Record<string, Value> };
function projectId() {
  const value = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!value) throw new Error("Firebase project ID is missing.");
  return value;
}
export function authorization(request: Request) {
  const value = request.headers.get("authorization");
  if (!value?.startsWith("Bearer "))
    throw new Error("Authentication is required.");
  return value;
}
function uid(auth: string) {
  const value = JSON.parse(
    Buffer.from(auth.slice(7).split(".")[1], "base64url").toString("utf8"),
  );
  if (typeof value.sub !== "string")
    throw new Error("Invalid authentication token.");
  return value.sub as string;
}
function decode(value: Value): unknown {
  if ("nullValue" in value) return null;
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("timestampValue" in value) return value.timestampValue;
  if ("referenceValue" in value) return value.referenceValue;
  if ("arrayValue" in value)
    return ((value.arrayValue as { values?: Value[] }).values ?? []).map(
      decode,
    );
  if ("mapValue" in value)
    return Object.fromEntries(
      Object.entries(
        (value.mapValue as { fields?: Record<string, Value> }).fields ?? {},
      ).map(([key, item]) => [key, decode(item)]),
    );
}
function record(document: Document) {
  return {
    id: document.name.split("/").at(-1),
    ...Object.fromEntries(
      Object.entries(document.fields ?? {}).map(([key, value]) => [
        key,
        decode(value),
      ]),
    ),
  };
}
function encode(value: unknown): Value {
  if (value === null) return { nullValue: null };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number")
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  if (Array.isArray(value))
    return { arrayValue: { values: value.map(encode) } };
  if (value && typeof value === "object")
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value)
            .filter(([, item]) => item !== undefined)
            .map(([key, item]) => [key, encode(item)]),
        ),
      },
    };
  return { nullValue: null };
}
async function runQuery(
  auth: string,
  structuredQuery: Record<string, unknown>,
  parent = "",
) {
  const path = parent ? `/documents/${parent}:runQuery` : "/documents:runQuery";
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId()}/databases/(default)${path}`,
    {
      method: "POST",
      cache: "no-store",
      headers: { authorization: auth, "content-type": "application/json" },
      body: JSON.stringify({ structuredQuery }),
    },
  );
  if (!response.ok)
    throw new Error(`Firestore request failed (${response.status}).`);
  return ((await response.json()) as { document?: Document }[]).flatMap(
    (item) => (item.document ? [record(item.document)] : []),
  );
}
export async function getWheelUser(auth: string) {
  const users = await runQuery(auth, {
    from: [{ collectionId: "users" }],
    where: {
      fieldFilter: {
        field: { fieldPath: "authUid" },
        op: "EQUAL",
        value: { stringValue: uid(auth) },
      },
    },
    limit: 1,
  });
  if (!users[0])
    throw new Error("No Wheel user matches the signed-in account.");
  return users[0];
}
export async function createWheelUser(
  auth: string,
  values: Record<string, unknown>,
) {
  const authUid = uid(auth);
  const fields = Object.fromEntries(
    Object.entries({ ...values, authUid })
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, encode(value)]),
  );
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId()}/databases/(default)/documents/users?documentId=${encodeURIComponent(authUid)}`,
    {
      method: "POST",
      headers: { authorization: auth, "content-type": "application/json" },
      body: JSON.stringify({ fields }),
    },
  );
  if (!response.ok)
    throw new Error(`Firestore user create failed (${response.status}).`);
  return record((await response.json()) as Document);
}
export async function assertEmblemEditor(auth: string) {
  const user = await getWheelUser(auth);
  const email = (user as Record<string, unknown>).email;
  if (
    String(email ?? "")
      .trim()
      .toLowerCase() !== "yui.jayn@gmail.com"
  ) {
    throw new Error("You do not have permission to edit emblems.");
  }
  return user;
}
export async function getUserRecords(auth: string, collectionName: string) {
  const user = await getWheelUser(auth);
  const records = await runQuery(
    auth,
    { from: [{ collectionId: collectionName }] },
    `users/${user.id}`,
  );
  if (collectionName !== "quests") return records;
  return Promise.all(
    records.map(async (quest) => {
      const parent = `users/${user.id}/quests/${quest.id}`;
      const [subquests, images, artifacts, keepsakes] = await Promise.all([
        runQuery(auth, { from: [{ collectionId: "subquests" }] }, parent),
        runQuery(auth, { from: [{ collectionId: "images" }] }, parent),
        runQuery(auth, { from: [{ collectionId: "artifacts" }] }, parent),
        runQuery(auth, { from: [{ collectionId: "keepsakes" }] }, parent),
      ]);
      return { ...quest, subquests, images, artifacts, keepsakes };
    }),
  );
}
export async function getUserRecord(
  auth: string,
  collectionName: string,
  id: string,
) {
  return (
    (await getUserRecords(auth, collectionName)).find(
      (item) => item.id === id,
    ) ?? null
  );
}
export async function updateUserRecord(
  auth: string,
  collectionName: string,
  id: string,
  values: Record<string, unknown>,
) {
  const user = await getWheelUser(auth);
  const fields = Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, encode(value)]),
  );
  const masks = Object.keys(fields)
    .map((key) => `updateMask.fieldPaths=${encodeURIComponent(key)}`)
    .join("&");
  const documentPath =
    collectionName === "users"
      ? `users/${encodeURIComponent(id)}`
      : `users/${user.id}/${collectionName}/${encodeURIComponent(id)}`;
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId()}/databases/(default)/documents/${documentPath}?${masks}`,
    {
      method: "PATCH",
      headers: { authorization: auth, "content-type": "application/json" },
      body: JSON.stringify({ fields }),
    },
  );
  if (!response.ok)
    throw new Error(`Firestore update failed (${response.status}).`);
  return record((await response.json()) as Document);
}
export async function createUserRecord(
  auth: string,
  collectionName: string,
  values: Record<string, unknown>,
  parentPath = "",
  documentId = crypto.randomUUID(),
) {
  const user = await getWheelUser(auth);
  const id = documentId;
  const parent = parentPath
    ? `users/${user.id}/${parentPath}`
    : `users/${user.id}`;
  const fields = Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, encode(value)]),
  );
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId()}/databases/(default)/documents/${parent}/${collectionName}?documentId=${id}`,
    {
      method: "POST",
      headers: { authorization: auth, "content-type": "application/json" },
      body: JSON.stringify({ fields }),
    },
  );
  if (!response.ok)
    throw new Error(`Firestore create failed (${response.status}).`);
  return record((await response.json()) as Document);
}
export async function createFeedbackRecord(auth: string, message: string) {
  const user = (await getWheelUser(auth)) as Record<string, unknown>;
  const id = crypto.randomUUID();
  const fields = {
    name: encode(String(user.name ?? "")),
    email: encode(String(user.email ?? "")),
    message: encode(message),
    createdAt: encode(new Date()),
  };
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId()}/databases/(default)/documents/feedback?documentId=${id}`,
    {
      method: "POST",
      headers: { authorization: auth, "content-type": "application/json" },
      body: JSON.stringify({ fields }),
    },
  );
  if (!response.ok)
    throw new Error(`Firestore feedback create failed (${response.status}).`);
  return record((await response.json()) as Document);
}
