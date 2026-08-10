export default function ComingSoonPage({ label }: { label: string }) {
  return (
    <div className="p-8">
      <div className="max-w-md mt-24 mx-auto text-center">
        <div className="text-xs uppercase tracking-wide text-muted mb-2">Not built yet</div>
        <h1 className="text-xl font-semibold mb-2">{label}</h1>
        <p className="text-sm text-muted">
          This module hasn't been ported from Nightshift OS yet. Today's routine engine and
          Settings are the first working slice — the rest come next, module by module.
        </p>
      </div>
    </div>
  );
}
