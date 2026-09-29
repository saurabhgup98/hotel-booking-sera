export default function SeraLogo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full font-display text-xl font-semibold ${
          inverted ? "bg-sera-sand text-sera-forest-dark" : "bg-sera-forest text-sera-sand"
        }`}
      >
        S
      </span>
      <span className="flex flex-col leading-none">
        <span className={`font-display text-2xl font-semibold ${inverted ? "text-white" : "text-sera-ink"}`}>Sera</span>
        <span
          className={`mt-1 text-[9px] font-semibold tracking-[0.24em] sm:text-[10px] ${
            inverted ? "text-sera-sand/75" : "text-sera-brass"
          }`}
        >
          HOTELS AND RESORTS
        </span>
      </span>
    </span>
  );
}
