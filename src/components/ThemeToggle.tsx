import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Theme = "auto" | "light" | "dark";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isDark =
    theme === "dark" ||
    (theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", isDark);
  root.setAttribute("data-theme-pref", theme);
  if (theme === "auto") localStorage.removeItem("theme");
  else localStorage.setItem("theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("auto");

  useEffect(() => {
    const stored = (localStorage.getItem("theme") as Theme | null) ?? "auto";
    setTheme(stored);
    applyTheme(stored);

    if (stored === "auto") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => applyTheme("auto");
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }
  }, []);

  const pick = (next: Theme) => {
    setTheme(next);
    applyTheme(next);
  };

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Toggle theme">
            <Icon />
          </Button>
        }
      />
      <DropdownMenuContent align="end" sideOffset={6}>
        <DropdownMenuItem onClick={() => pick("auto")}>
          <Monitor data-icon="inline-start" />
          System
          {theme === "auto" ? <span className="ml-auto text-xs opacity-60">✓</span> : null}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => pick("light")}>
          <Sun data-icon="inline-start" />
          Light
          {theme === "light" ? <span className="ml-auto text-xs opacity-60">✓</span> : null}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => pick("dark")}>
          <Moon data-icon="inline-start" />
          Dark
          {theme === "dark" ? <span className="ml-auto text-xs opacity-60">✓</span> : null}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
