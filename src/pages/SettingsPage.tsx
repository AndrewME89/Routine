import type { useAppData } from "../lib/useAppData";
import type { RosterDay } from "../lib/types";
import { exportAll } from "../lib/storage";

export default function SettingsPage({ data }: { data: ReturnType<typeof useAppData> }) {
  const { settings, updateSettings, loading } = data;
  if (loading || !settings) return <div className="p-8 text-muted">Loading…</div>;

  const updateRosterDay = (weekday: number, patch: Partial<RosterDay>) => {
    const roster = settings.roster.map((r) => (r.weekday === weekday ? { ...r, ...patch } : r));
    updateSettings({ roster });
  };

  const handleExport = async () => {
    const dump = await exportAll();
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nightshift-os-backup-${dump.exportedAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-1">Settings</h1>
      <p className="text-sm text-muted mb-6">
        Everything here is stored only in this browser's local storage. Nothing is sent to a
        server — clearing your browser data clears this too, so export a backup occasionally.
      </p>

      <section className="bg-surface border border-border rounded-2xl p-5 mb-6">
        <div className="text-xs uppercase tracking-wide text-muted mb-4">Sleep &amp; operational day</div>
        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm">
            <span className="block text-muted mb-1">Wake time</span>
            <input
              type="time"
              value={settings.wakeTime}
              onChange={(e) => updateSettings({ wakeTime: e.target.value })}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 font-mono"
            />
          </label>
          <label className="text-sm">
            <span className="block text-muted mb-1">Sleep time</span>
            <input
              type="time"
              value={settings.sleepTime}
              onChange={(e) => updateSettings({ sleepTime: e.target.value })}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 font-mono"
            />
          </label>
        </div>
        <p className="text-xs text-muted mt-3">
          The operational day runs from wake time through to sleep time the next calendar day.
          Everything on Today is scheduled relative to this, not midnight.
        </p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-5 mb-6">
        <div className="text-xs uppercase tracking-wide text-muted mb-4">Roster</div>
        <div className="space-y-2">
          {settings.roster.map((r) => (
            <div key={r.weekday} className="flex items-center gap-3 flex-wrap">
              <div className="w-24 text-sm">{r.label}</div>
              <button
                onClick={() => updateRosterDay(r.weekday, { isRDO: !r.isRDO })}
                className={`text-xs px-2.5 py-1.5 rounded-lg border ${
                  r.isRDO
                    ? "bg-accent/20 border-accent text-accent-bright"
                    : "border-border text-muted"
                }`}
              >
                {r.isRDO ? "RDO" : "Work"}
              </button>
              {!r.isRDO && (
                <>
                  <input
                    type="time"
                    value={r.startTime}
                    onChange={(e) => updateRosterDay(r.weekday, { startTime: e.target.value })}
                    className="bg-surface-2 border border-border rounded-lg px-2 py-1.5 font-mono text-sm"
                  />
                  <span className="text-muted text-sm">→</span>
                  <input
                    type="time"
                    value={r.endTime}
                    onChange={(e) => updateRosterDay(r.weekday, { endTime: e.target.value })}
                    className="bg-surface-2 border border-border rounded-lg px-2 py-1.5 font-mono text-sm"
                  />
                </>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted mt-3">
          Every day defaults to RDO until you set it here. This is the single source of truth for
          Work Night vs RDO mode and the work block on Today.
        </p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide text-muted mb-3">Backup</div>
        <button
          onClick={handleExport}
          className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-bright transition-colors"
        >
          Export full backup (JSON)
        </button>
      </section>
    </div>
  );
}
