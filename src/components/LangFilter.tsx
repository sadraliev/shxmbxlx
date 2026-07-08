import { useEffect, useState } from "react";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type LangPref = "en" | "ru" | "ky";

const OPTIONS: { value: LangPref; label: string }[] = [
  { value: "en", label: "English" },
  { value: "ru", label: "Русский" },
  { value: "ky", label: "Кыргызча" },
];

function readStoredLang(): LangPref {
  const stored = localStorage.getItem("lang-filter");
  return stored === "en" || stored === "ru" || stored === "ky" ? stored : "en";
}

function applyLangFilter(pref: LangPref) {
  document.documentElement.setAttribute("data-lang-filter", pref);
  localStorage.setItem("lang-filter", pref);
}

export function LangFilter() {
  const [pref, setPref] = useState<LangPref>("en");

  useEffect(() => {
    const initial = readStoredLang();
    setPref(initial);
    applyLangFilter(initial);
  }, []);

  const pick = (next: LangPref) => {
    setPref(next);
    applyLangFilter(next);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Filter by language">
            <Languages />
          </Button>
        }
      />
      <DropdownMenuContent align="end" sideOffset={6}>
        {OPTIONS.map(({ value, label }) => (
          <DropdownMenuItem key={value} onClick={() => pick(value)}>
            {label}
            {pref === value ? <span className="ml-auto text-xs opacity-60">✓</span> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
