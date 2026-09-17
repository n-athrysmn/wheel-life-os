import {
  normalizeWheelTheme,
  setWheelTheme,
  ThemeToggle,
} from "./theme-toggle";
import { useEffect, useState } from "react";
import { Modal } from "./modal";
import { Button } from "./ui";
import { useWheel } from "./wheel-provider";
import { defaultScreen } from "../helpers/navigation";
import { getFirebase } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { createFeedback, updateUser } from "@/components/helpers/endpoints";
import { startOfKualaLumpurDay, kualaLumpurDate } from "../helpers/date-time";

export function Header() {
  const {
    setView,
    closingSoon,
    profile,
    dataError,
    refreshData,
    setActionLoading,
  } = useWheel();
  const [panel, setPanel] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [rotateWheel, setRotateWheel] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ name: "", birthday: "" });
  const [profileError, setProfileError] = useState("");
  const [localNow, setLocalNow] = useState<Date | null>(null);
  const isGuest = getFirebase().auth.currentUser?.isAnonymous === true;
  function closePanel() {
    setPanel(null);
    setEditingProfile(false);
    setProfileError("");
  }
  async function saveUser(values: Record<string, unknown>) {
    setActionLoading("Writing it into the Wheel…");
    const response = await updateUser(values);
    setActionLoading(null);
    if (response.status >= 400) {
      setProfileError(
        response.data instanceof Error
          ? response.data.message
          : "Could not save settings.",
      );
      return false;
    }
    return true;
  }
  async function loadProfile() {
    setProfileLoading(true);
    await refreshData();
    setProfileLoading(false);
  }

  useEffect(() => {
    const preferences = profile?.preferences as
      | { rotateLogo?: unknown; theme?: unknown }
      | undefined;
    const applyPreferences = window.setTimeout(() => {
      if (typeof preferences?.rotateLogo === "boolean")
        setRotateWheel(preferences.rotateLogo);
      if (preferences?.theme)
        setWheelTheme(normalizeWheelTheme(preferences.theme));
    }, 0);
    return () => window.clearTimeout(applyPreferences);
  }, [profile]);

  useEffect(() => {
    const updateClock = () => setLocalNow(new Date());
    updateClock();
    const clock = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(clock);
  }, []);

  const localDateTime = localNow
    ? new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(localNow)
    : "—";
  const localTimeZone = localNow
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "";

  async function openPanel(name: string) {
    setPanel(name);
    if (
      (name === "Profile" || name === "Settings") &&
      !profile &&
      !profileLoading
    )
      await loadProfile();
  }

  async function leaveAccount() {
    await signOut(getFirebase().auth);
    setPanel(null);
  }
  return (
    <>
      <header className='wheel-menubar'>
        <div className='menubar-left'>
          <Button
            aria-label='Wheel home'
            onClick={() => setView(defaultScreen)}
            className='menubar-brand'
          >
            <svg
              className={
                rotateWheel ? "animate-[spin_20s_linear_infinite]" : ""
              }
              aria-hidden='true'
              viewBox='0 0 24 24'
              width='19'
              height='19'
              fill='none'
              stroke='currentColor'
              strokeWidth='1.6'
            >
              <circle cx='12' cy='12' r='9' />
              <circle cx='12' cy='12' r='2.5' />
              <path d='M12 3v6m0 6v6M3 12h6m6 0h6M5.6 5.6l4.6 4.6m3.6 3.6 4.6 4.6m0-12.8-4.6 4.6m-3.6 3.6-4.6 4.6' />
            </svg>
            <span>Wheel</span>
          </Button>
          <nav aria-label='Wheel actions' className='menubar-actions'>
            {["Profile", "Settings", "Help", "FAQ", "Feedback"].map((item) => (
              <Button
                key={item}
                onClick={() => void openPanel(item)}
                aria-haspopup='dialog'
                className='menubar-action'
              >
                {item}
              </Button>
            ))}
          </nav>
        </div>
        <div className='menubar-status'>
          <Button
            onClick={() => setView("screen-6")}
            aria-label={`${closingSoon} deadlines closing soon. Open Radar`}
            className='menubar-action menubar-radar'
            title='Due Dates Radar'
          >
            <svg
              aria-hidden='true'
              width='17'
              height='17'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='1.6'
            >
              <circle cx='12' cy='12' r='9' />
              <path d='M12 6v6l4 3' />
            </svg>
            <span>{closingSoon}</span>
          </Button>
          <span className='menubar-mode'>Life OS</span>
          <time
            className='menubar-date'
            dateTime={localNow?.toISOString()}
            title={
              localTimeZone
                ? `Local date and time · ${localTimeZone}`
                : "Local date and time"
            }
          >
            {localDateTime}
          </time>
        </div>
      </header>
      <Modal
        open={panel !== null}
        onClose={closePanel}
        title={panel ?? "Wheel"}
      >
        <div className='bg-wheel-cream text-wheel-ink p-6 rounded-2xl space-y-5'>
          <div className='flex items-center justify-between gap-4'>
            <h2 className='font-serif text-2xl font-bold'>{panel}</h2>
            <Button
              aria-label='Close'
              onClick={closePanel}
              className='px-2 py-1 text-xl text-wheel-slate'
            >
              ×
            </Button>
          </div>
          {panel === "Profile" && (
            <div className='space-y-4'>
              {profileLoading && (
                <p role='status' className='text-sm text-wheel-slate'>
                  Loading your profile…
                </p>
              )}
              {dataError && (
                <p role='alert' className='text-sm text-wheel-terracotta'>
                  {dataError}
                </p>
              )}
              <div className='flex items-center gap-3'>
                <span
                  aria-hidden='true'
                  className='grid place-items-center w-12 h-12 rounded-full bg-wheel-goldLight text-wheel-navy font-serif text-xl'
                >
                  {String(profile?.name || profile?.email || "W")
                    .slice(0, 1)
                    .toUpperCase()}
                </span>
                <span className='font-serif text-lg'>
                  {String(profile?.name || "Your Wheel profile")}
                </span>
              </div>
              {profile && !editingProfile && (
                <dl className='grid gap-3 text-sm'>
                  <div>
                    <dt className='text-base uppercase tracking-wide text-wheel-slate'>
                      Email
                    </dt>
                    <dd className='mt-1 break-words'>
                      {String(profile.email || "—")}
                    </dd>
                  </div>
                  <div>
                    <dt className='text-base uppercase tracking-wide text-wheel-slate'>
                      Birthday
                    </dt>
                    <dd className='mt-1'>
                      {profile.birthday
                        ? new Date(
                            String(profile.birthday),
                          ).toLocaleDateString()
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className='text-base uppercase tracking-wide text-wheel-slate'>
                      Theme
                    </dt>
                    <dd className='mt-1 capitalize'>
                      {(profile.preferences as { theme?: unknown } | undefined)
                        ?.theme
                        ? normalizeWheelTheme(
                            (profile.preferences as { theme?: unknown }).theme,
                          )
                        : "—"}
                    </dd>
                  </div>
                </dl>
              )}
              {editingProfile && (
                <form
                  className='space-y-3'
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const saved = await saveUser({
                      name: profileDraft.name.trim(),
                      birthday: profileDraft.birthday
                        ? startOfKualaLumpurDay(profileDraft.birthday)
                        : null,
                      updatedAt: new Date().toISOString(),
                    });
                    if (saved) setEditingProfile(false);
                  }}
                >
                  <label className='block text-base uppercase text-wheel-slate'>
                    Name
                    <input
                      required
                      value={profileDraft.name}
                      onChange={(event) =>
                        setProfileDraft({
                          ...profileDraft,
                          name: event.target.value,
                        })
                      }
                      className='mt-1 block w-full rounded-lg border border-wheel-sand bg-white px-3 py-2 text-sm normal-case text-wheel-ink'
                    />
                  </label>
                  <label className='block text-base uppercase text-wheel-slate'>
                    Birthday
                    <input
                      type='date'
                      value={profileDraft.birthday}
                      onChange={(event) =>
                        setProfileDraft({
                          ...profileDraft,
                          birthday: event.target.value,
                        })
                      }
                      className='mt-1 block w-full rounded-lg border border-wheel-sand bg-white px-3 py-2 text-sm normal-case text-wheel-ink'
                    />
                  </label>
                  <div className='flex justify-end gap-3'>
                    <Button onClick={() => setEditingProfile(false)}>
                      Cancel
                    </Button>
                    <Button
                      type='submit'
                      className='rounded-lg bg-wheel-navy px-4 py-2 text-wheel-cream'
                    >
                      Save Profile
                    </Button>
                  </div>
                </form>
              )}
              {profileError && (
                <p role='alert' className='text-base text-wheel-terracotta'>
                  {profileError}
                </p>
              )}
              {!editingProfile && (
                <div className='flex flex-wrap justify-end gap-3 border-t border-wheel-sand pt-4'>
                  {!isGuest && (
                    <Button
                      onClick={() => {
                        setProfileDraft({
                          name: String(profile?.name ?? ""),
                          birthday: profile?.birthday
                            ? kualaLumpurDate(String(profile.birthday))
                            : "",
                        });
                        setProfileError("");
                        setEditingProfile(true);
                      }}
                      className='px-4 py-2 rounded-lg border border-wheel-sand text-sm'
                    >
                      Edit Profile
                    </Button>
                  )}
                  <Button
                    onClick={leaveAccount}
                    className='px-4 py-2 rounded-lg bg-wheel-navy text-wheel-cream text-sm'
                  >
                    Logout / Switch Account
                  </Button>
                </div>
              )}
            </div>
          )}
          {panel === "Settings" && (
            <div className='space-y-4'>
              <ThemeToggle
                onChange={(theme) => {
                  const preferences = profile?.preferences as
                    | Record<string, unknown>
                    | undefined;
                  void saveUser({
                    preferences: {
                      ...preferences,
                      theme,
                      rotateLogo: rotateWheel,
                    },
                    updatedAt: new Date().toISOString(),
                  });
                }}
              />
              <label className='flex items-center justify-between gap-4 text-sm'>
                <span>
                  Rotate the Wheel icon
                  <span className='block text-base text-wheel-slate mt-1'>
                    A gentle spin in the menu bar.
                  </span>
                </span>
                <input
                  type='checkbox'
                  checked={rotateWheel}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setRotateWheel(checked);
                    const preferences = profile?.preferences as
                      | Record<string, unknown>
                      | undefined;
                    void saveUser({
                      preferences: { ...preferences, rotateLogo: checked },
                      updatedAt: new Date().toISOString(),
                    });
                  }}
                  className='w-4 h-4 accent-wheel-sage'
                />
              </label>
              <p className='text-base text-wheel-slate'>
                These controls start from your saved Wheel preferences. Your
                device’s reduced-motion preference is always respected.
              </p>
            </div>
          )}
          {panel === "Help" && (
            <div className='space-y-4 text-sm text-wheel-slate'>
              <p>
                Use the dock to move between your life’s chronicles, quests, and
                possibilities.
              </p>
              <ol className='list-decimal pl-5 space-y-3'>
                <li>
                  <strong className='text-wheel-ink'>Due Dates Radar</strong>{" "}
                  shows upcoming milestones. Complete a side quest here or in
                  Quest Detail.
                </li>
                <li>
                  <strong className='text-wheel-ink'>Chronicles</strong> keeps
                  your current and past chronicles. Choose New Chronicle to
                  begin another.
                </li>
                <li>
                  <strong className='text-wheel-ink'>Canon</strong> holds
                  possibilities. Choose New Quest to add one, then select it
                  when creating a chronicle.
                </li>
              </ol>
            </div>
          )}
          {panel === "Feedback" && (
            <form
              className='space-y-4'
              onSubmit={async (event) => {
                event.preventDefault();
                const message = feedback.trim();
                if (!message) return;
                setFeedbackError("");
                setFeedbackSaved(false);
                setActionLoading("Writing it into the Wheel…");
                const response = await createFeedback(message);
                setActionLoading(null);
                if (response.status !== 201 || response.data instanceof Error) {
                  setFeedbackError(
                    response.data instanceof Error
                      ? response.data.message
                      : "Could not send feedback.",
                  );
                  return;
                }
                setFeedback("");
                setFeedbackSaved(true);
              }}
            >
              <label className='block text-sm font-medium'>
                What could we improve?
                <textarea
                  required
                  rows={5}
                  value={feedback}
                  onChange={(event) => {
                    setFeedback(event.target.value);
                    setFeedbackSaved(false);
                    setFeedbackError("");
                  }}
                  maxLength={5000}
                  placeholder='Share an idea, report a problem, or tell us what you like.'
                  className='block w-full mt-2 px-3 py-2 rounded-lg border border-wheel-sand bg-white text-wheel-ink'
                />
              </label>
              <p className='text-base text-wheel-slate'>
                Your name and email will be included with your feedback.
              </p>
              <div className='flex justify-end'>
                <Button
                  type='submit'
                  disabled={!feedback.trim()}
                  className='px-4 py-2 rounded-lg bg-wheel-navy text-wheel-cream text-sm'
                >
                  Send Feedback
                </Button>
              </div>
              {feedbackSaved && (
                <p role='status' className='text-sm text-wheel-sage'>
                  Thank you. Your feedback has been sent.
                </p>
              )}
              {feedbackError && (
                <p role='alert' className='text-sm text-wheel-terracotta'>
                  {feedbackError}
                </p>
              )}
            </form>
          )}
          {panel === "FAQ" && (
            <div className='space-y-3 text-sm'>
              {[
                [
                  "Are my changes saved?",
                  "When signed in to Firebase, quests, side quests, chronicles, and deadlines save automatically. Check the save indicator before closing the page. Demo mode is session-only.",
                ],
                [
                  "How is quest progress calculated?",
                  "Completed difficulty points are divided by total points: Easy 1, Medium 2, Hard 3, and Critical 5. A quest with no side quests can be marked complete directly.",
                ],
                [
                  "What date does the Radar use?",
                  "Wheel uses the current date from your device. Deadline groups and counts are calculated from that date.",
                ],
                [
                  "Can I keep previous chronicles?",
                  "Yes. Starting a new chronicle keeps earlier chronicles in the Chronicles list, and Firebase saves them when connected.",
                ],
              ].map(([question, answer]) => (
                <details
                  key={question}
                  className='border border-wheel-sand rounded-lg p-3'
                >
                  <summary className='cursor-pointer font-medium'>
                    {question}
                  </summary>
                  <p className='mt-3 text-wheel-slate leading-relaxed'>
                    {answer}
                  </p>
                </details>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
