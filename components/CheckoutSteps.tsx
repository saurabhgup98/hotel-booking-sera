const STEPS = ["Select room", "Review", "Payment"];

export default function CheckoutSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="flex items-center gap-2 text-sm sm:gap-3" aria-label="Booking progress">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <li key={label} className="flex items-center gap-2 sm:gap-3">
            <span
              aria-current={active ? "step" : undefined}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                done ? "bg-sera-forest text-white" : active ? "border-2 border-sera-forest text-sera-forest" : "border-2 border-sera-line text-[#A8A194]"
              }`}
            >
              {done ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : (
                step
              )}
            </span>
            <span className={`font-semibold ${active || done ? "text-sera-ink" : "text-[#A8A194]"}`}>{label}</span>
            {step < STEPS.length && <span className="h-px w-6 bg-sera-line sm:w-12" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
