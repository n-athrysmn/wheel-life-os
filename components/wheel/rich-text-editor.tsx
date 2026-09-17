import { useEffect, useRef, useState } from "react";
import { Button } from "./ui";

type EditorProps = { value: string; onChange: (value: string) => void };
type ToolProps = {
  label: string;
  children: React.ReactNode;
  active?: boolean;
  className?: string;
  onMouseDown: React.MouseEventHandler<HTMLButtonElement>;
};
type Format =
  | "bold"
  | "italic"
  | "underline"
  | "strikeThrough"
  | "insertUnorderedList"
  | "insertOrderedList"
  | "blockquote"
  | "pre"
  | "link";

function Tooltip({ label }: { label: string }) {
  return (
    <span
      role='tooltip'
      className='pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-wheel-midnight px-2.5 py-1.5 text-base font-medium text-wheel-cream opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100'
    >
      {label}
    </span>
  );
}

function Tool({
  label,
  children,
  active = false,
  className = "",
  onMouseDown,
}: ToolProps) {
  return (
    <span className='group relative inline-flex'>
      <Button
        type='button'
        aria-label={label}
        aria-pressed={active}
        onMouseDown={onMouseDown}
        className={`min-w-9 rounded-md border px-2 py-1.5 text-sm font-semibold transition-colors ${active ? "border-wheel-gold bg-wheel-gold/20 text-wheel-ink shadow-sm" : "border-transparent text-wheel-slate hover:bg-wheel-parchment focus:bg-wheel-parchment"} ${className}`}
      >
        {children}
      </Button>
      <Tooltip label={`${label}${active ? " (on)" : ""}`} />
    </span>
  );
}

export function RichTextEditor({ value, onChange }: EditorProps) {
  const editor = useRef<HTMLDivElement>(null);
  const selection = useRef<Range | null>(null);
  const [initialValue] = useState(value);
  const [activeFormats, setActiveFormats] = useState<Set<Format>>(new Set());

  function updateActiveFormats() {
    const activeSelection = window.getSelection();
    if (!activeSelection?.rangeCount) return;
    const range = activeSelection.getRangeAt(0);
    if (!editor.current?.contains(range.commonAncestorContainer)) return;

    const next = new Set<Format>();
    (
      [
        "bold",
        "italic",
        "underline",
        "strikeThrough",
        "insertUnorderedList",
        "insertOrderedList",
      ] as Format[]
    ).forEach((format) => {
      if (document.queryCommandState(format)) next.add(format);
    });
    const block = String(document.queryCommandValue("formatBlock"))
      .toLowerCase()
      .replace(/[<>]/g, "");
    if (block === "blockquote") next.add("blockquote");
    if (block === "pre") next.add("pre");
    const node =
      range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (range.commonAncestorContainer as Element)
        : range.commonAncestorContainer.parentElement;
    if (node?.closest("a")) next.add("link");
    setActiveFormats(next);
  }

  useEffect(() => {
    document.addEventListener("selectionchange", updateActiveFormats);
    return () =>
      document.removeEventListener("selectionchange", updateActiveFormats);
  });

  function rememberSelection() {
    const activeSelection = window.getSelection();
    if (!activeSelection?.rangeCount) return;
    const range = activeSelection.getRangeAt(0);
    if (editor.current?.contains(range.commonAncestorContainer)) {
      selection.current = range.cloneRange();
      updateActiveFormats();
    }
  }

  function restoreSelection() {
    editor.current?.focus();
    if (!selection.current) return;
    const activeSelection = window.getSelection();
    activeSelection?.removeAllRanges();
    activeSelection?.addRange(selection.current);
  }

  function command(name: string, argument?: string) {
    restoreSelection();
    document.execCommand(name, false, argument);
    if (name === "createLink") {
      editor.current?.querySelectorAll("a").forEach((link) => {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      });
    }
    rememberSelection();
    onChange(editor.current?.innerHTML ?? "");
    updateActiveFormats();
  }

  return (
    <div className='overflow-visible rounded-xl border border-wheel-border bg-white'>
      <div className='flex flex-wrap items-center gap-1 rounded-t-xl border-b border-wheel-border bg-wheel-parchment/50 p-2'>
        <Tool
          label='Bold'
          active={activeFormats.has("bold")}
          onMouseDown={(event) => {
            event.preventDefault();
            command("bold");
          }}
        >
          B
        </Tool>
        <Tool
          label='Italic'
          active={activeFormats.has("italic")}
          className='italic'
          onMouseDown={(event) => {
            event.preventDefault();
            command("italic");
          }}
        >
          I
        </Tool>
        <Tool
          label='Underline'
          active={activeFormats.has("underline")}
          className='underline'
          onMouseDown={(event) => {
            event.preventDefault();
            command("underline");
          }}
        >
          U
        </Tool>
        <span className='group relative inline-flex'>
          <label
            aria-label='Text color'
            className='inline-flex min-w-9 cursor-pointer items-center justify-center rounded-md px-2 py-1.5 text-sm font-semibold text-wheel-slate hover:bg-wheel-parchment focus-within:bg-wheel-parchment'
            onMouseDown={rememberSelection}
          >
            <span className='border-b-2 border-current'>A</span>
            <input
              type='color'
              className='sr-only'
              onChange={(event) => command("foreColor", event.target.value)}
            />
          </label>
          <Tooltip label='Text color' />
        </span>
        <Tool
          label='Strikethrough'
          active={activeFormats.has("strikeThrough")}
          className='line-through'
          onMouseDown={(event) => {
            event.preventDefault();
            command("strikeThrough");
          }}
        >
          S
        </Tool>
        <Tool
          label='Bulleted list'
          active={activeFormats.has("insertUnorderedList")}
          onMouseDown={(event) => {
            event.preventDefault();
            command("insertUnorderedList");
          }}
        >
          ☷
        </Tool>
        <Tool
          label='Numbered list'
          active={activeFormats.has("insertOrderedList")}
          onMouseDown={(event) => {
            event.preventDefault();
            command("insertOrderedList");
          }}
        >
          1.
        </Tool>
        <Tool
          label='Quote'
          active={activeFormats.has("blockquote")}
          onMouseDown={(event) => {
            event.preventDefault();
            command("formatBlock", "blockquote");
          }}
        >
          ❝
        </Tool>
        <Tool
          label='Link'
          active={activeFormats.has("link")}
          onMouseDown={(event) => {
            event.preventDefault();
            rememberSelection();
            const url = window.prompt("Link URL");
            if (url?.trim()) command("createLink", url.trim());
          }}
        >
          🔗
        </Tool>
        <Tool
          label='Code block'
          active={activeFormats.has("pre")}
          onMouseDown={(event) => {
            event.preventDefault();
            command("formatBlock", "pre");
          }}
        >
          &lt;/&gt;
        </Tool>
        <Tool
          label='Clear formatting'
          onMouseDown={(event) => {
            event.preventDefault();
            command("removeFormat");
          }}
        >
          ✕
        </Tool>
      </div>
      <div
        ref={editor}
        contentEditable
        suppressContentEditableWarning
        onBlur={rememberSelection}
        onKeyUp={rememberSelection}
        onMouseUp={rememberSelection}
        onInput={(event) => {
          rememberSelection();
          onChange(event.currentTarget.innerHTML);
        }}
        dangerouslySetInnerHTML={{ __html: initialValue }}
        className='h-64 overflow-y-auto rounded-b-xl p-4 text-base leading-relaxed text-wheel-ink focus:outline-none [&_a]:font-medium [&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:border-l-2 [&_blockquote]:border-wheel-gold [&_blockquote]:pl-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:rounded [&_pre]:bg-wheel-parchment [&_pre]:p-3 [&_ul]:list-disc [&_ul]:pl-5'
      />
    </div>
  );
}
