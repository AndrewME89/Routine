import { useState } from "react";
import { useAppData } from "./lib/useAppData";
import TodayPage from "./pages/TodayPage";
import SettingsPage from "./pages/SettingsPage";
import TasksPage from "./pages/TasksPage";
import ComingSoonPage from "./pages/ComingSoonPage";

const NAV_ITEMS: { id: string; label: string; icon: string; ready: boolean }[] = [
  { id: "today", label: "Today", icon: "◫", ready: true },
  { id: "tasks", label: "Tasks", icon: "✓", ready: true },
  { id: "routines", label: "Routines", icon: "◷", ready: false },
  { id: "hr", label: "HR Study", icon: "▤", ready: false },
  { id: "meals", label: "Meals", icon: "♨", ready: false },
  { id: "chores", label: "Chores", icon: "⌂", ready: false },
  { id: "escrima", label: "Escrima", icon: "⚔", ready: false },
  { id: "money", label: "Money", icon: "$", ready: false },
  { id: "health", label: "Health", icon: "♡", ready: false },
  { id: "life-admin", label: "Life Admin", icon: "▣", ready: false },
  { id: "weekly-reset", label: "Weekly Reset", icon: "↻", ready: false },
  { id: "activity", label: "Activity", icon: "↶", ready: false },
  { id: "projects", label: "Projects", icon: "◇", ready: false },
  { id: "settings", label: "Settings", icon: "⚙", ready: true },
];

export default function App() {
  const [page, setPage] = useState("today");
  const data = useAppData();

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-border bg-surface flex flex-col">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          <div className="h-9 w-9 rounded-xl bg-accent/20 text-accent-bright grid place-items-center font-mono font-bold">
            NO
          </div>
          <div>
            <div className="font-semibold leading-tight">Nightshift OS</div>
            <div className="text-xs text-muted font-mono">
              {data.settings ? `${data.settings.wakeTime} → ${data.settings.sleepTime}` : "…"}
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                page === item.id
                  ? "bg-accent/15 text-ink border-r-2 border-accent"
                  : "text-muted hover:text-ink hover:bg-white/5"
              }`}
            >
              <span className="w-4 text-center">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {!item.ready && <span className="text-[10px] text-faint">soon</span>}
            </button>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-border text-xs text-muted flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-good" />
          Private · runs in this browser only
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        {page === "today" && <TodayPage data={data} />}
        {page === "tasks" && <TasksPage />}
        {page === "settings" && <SettingsPage data={data} />}
        {page !== "today" && page !== "tasks" && page !== "settings" && (
          <ComingSoonPage label={NAV_ITEMS.find((n) => n.id === page)?.label ?? ""} />
        )}
      </main>
    </div>
  );
}
