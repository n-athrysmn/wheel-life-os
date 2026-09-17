import { useEffect, useRef, type ReactNode } from "react";
import { useWheel } from "./wheel-provider";
export function Modal({
  open,
  onClose,
  title,
  children,
  size = "default",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "default" | "wide";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { actionLoading } = useWheel();
  useEffect(() => {
    const dialog = ref.current;
    if (open) {
      dialog?.showModal();
    } else {
      dialog?.close();
    }
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  useEffect(() => {
    if (!actionLoading) return;
    const buttons = Array.from(
      ref.current?.querySelectorAll<HTMLButtonElement>(
        'button[type="submit"]',
      ) ?? [],
    );
    const previousStates = buttons.map((button) => button.disabled);
    buttons.forEach((button) => {
      button.disabled = true;
    });
    return () =>
      buttons.forEach((button, index) => {
        button.disabled = previousStates[index];
      });
  }, [actionLoading]);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      aria-busy={Boolean(actionLoading)}
      data-saving={actionLoading ? "true" : "false"}
      onSubmitCapture={(event) => {
        if (actionLoading) event.preventDefault();
      }}
      onCancel={(event) => {
        if (actionLoading) event.preventDefault();
        else onClose();
      }}
      onClose={onClose}
      onClick={(event) => {
        if (!actionLoading && event.target === event.currentTarget) onClose();
      }}
      className={`fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl bg-transparent p-0 [&[data-saving=true]_button[type=submit]]:cursor-wait [&[data-saving=true]_button[type=submit]]:opacity-60 ${size === "wide" ? "max-w-5xl" : "max-w-xl"}`}
    >
      {children}
      {actionLoading && (
        <div
          className='absolute inset-0 z-100 grid min-h-full place-items-center rounded-2xl bg-wheel-navy/45 p-6 backdrop-blur-sm'
          role='status'
          aria-live='polite'
        >
          <div className='min-w-72 rounded-2xl border border-wheel-gold/50 bg-wheel-parchmentLight p-7 text-center shadow-card-lift'>
            <span className='mx-auto block h-9 w-9 animate-spin rounded-full border-2 border-wheel-sand border-t-wheel-gold' />
            <p className='mt-4 font-serif text-xl font-bold text-wheel-ink'>
              {actionLoading}
            </p>
            <p className='mt-1 text-base text-wheel-slate'>
              Please keep this window open.
            </p>
          </div>
        </div>
      )}
    </dialog>
  );
}
