import { useEffect, useState } from "react";
import { BookOpen, LogOut, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";

type Theme = "white" | "sepia" | "gray" | "black";
type Font =
  | "serif"
  | "sans"
  | "charter"
  | "georgia"
  | "iowan"
  | "palatino"
  | "times"
  | "newyork";

const FONT_LABELS: Record<Font, string> = {
  serif: "System Serif",
  sans: "System Sans",
  charter: "Charter",
  georgia: "Georgia",
  iowan: "Iowan Old Style",
  palatino: "Palatino",
  times: "Times New Roman",
  newyork: "New York",
};

const SIZES = ["1", "2", "3", "4", "5"] as const;
type SizeStr = (typeof SIZES)[number];

function set(attr: string, value: string | null) {
  const root = document.documentElement;
  if (value === null) root.removeAttribute(attr);
  else root.setAttribute(attr, value);
}

function withAnimation(mutate: () => void) {
  if (typeof document !== "undefined" && (document as any).startViewTransition) {
    (document as any).startViewTransition(mutate);
  } else {
    mutate();
  }
}

export function ReaderControls() {
  const [on, setOn] = useState(false);
  const [theme, setTheme] = useState<Theme>("white");
  const [size, setSize] = useState<SizeStr>("3");
  const [font, setFont] = useState<Font>("serif");

  useEffect(() => {
    const storedTheme = (localStorage.getItem("reader-theme") as Theme) || "white";
    const storedSize = (localStorage.getItem("reader-size") as SizeStr) || "3";
    const storedFont = (localStorage.getItem("reader-font") as Font) || "serif";
    const storedOn = sessionStorage.getItem("reader") === "1";

    set("data-reader-theme", storedTheme);
    set("data-reader-size", storedSize);
    set("data-reader-font", storedFont);
    if (storedOn) set("data-reader", "");

    setTheme(storedTheme);
    setSize(storedSize);
    setFont(storedFont);
    setOn(storedOn);
  }, []);

  // Keyboard shortcut: 'r' toggles reader (when not typing in a field)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "r" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (
        t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.tagName === "SELECT" ||
        t.isContentEditable
      )
        return;
      toggleReader();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);

  const toggleReader = () => {
    withAnimation(() => {
      const next = !on;
      setOn(next);
      if (next) {
        set("data-reader", "");
        sessionStorage.setItem("reader", "1");
      } else {
        set("data-reader", null);
        sessionStorage.removeItem("reader");
      }
    });
  };

  const pickTheme = (v: Theme | "") => {
    if (!v) return;
    withAnimation(() => {
      setTheme(v);
      set("data-reader-theme", v);
      localStorage.setItem("reader-theme", v);
    });
  };

  const pickSize = (v: SizeStr | "") => {
    if (!v) return;
    withAnimation(() => {
      setSize(v);
      set("data-reader-size", v);
      localStorage.setItem("reader-size", v);
    });
  };

  const pickFont = (v: Font) => {
    withAnimation(() => {
      setFont(v);
      set("data-reader-font", v);
      localStorage.setItem("reader-font", v);
    });
  };

  // OFF state: show the entry button inline in the article head.
  if (!on) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={toggleReader}
        aria-label="Enter reader mode"
        title="Reader mode (R)"
      >
        <BookOpen data-icon="inline-start" />
        Reader
      </Button>
    );
  }

  // ON state: render a single FAB at the bottom-right of the viewport.
  // Click opens a popover (up + leftward) with all settings.
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="default"
            size="icon-lg"
            aria-label="Reader settings"
            title="Reader settings"
            className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg size-12"
          >
            <Settings2 />
          </Button>
        }
      />
      <PopoverContent
        side="top"
        align="end"
        sideOffset={10}
        className="w-72 p-3"
      >
        <div className="flex flex-col gap-3">
          <ToggleGroup
            value={[size]}
            onValueChange={(v) => pickSize((v as string[])[0] as SizeStr | "")}
            aria-label="Font size"
            className="w-full"
          >
            <ToggleGroupItem value="1" aria-label="Smallest" className="flex-1">
              <span className="font-serif text-[0.7rem]">A</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="2" aria-label="Small" className="flex-1">
              <span className="font-serif text-[0.85rem]">A</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="3" aria-label="Medium" className="flex-1">
              <span className="font-serif text-[1rem]">A</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="4" aria-label="Large" className="flex-1">
              <span className="font-serif text-[1.2rem]">A</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="5" aria-label="Largest" className="flex-1">
              <span className="font-serif text-[1.4rem]">A</span>
            </ToggleGroupItem>
          </ToggleGroup>

          <Separator />

          <ToggleGroup
            value={[theme]}
            onValueChange={(v) => pickTheme((v as string[])[0] as Theme | "")}
            aria-label="Background"
            className="w-full"
          >
            <ToggleGroupItem
              value="white"
              aria-label="White"
              className="flex-1 h-9 bg-white border border-black/10 data-[state=on]:ring-2 data-[state=on]:ring-ring data-[state=on]:ring-offset-1"
            />
            <ToggleGroupItem
              value="sepia"
              aria-label="Sepia"
              className="flex-1 h-9 bg-[#f5ecd9] border border-black/10 data-[state=on]:ring-2 data-[state=on]:ring-ring data-[state=on]:ring-offset-1"
            />
            <ToggleGroupItem
              value="gray"
              aria-label="Gray"
              className="flex-1 h-9 bg-[#4a4a4a] border border-white/15 data-[state=on]:ring-2 data-[state=on]:ring-ring data-[state=on]:ring-offset-1"
            />
            <ToggleGroupItem
              value="black"
              aria-label="Black"
              className="flex-1 h-9 bg-[#181818] border border-white/15 data-[state=on]:ring-2 data-[state=on]:ring-ring data-[state=on]:ring-offset-1"
            />
          </ToggleGroup>

          <Separator />

          <div className="flex items-center gap-2">
            <label htmlFor="reader-font" className="text-xs text-muted-foreground">
              Font
            </label>
            <Select value={font} onValueChange={(v) => pickFont(v as Font)}>
              <SelectTrigger id="reader-font" className="flex-1">
                <SelectValue>{FONT_LABELS[font]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {(Object.entries(FONT_LABELS) as [Font, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleReader}
            className="w-full justify-start"
          >
            <LogOut data-icon="inline-start" />
            Exit reader mode
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
