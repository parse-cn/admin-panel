import { lazy, Suspense, useState } from "react";
import { Moon, Sun } from "lucide-react";
import type { JsonData, Theme } from "json-edit-react";
import type { CrudField } from "../types";

type JsonStructureEditorProps = {
  data: JsonData;
  dark: boolean;
  onUpdate: (data: JsonData) => void;
};

// The github presets don't define editor input styles, so the whole-node
// text edit state falls back to raw browser defaults — style it here.
function withFormFontSize(base: Theme, dark: boolean): Theme {
  const container =
    typeof base.styles?.container === "object" && base.styles.container !== null
      ? base.styles.container
      : {};

  const border = dark ? "#30363d" : "#d0d7de";

  return {
    ...base,
    styles: {
      ...base.styles,
      container: { ...container, fontSize: "0.875rem" },
      input: {
        backgroundColor: dark ? "#0d1117" : "#ffffff",
        color: dark ? "#e6edf3" : "#24292f",
        border: `1px solid ${border}`,
        borderRadius: 6,
        padding: "2px 4px",
        fontFamily: "inherit",
        fontSize: "inherit",
        outline: "none",
        // The textarea is sized by a hidden mirror span; plain `width`
        // loses to that, so pin both.
        width: "100%",
        minWidth: "100%",
        maxWidth: "100%",
        resize: "vertical",
      },
      inputHighlight: { backgroundColor: "rgba(46, 160, 67, 0.15)" },
    },
  };
}

// The whole editor (component + preset themes) is loaded lazily.
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
          showCollectionCount='when-closed'
          indent={2}
          minWidth="100%"
          theme={withFormFontSize(
            dark ? githubDarkTheme : githubLightTheme,
            dark,
          )}
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

/**
 * Accepts the raw form value (a JSON string or an already-decoded object
 * coming from the record) and reports changes back as a serialized JSON
 * string, keeping `CrudFormData` string-shaped. Empty or unparsable values
 * behave as an empty object — the tree editor guarantees valid output.
 */
function parseJson(value: unknown): { data: JsonData; text: string } {
  if (value === null || value === undefined || value === "") {
    value = {};
  }

  if (typeof value === "string") {
    try {
      const data = JSON.parse(value) as JsonData;
      // A literal "null" string parses fine but must still render as `{}`.
      return { data: data ?? {}, text: data === null ? "{}" : value };
    } catch {
      return { data: {}, text: "{}" };
    }
  }

  if (typeof value === "object") {
    return { data: value as JsonData, text: JSON.stringify(value) };
  }

  return { data: {}, text: "{}" };
}

export function JsonField({ error, field, value, onChange }: JsonFieldProps) {
  const parsed = parseJson(value);
  // Follow the app's color scheme by default; the toolbar button overrides.
  const [dark, setDark] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"),
  );

  const toggleClassName =
    "rounded-sm bg-background/80 p-1 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:bg-accent aria-pressed:text-foreground";

  return (
    <div
      id={`crud-${field.name}`}
      className="relative max-h-96 overflow-hidden rounded-md border border-input"
      data-error={Boolean(error)}
    >
      <div className="absolute right-2 top-2 z-10 flex items-center gap-0.5">
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
            onUpdate={(newData) => onChange(JSON.stringify(newData))}
          />
        </Suspense>
      </div>
    </div>
  );
}
