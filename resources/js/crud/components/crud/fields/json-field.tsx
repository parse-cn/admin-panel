import { lazy, Suspense, useState } from "react";
import { Braces, ListTree, Moon, Sun } from "lucide-react";
import type { JsonData, Theme } from "json-edit-react";
import type { CrudField } from "../types";

type JsonStructureEditorProps = {
  data: JsonData;
  dark: boolean;
  onUpdate: (data: JsonData) => void;
};

// Match the global form font size; everything else stays the library's own.
function withFormFontSize(base: Theme): Theme {
  const container =
    typeof base.styles?.container === "object" && base.styles.container !== null
      ? base.styles.container
      : {};

  return {
    ...base,
    styles: {
      ...base.styles,
      container: { ...container, fontSize: "0.875rem" },
    },
  };
}

// The whole editor (component + preset themes) is loaded lazily so the
// source-mode-only users never pull the dependency.
const JsonStructureEditor = lazy(async () => {
  const { JsonEditor, githubDarkTheme, githubLightTheme } =
    await import("json-edit-react");

  return {
    default: function JsonStructureEditor({
      data,
      dark,
      onUpdate,
    }: JsonStructureEditorProps) {
      return (
        <JsonEditor
          data={data}
          // Falsy string keeps the prop defined so the library's own
          // default label ("data"/"root") is not rendered.
          rootName=""
          collapse={false}
          showArrayIndices={false}
          indent={2}
          minWidth="100%"
          theme={withFormFontSize(dark ? githubDarkTheme : githubLightTheme)}
          onUpdate={({ newData }) => onUpdate(newData as JsonData)}
        />
      );
    },
  };
});

type JsonFieldProps = {
  error?: string;
  field: CrudField;
  value: unknown;
  onChange: (next: string) => void;
};

type EditorMode = "structure" | "source";

/**
 * Accepts the raw form value (a JSON string or an already-decoded object
 * coming from the record) and reports changes back as a serialized JSON
 * string, keeping `CrudFormData` string-shaped.
 */
function parseJson(value: unknown): { data: JsonData; text: string } | null {
  // Empty values behave as an empty object rather than null, so the tree
  // editor opens on a usable `{}` instead of falling back to source mode.
  if (value === null || value === undefined || value === "") {
    value = {};
  }

  if (typeof value === "string") {
    try {
      return { data: JSON.parse(value) as JsonData, text: value };
    } catch {
      return null;
    }
  }

  if (value !== null && typeof value === "object") {
    return { data: value as JsonData, text: JSON.stringify(value) };
  }

  return null;
}

export function JsonField({ error, field, value, onChange }: JsonFieldProps) {
  const parsed = parseJson(value);
  // Empty or unparsable values start in source mode — the tree editor is
  // poor at creating content from scratch. Mode is otherwise user-driven
  // and never flips on its own while typing.
  const [mode, setMode] = useState<EditorMode>(() =>
    parseJson(value) === null ? "source" : "structure",
  );
  // Follow the app's color scheme by default; the toolbar button overrides.
  const [dark, setDark] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"),
  );
  const [invalidText, setInvalidText] = useState<string | null>(null);
  const invalid = parsed === null || invalidText !== null;
  const sourceMode = mode === "source" || invalid;

  const toggleClassName =
    "rounded-sm bg-background/80 p-1 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 aria-pressed:bg-accent aria-pressed:text-foreground";

  const toolbar = (
    <div className="absolute right-2 top-2 z-10 flex items-center gap-0.5">
      <button
        type="button"
        aria-label={sourceMode ? "Structure editor" : "Source editor"}
        disabled={invalid}
        title={sourceMode ? "Structure editor" : "Source editor"}
        onClick={() => setMode(sourceMode ? "structure" : "source")}
        className={toggleClassName}
      >
        {sourceMode ? (
          <ListTree className="size-3.5" />
        ) : (
          <Braces className="size-3.5" />
        )}
      </button>
      <button
        type="button"
        aria-label={dark ? "Light theme" : "Dark theme"}
        aria-pressed={dark}
        title={dark ? "Light theme" : "Dark theme"}
        onClick={() => setDark((previous) => !previous)}
        className={toggleClassName}
      >
        {dark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
      </button>
    </div>
  );

  return (
    <div
      className="relative max-h-96 overflow-hidden rounded-md border border-input"
      data-error={Boolean(error)}
    >
      {toolbar}

      {sourceMode ? (
        <textarea
          id={`crud-${field.name}`}
          rows={6}
          spellCheck={false}
          placeholder={"{\n  …\n}"}
          className="max-h-96 w-full resize-y bg-transparent px-3 py-2 font-mono text-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground aria-invalid:border-destructive"
          aria-invalid={Boolean(error) || invalid}
          value={invalidText ?? parsed?.text ?? String(value ?? "")}
          onChange={(event) => {
            const next = event.target.value;

            try {
              const data = JSON.parse(next) as JsonData;
              setInvalidText(null);
              onChange(JSON.stringify(data));
            } catch {
              setInvalidText(next);
            }
          }}
        />
      ) : (
        <div className="max-h-96 overflow-y-auto">
          <Suspense
            fallback={
              <div className="animate-pulse p-4 font-mono text-sm text-muted-foreground">
                {parsed.text}
              </div>
            }
          >
            <JsonStructureEditor
              key={dark ? "dark" : "light"}
              data={parsed.data}
              dark={dark}
              onUpdate={(newData) => {
                setInvalidText(null);
                onChange(JSON.stringify(newData));
              }}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
