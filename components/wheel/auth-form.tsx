import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  linkWithPopup,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  type User,
} from "firebase/auth";
import { getFirebase } from "@/lib/firebase";
import { createUser } from "@/components/helpers/endpoints";
import { startOfKualaLumpurDay } from "../helpers/date-time";
import { Button } from "./ui";

export function AuthForm({
  guest,
  onLinked,
  lockScreen = false,
}: {
  guest?: User;
  onLinked?: () => void;
  lockScreen?: boolean;
}) {
  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lockExpanded, setLockExpanded] = useState(false);
  async function perform(action: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setPassword("");
    } catch (failure) {
      const code = (failure as { code?: string }).code;
      const messages: Record<string, string> = {
        "auth/invalid-credential": "The email or password is incorrect.",
        "auth/user-not-found": "The email or password is incorrect.",
        "auth/wrong-password": "The email or password is incorrect.",
        "auth/email-already-in-use":
          "This email already has an account. Sign in to that account instead.",
        "auth/credential-already-in-use":
          "This login belongs to another account. Switch accounts to open it; your guest workspace will not be merged.",
        "auth/weak-password":
          "Please use a stronger password that meets your project's password policy.",
        "auth/popup-closed-by-user":
          "The sign-in window was closed. You can try again.",
        "auth/popup-blocked":
          "Allow popups for this site to use Google sign-in.",
        "auth/too-many-requests":
          "Too many attempts. Please wait before trying again.",
        "auth/operation-not-allowed":
          "This sign-in method is not enabled in Firebase yet.",
      };
      setError(
        messages[code || ""] ||
          "Could not sign in. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  const field = lockScreen
    ? "block w-full mt-1.5 rounded-xl border border-white/35 bg-black/20 px-3 py-2.5 text-white placeholder:text-white/55 shadow-inner backdrop-blur-md focus:border-white/70 focus:outline-none"
    : "block w-full mt-2 px-3 py-2 border border-wheel-sand bg-white text-wheel-ink rounded-lg";
  if (lockScreen && !lockExpanded) {
    return (
      <div className='space-y-2 text-white drop-shadow-[0_2px_8px_rgba(13,20,31,.55)]'>
        <Button
          disabled={busy}
          onClick={() => setLockExpanded(true)}
          className='group flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left hover:bg-black/15 focus:bg-black/20'
        >
          <span
            aria-hidden='true'
            className='grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/50 bg-wheel-gold font-serif text-xl font-bold text-wheel-navy shadow-lg'
          >
            W
          </span>
          <span>
            <strong className='block text-sm text-white'>Wheel Account</strong>
            <span className='block text-base text-white/70'>
              Sign in with email
            </span>
          </span>
        </Button>
        <Button
          disabled={busy}
          onClick={() =>
            perform(() =>
              signInWithPopup(getFirebase().auth, new GoogleAuthProvider()),
            )
          }
          className='group flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left hover:bg-black/15 focus:bg-black/20'
        >
          <span
            aria-hidden='true'
            className='grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/50 bg-white font-sans text-lg font-bold text-[#4285f4] shadow-lg'
          >
            G
          </span>
          <span>
            <strong className='block text-sm text-white'>
              {busy ? "Opening Google…" : "Google Account"}
            </strong>
            <span className='block text-base text-white/70'>
              Continue with Google
            </span>
          </span>
        </Button>
        <Button
          disabled={busy}
          onClick={() => perform(() => signInAnonymously(getFirebase().auth))}
          className='mx-auto block px-3 py-2 text-base text-white/75 underline underline-offset-4'
        >
          Continue as guest
        </Button>
        {error && (
          <p
            role='alert'
            className='rounded-lg bg-black/25 px-3 py-2 text-center text-base text-[#ffd0c6]'
          >
            {error}
          </p>
        )}
      </div>
    );
  }
  if (lockScreen && lockExpanded && !guest) {
    const canSubmit =
      email.trim().length > 0 &&
      password.length > 0 &&
      (mode !== "register" || (name.trim().length > 0 && birthday.length > 0));
    return (
      <div className='mx-auto w-full max-w-[19rem] text-center text-white drop-shadow-[0_2px_8px_rgba(13,20,31,.55)]'>
        <Button
          aria-label='Back to sign-in options'
          disabled={busy}
          onClick={() => {
            setLockExpanded(false);
            setMode("login");
            setPassword("");
            setError("");
            setNotice("");
          }}
          className='relative mx-auto block h-14 w-24 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white'
        >
          <span
            aria-hidden='true'
            className='absolute left-0 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-white font-sans text-sm font-bold text-[#4285f4] shadow-md'
          >
            G
          </span>
          <span
            aria-hidden='true'
            className='absolute right-0 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-wheel-navy text-lg text-white shadow-md'
          >
            ◦
          </span>
          <span
            aria-hidden='true'
            className='absolute left-1/2 top-1/2 z-10 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/55 bg-wheel-gold font-serif text-xl font-bold text-wheel-navy shadow-lg transition-transform hover:scale-105'
          >
            W
          </span>
        </Button>
        <p className='mt-2 text-sm font-semibold'>Wheel Account</p>
        <form
          className='mt-3 space-y-2'
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSubmit) return;
            void perform(async () => {
              const { auth } = getFirebase();
              if (mode === "register") {
                await createUserWithEmailAndPassword(
                  auth,
                  email.trim(),
                  password,
                );
                const response = await createUser({
                  name: name.trim(),
                  email: email.trim(),
                  birthday: startOfKualaLumpurDay(birthday),
                });
                if (response.status >= 400 || response.data instanceof Error)
                  throw response.data instanceof Error
                    ? response.data
                    : new Error("Could not create your Wheel profile.");
              } else {
                await signInWithEmailAndPassword(auth, email.trim(), password);
              }
            });
          }}
        >
          {mode === "register" && (
            <>
              <label className='sr-only' htmlFor='lock-name'>
                Name
              </label>
              <input
                id='lock-name'
                type='text'
                required
                autoComplete='name'
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={busy}
                placeholder='Name'
                className='block w-full rounded-full border border-white/45 bg-black/25 px-4 py-2 text-sm text-white shadow-inner backdrop-blur-md placeholder:text-white/60 focus:border-white/80 focus:outline-none'
              />
              <label className='sr-only' htmlFor='lock-birthday'>
                Birthday
              </label>
              <input
                id='lock-birthday'
                type='date'
                required
                autoComplete='bday'
                value={birthday}
                onChange={(event) => setBirthday(event.target.value)}
                disabled={busy}
                aria-label='Birthday'
                className='block w-full rounded-full border border-white/45 bg-black/25 px-4 py-2 text-sm text-white shadow-inner backdrop-blur-md [color-scheme:dark] focus:border-white/80 focus:outline-none'
              />
            </>
          )}
          <label className='sr-only' htmlFor='lock-email'>
            Email
          </label>
          <input
            id='lock-email'
            type='email'
            required
            autoComplete='email'
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={busy}
            placeholder='Email'
            className='block w-full rounded-full border border-white/45 bg-black/25 px-4 py-2 text-sm text-white shadow-inner backdrop-blur-md placeholder:text-white/60 focus:border-white/80 focus:outline-none'
          />
          <div className='relative'>
            <label className='sr-only' htmlFor='lock-password'>
              Password
            </label>
            <input
              id='lock-password'
              type='password'
              required
              minLength={mode === "register" ? 6 : undefined}
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={busy}
              placeholder='Password'
              className='block w-full rounded-full border border-white/45 bg-black/25 px-4 py-2 pr-11 text-sm text-white shadow-inner backdrop-blur-md placeholder:text-white/60 focus:border-white/80 focus:outline-none'
            />
            {canSubmit && (
              <Button
                type='submit'
                disabled={busy}
                aria-label={mode === "register" ? "Create account" : "Sign in"}
                className='absolute right-1 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-white/60 bg-white/15 text-lg leading-none text-white hover:bg-white/25'
              >
                {busy ? (
                  <span className='h-3.5 w-3.5 animate-spin rounded-full border border-white/45 border-t-white' />
                ) : (
                  <span aria-hidden='true'>→</span>
                )}
              </Button>
            )}
          </div>
        </form>
        <div className='mt-2 flex flex-col items-center gap-1 text-base text-white/80'>
          <Button
            disabled={busy}
            onClick={() => {
              if (!email.trim()) {
                setError(
                  "Enter your email first, then choose Forgot password.",
                );
                return;
              }
              void perform(async () => {
                await sendPasswordResetEmail(getFirebase().auth, email.trim());
                setNotice(
                  "If this email has an account, check its inbox for a reset link.",
                );
              });
            }}
            className='underline underline-offset-4 hover:text-white'
          >
            Forgot password?
          </Button>
          <Button
            disabled={busy}
            onClick={() => {
              setMode(mode === "register" ? "login" : "register");
              setPassword("");
              setName("");
              setBirthday("");
              setError("");
              setNotice("");
            }}
            className='underline underline-offset-4 hover:text-white'
          >
            {mode === "register" ? "Back to sign in" : "Create an account"}
          </Button>
        </div>
        {error && (
          <p
            role='alert'
            className='mt-2 rounded-lg bg-black/25 px-3 py-2 text-base text-[#ffd0c6]'
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            role='status'
            className='mt-2 rounded-lg bg-black/25 px-3 py-2 text-base text-white/90'
          >
            {notice}
          </p>
        )}
      </div>
    );
  }
  return (
    <div
      className={
        lockScreen
          ? "space-y-3 rounded-3xl border border-white/25 bg-wheel-navy/55 p-5 text-white shadow-2xl backdrop-blur-xl"
          : "space-y-4"
      }
    >
      {lockScreen && (
        <div className='flex items-center justify-between gap-3'>
          <div className='flex items-center gap-3'>
            <span
              aria-hidden='true'
              className='grid h-10 w-10 place-items-center rounded-full bg-wheel-gold font-serif font-bold text-wheel-navy'
            >
              W
            </span>
            <span className='text-sm font-semibold'>Wheel Account</span>
          </div>
          <Button
            onClick={() => {
              setLockExpanded(false);
              setError("");
              setNotice("");
            }}
            className='rounded-lg px-2 py-1 text-lg text-white/70 hover:bg-white/10'
          >
            ×
          </Button>
        </div>
      )}
      {!guest && (
        <div
          className={`flex gap-3 text-sm ${lockScreen ? "justify-center" : ""}`}
        >
          {(["login", "register"] as const).map((value) => (
            <Button
              key={value}
              disabled={busy}
              aria-pressed={mode === value}
              onClick={() => {
                setMode(value);
                setError("");
                setNotice("");
                setPassword("");
              }}
              className={
                mode === value
                  ? "font-semibold underline underline-offset-4"
                  : lockScreen
                    ? "text-white/65"
                    : "text-wheel-slate"
              }
            >
              {value === "login" ? "Sign in" : "Create account"}
            </Button>
          ))}
        </div>
      )}
      {guest && (
        <p className='text-sm text-wheel-slate'>
          Link an unused email or Google account to keep this guest workspace
          and access it on other devices. To use an existing account, choose
          Switch account below.
        </p>
      )}
      <form
        className='space-y-4'
        onSubmit={(event) => {
          event.preventDefault();
          void perform(async () => {
            const { auth } = getFirebase();
            if (guest) {
              await linkWithCredential(
                guest,
                EmailAuthProvider.credential(email.trim(), password),
              );
              onLinked?.();
            } else if (mode === "reset") {
              await sendPasswordResetEmail(auth, email.trim());
              setNotice(
                "If this email has an account, check its inbox for a reset link.",
              );
            } else if (mode === "register")
              await createUserWithEmailAndPassword(
                auth,
                email.trim(),
                password,
              );
            else await signInWithEmailAndPassword(auth, email.trim(), password);
          });
        }}
      >
        <label
          className={`block text-sm ${lockScreen ? "font-medium text-white/90" : ""}`}
        >
          Email
          <input
            type='email'
            required
            autoComplete='email'
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={busy}
            className={field}
          />
        </label>
        {(guest || mode !== "reset") && (
          <label
            className={`block text-sm ${lockScreen ? "font-medium text-white/90" : ""}`}
          >
            Password
            <input
              type='password'
              required
              minLength={guest || mode === "register" ? 6 : undefined}
              autoComplete={
                guest || mode === "register"
                  ? "new-password"
                  : "current-password"
              }
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={busy}
              className={field}
            />
          </label>
        )}
        <Button
          type='submit'
          disabled={busy}
          className={
            lockScreen
              ? "w-full rounded-xl bg-white/90 p-3 font-semibold text-wheel-navy shadow-lg hover:bg-white"
              : "w-full bg-wheel-navy text-wheel-cream rounded-lg p-3"
          }
        >
          {busy
            ? "Please wait…"
            : guest
              ? "Link email & keep workspace"
              : mode === "register"
                ? "Create account"
                : mode === "reset"
                  ? "Send reset link"
                  : "Sign in with email"}
        </Button>
      </form>
      {!guest && (
        <Button
          disabled={busy}
          onClick={() => {
            setMode(mode === "reset" ? "login" : "reset");
            setPassword("");
            setError("");
            setNotice("");
          }}
          className={`text-base underline ${lockScreen ? "text-white/80" : ""}`}
        >
          {mode === "reset" ? "Back to sign in" : "Forgot password?"}
        </Button>
      )}
      <Button
        disabled={busy}
        onClick={() =>
          perform(async () => {
            if (guest) {
              await linkWithPopup(guest, new GoogleAuthProvider());
              onLinked?.();
            } else
              await signInWithPopup(
                getFirebase().auth,
                new GoogleAuthProvider(),
              );
          })
        }
        className={
          lockScreen
            ? "w-full rounded-xl border border-white/35 bg-black/20 p-3 text-white backdrop-blur-md hover:bg-black/30"
            : "w-full border border-wheel-sand rounded-lg p-3"
        }
      >
        {guest ? "Link Google & keep workspace" : "Continue with Google"}
      </Button>
      {!guest && (
        <Button
          disabled={busy}
          onClick={() => perform(() => signInAnonymously(getFirebase().auth))}
          className={`w-full text-sm ${lockScreen ? "text-white/80" : "text-wheel-slate"}`}
        >
          Continue as guest
        </Button>
      )}
      {error && (
        <p role='alert' className='text-sm text-wheel-terracotta'>
          {error}
        </p>
      )}
      {notice && (
        <p role='status' className='text-sm text-wheel-sage'>
          {notice}
        </p>
      )}
    </div>
  );
}
