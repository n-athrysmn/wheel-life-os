import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
export function Button({
  type = "button",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`transition-colors disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
export function Badge(props: HTMLAttributes<HTMLSpanElement>) {
  return <span {...props} />;
}
export function Card(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} />;
}
export function ProgressBar({
  value,
  className = "bg-wheel-terracotta h-full rounded-full",
}: {
  value: number;
  className?: string;
}) {
  return (
    <div
      role='progressbar'
      aria-label='Quest progress'
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      className={className}
      style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
    />
  );
}
export function ScreenFrame({
  path,
  title,
  children,
}: {
  path: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className='min-w-0 bg-wheel-parchmentLight border border-wheel-border/80 rounded-2xl shadow-card-lift overflow-hidden flex flex-col'
    >
      <div className='bg-wheel-parchment border-b border-wheel-border px-4 py-2.5 flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <span aria-hidden='true' className='flex gap-2'>
            <i className='w-3 h-3 rounded-full bg-[#E06A53]' />
            <i className='w-3 h-3 rounded-full bg-[#E6B343]' />
            <i className='w-3 h-3 rounded-full bg-[#58A55C]' />
          </span>
          <span className='ml-2 text-base font-mono text-wheel-slate/80'>
            {path}
          </span>
        </div>
        <span className='text-base font-serif italic text-wheel-slate'>
          {title}
        </span>
      </div>
      {children}
    </section>
  );
}
