import { useState } from "react";
import { useAppData } from "./lib/useAppData";
import TodayPage from "./pages/TodayPage";
import SettingsPage from "./pages/SettingsPage";
import TasksPage from "./pages/TasksPage";
import RoutinesPage from "./pages/RoutinesPage";
import HrStudyPage from "./pages/HrStudyPage";
import AuslanPage from "./pages/AuslanPage";
import EscrimaPage from "./pages/EscrimaPage";
import JapanesePage from "./pages/JapanesePage";
import MealsPage from "./pages/MealsPage";
import MoneyPage from "./pages/MoneyPage";
import ComingSoonPage from "./pages/ComingSoonPage";

interface NavItem {
  id: string;
  label: string;
  icon: string;
  ready: boolean;
}

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "Core",
    items: [
      { id: "today", label: "Today", icon: "◫", ready: true },
      { id: "tasks", label: "Tasks", icon: "✓", ready: true },
      { id: "routines", label: "Routines", icon: "◷", ready: true },
    ],
  },
  {
    label: "Learning",
    items: [
      { id: "hr", label: "HR Study", icon: "▤", ready: true },
      { id: "escrima", label: "Escrima", icon: "⚔", ready: true },
      { id: "japanese", label: "Japanese", icon: "字", ready: true },
      { id: "auslan", label: "Auslan", icon: "✋", ready: true },
    ],
  },
  {
    label: "Life",
    items: [
      { id: "meals", label: "Meals", icon: "♨", ready: true },
      { id: "chores", label: "Chores", icon: "⌂", ready: false },
      { id: "money", label: "Money", icon: "$", ready: true },
      { id: "health", label: "Health", icon: "♡", ready: false },
      { id: "life-admin", label: "Life Admin", icon: "▣", ready: false },
      { id: "weekly-reset", label: "Weekly Reset", icon: "↻", ready: false },
      { id: "activity", label: "Activity", icon: "↶", ready: false },
      { id: "projects", label: "Projects", icon: "◇", ready: false },
    ],
  },
  {
    label: "System",
    items: [{ id: "settings", label: "Settings", icon: "⚙", ready: true }],
  },
];

const NAV_ITEMS = NAV_SECTIONS.flatMap((section) => section.items);

export default function App() {
  const [page, setPage] = useState("today");
  const [navOpen, setNavOpen] = useState(false);
  const data = useAppData();
  const currentPage = NAV_ITEMS.find((item) => item.id === page);

  const navigate = (id: string) => {
    setPage(id);
    setNavOpen(false);
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 pb-4 pt-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-accent/25 bg-accent/10 font-mono text-sm font-bold text-accent-bright shadow-panel">
            NO
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-[-0.01em] text-ink">Nightshift OS</div>
            <div className="mt-0.5 truncate font-mono text-[11px] text-muted">
              {data.settings ? `${data.settings.wakeTime} → ${data.settings.sleepTime}` : "Loading schedule…"}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-4 last:mb-0">
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = page === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.id)}
                    className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      active
                        ? "bg-accent/10 text-ink"
                        : "text-muted hover:bg-white/[0.035] hover:text-ink"
                    }`}
                  >
                    {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-accent" />}
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border text-[12px] transition-colors ${
                        active
                          ? "border-accent/25 bg-accent/10 text-accent-bright"
                          : "border-transparent bg-white/[0.025] text-faint group-hover:text-muted"
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {!item.ready && (
                      <span className="rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-faint">
                        soon
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-4 py-3.5">
        <div className="flex items-center gap-2 text-[11px] text-muted">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-good shadow-[0_0_0_3px_rgba(120,207,145,0.08)]" />
          <span>Private · browser-only data</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-base text-ink md:flex md:h-screen md:overflow-hidden">
      <aside className="hidden w-[248px] shrink-0 border-r border-border bg-side md:block">{sidebar}</aside>

      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-base/95 px-4 backdrop-blur md:hidden">
        <button
          onClick={() => setNavOpen(true)}
          className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-muted hover:text-ink"
          aria-label="Open navigation"
        >
          <span className="text-lg leading-none">☰</span>
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold">{currentPage?.label ?? "Nightshift OS"}</div>
          <div className="font-mono text-[10px] text-faint">Nightshift OS</div>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-lg border border-accent/20 bg-accent/10 font-mono text-[11px] font-bold text-accent-bright">
          NO
        </div>
      </div>

      {navOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setNavOpen(false)}
            aria-label="Close navigation"
          />
          <aside className="absolute inset-y-0 left-0 w-[284px] max-w-[86vw] border-r border-border bg-side shadow-2xl">
            {sidebar}
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1 md:h-screen md:overflow-y-auto">
        {page === "today" && <TodayPage data={data} />}
        {page === "tasks" && <TasksPage />}
        {page === "routines" && <RoutinesPage />}
        {page === "hr" && <HrStudyPage />}
        {page === "auslan" && <AuslanPage />}
        {page === "escrima" && <EscrimaPage />}
        {page === "japanese" && <JapanesePage />}
        {page === "meals" && <MealsPage />}
        {page === "money" && <MoneyPage />}
        {page === "settings" && <SettingsPage data={data} />}
        {page !== "today" &&
          page !== "tasks" &&
          page !== "routines" &&
          page !== "hr" &&
          page !== "auslan" &&
          page !== "escrima" &&
          page !== "japanese" &&
          page !== "meals" &&
          page !== "money" &&
          page !== "settings" && (
            <ComingSoonPage label={currentPage?.label ?? ""} />
          )}
      </main>
    </div>
  );
}