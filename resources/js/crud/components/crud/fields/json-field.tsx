import { lazy, Suspense, useState } from "react";
import { Moon, Sun } from "lucide-react";
import type { JsonData, Theme } from "json-edit-react";

type JsonStructureEditorProps = {
  data: JsonData;
  dark: boolean;
  readOnly?: boolean;
  onUpdate: (data: JsonData) => void;
};

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
      readOnly,
      onUpdate,
    }: JsonStructureEditorProps) {
      return (
        <JsonEditor
          data={data}
          rootName=""
          collapse={false}
          showArrayIndices={false}
          showCollectionCount="when-closed"
          indent={2}
          minWidth="100%"
          viewOnly={readOnly}
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
  // Enough for both CrudField (form) and CrudColumn (table cell) — only the
  // name is used, as the accessible container id.
  field: { name: string };
  value: unknown;
  readOnly?: boolean;
  onChange?: (next: string) => void;
};

function parseJson(value: unknown): { data: JsonData; text: string } {
  if (value === null || value === undefined || value === "") {
    value = {};
  }

  if (typeof value === "string") {
    try {
      const data = JSON.parse(value) as JsonData;
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

export function JsonField({
  error,
  field,
  value,
  readOnly,
  onChange,
}: JsonFieldProps) {
  const parsed = parseJson(value);
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
            readOnly={readOnly}
            onUpdate={(newData) => onChange?.(JSON.stringify(newData))}
          />
        </Suspense>
      </div>
    </div>
  );
}
