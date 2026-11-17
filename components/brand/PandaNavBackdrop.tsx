/** Plain nav backdrop (the panda art was retired in Nov 2026; SheRides uses its violet & mint logo). */
export function PandaNavBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-b from-[#2a1a52] via-[#1f1440] to-[#160e2e]" />
    </div>
  );
}
