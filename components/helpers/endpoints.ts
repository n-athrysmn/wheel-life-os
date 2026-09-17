import { getFirebase } from "@/lib/firebase";
import type { ApiResponse, FirebaseRecord } from "./interface";

const requestCache = new Map<string, Promise<ApiResponse<unknown>>>();
type GuestMutationChoice = "session" | "login";
let guestMutationDecision: Promise<GuestMutationChoice> | null = null;
let guestWriteBatchApproved = false;

function confirmGuestMutation() {
  if (!guestMutationDecision) {
    guestMutationDecision = new Promise<GuestMutationChoice>((resolve) => {
      window.dispatchEvent(
        new CustomEvent("wheel:guest-mutation", { detail: { resolve } }),
      );
    }).finally(() => {
      guestMutationDecision = null;
    });
  }
  return guestMutationDecision;
}

function request<T>(
  path: string,
  refresh = false,
): Promise<ApiResponse<T | unknown>> {
  const userId = getFirebase().auth.currentUser?.uid ?? "signed-out";
  const key = `${userId}:${path}`;
  const existing = refresh ? undefined : requestCache.get(key);
  if (existing) return existing as Promise<ApiResponse<T | unknown>>;

  const pending = performRequest<T>(path);
  requestCache.set(key, pending as Promise<ApiResponse<unknown>>);
  return pending;
}

async function performRequest<T>(
  path: string,
): Promise<ApiResponse<T | unknown>> {
  try {
    const user = getFirebase().auth.currentUser;
    if (!user) throw new Error("You must be signed in.");

    const response = await fetch(path, {
      headers: { authorization: `Bearer ${await user.getIdToken()}` },
      cache: "no-store",
    });
    const data = await response.json();

    return {
      status: response.status,
      data: response.ok ? data : new Error(data.error || "Request failed."),
    };
  } catch (error) {
    requestCache.clear();
    return { status: 500, data: error };
  }
}

async function mutate<T>(
  path: string,
  method: "POST" | "PATCH",
  body: Record<string, unknown>,
): Promise<ApiResponse<T | unknown>> {
  try {
    const user = getFirebase().auth.currentUser;
    if (!user) throw new Error("You must be signed in.");
    if (user.isAnonymous) {
      if (!guestWriteBatchApproved) {
        const choice = await confirmGuestMutation();
        if (choice === "login") {
          return {
            status: 409,
            data: new Error("Sign in to save this change."),
          };
        }
        guestWriteBatchApproved = true;
        window.setTimeout(() => {
          guestWriteBatchApproved = false;
        }, 0);
      }
      return {
        status: method === "POST" ? 201 : 200,
        data: {
          id: `session-${crypto.randomUUID()}`,
          ...body,
        } as T,
      };
    }
    const response = await fetch(path, {
      method,
      headers: {
        authorization: `Bearer ${await user.getIdToken()}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (response.ok) {
      requestCache.clear();
      window.dispatchEvent(new Event("wheel:data-changed"));
    }
    return {
      status: response.status,
      data: response.ok ? data : new Error(data.error || "Request failed."),
    };
  } catch (error) {
    return { status: 500, data: error };
  }
}

const getUser = () => request<FirebaseRecord>("/api/user");
const createUser = (body: Record<string, unknown>) =>
  mutate<FirebaseRecord>("/api/user", "POST", body);
const updateUser = (body: Record<string, unknown>) =>
  mutate<FirebaseRecord>("/api/user", "PATCH", body);
const getQuests = () => request<FirebaseRecord[]>("/api/quests");
const getChapters = () => request<FirebaseRecord[]>("/api/chapters");
const getChronicles = () => request<FirebaseRecord[]>("/api/chronicles");
const getEmblems = () => request<FirebaseRecord[]>("/api/emblems");
const createEmblem = (body: Record<string, unknown>) =>
  mutate<FirebaseRecord>("/api/emblems", "POST", body);
const updateEmblem = (emblemId: string, body: Record<string, unknown>) =>
  mutate<FirebaseRecord>(
    `/api/emblems/${encodeURIComponent(emblemId)}`,
    "PATCH",
    body,
  );
const getLores = () => request<FirebaseRecord[]>("/api/lore", true);
const getQuest = (questId: string) =>
  request<FirebaseRecord>(`/api/quests/${encodeURIComponent(questId)}`);
const updateQuest = (questId: string, body: Record<string, unknown>) =>
  mutate<FirebaseRecord>(
    `/api/quests/${encodeURIComponent(questId)}`,
    "PATCH",
    body,
  );
const createQuest = (body: Record<string, unknown>) =>
  mutate<FirebaseRecord>("/api/quests", "POST", body);
const createChapter = (body: Record<string, unknown>) =>
  mutate<FirebaseRecord>("/api/chapters", "POST", body);
const updateChapter = (chapterId: string, body: Record<string, unknown>) =>
  mutate<FirebaseRecord>(
    `/api/chapters/${encodeURIComponent(chapterId)}`,
    "PATCH",
    body,
  );
const createChronicle = (body: Record<string, unknown>) =>
  mutate<FirebaseRecord>("/api/chronicles", "POST", body);
const updateChronicle = (chronicleId: string, body: Record<string, unknown>) =>
  mutate<FirebaseRecord>(
    `/api/chronicles/${encodeURIComponent(chronicleId)}`,
    "PATCH",
    body,
  );
const createLore = (body: Record<string, unknown>) =>
  mutate<FirebaseRecord>("/api/lore", "POST", body);
const createFeedback = (message: string) =>
  mutate<FirebaseRecord>("/api/feedback", "POST", { message });
type QuestChildCollection = "images" | "subquests" | "artifacts" | "keepsakes";
const createQuestChild = (
  questId: string,
  collection: QuestChildCollection,
  body: Record<string, unknown>,
) =>
  mutate<FirebaseRecord>(
    `/api/quests/${encodeURIComponent(questId)}/${collection}`,
    "POST",
    body,
  );
const updateQuestChild = (
  questId: string,
  collection: QuestChildCollection,
  childId: string,
  body: Record<string, unknown>,
) =>
  mutate<FirebaseRecord>(
    `/api/quests/${encodeURIComponent(questId)}/${collection}/${encodeURIComponent(childId)}`,
    "PATCH",
    body,
  );

export {
  getUser,
  createUser,
  updateUser,
  getQuests,
  getChapters,
  getChronicles,
  getEmblems,
  createEmblem,
  updateEmblem,
  getLores,
  getQuest,
  createQuest,
  updateQuest,
  createChapter,
  updateChapter,
  createChronicle,
  updateChronicle,
  createLore,
  createFeedback,
  createQuestChild,
  updateQuestChild,
};
