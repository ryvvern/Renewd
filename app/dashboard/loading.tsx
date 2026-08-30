function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-full bg-white/10 ${className ?? ""}`}
    />
  );
}

const rowWidths = ["w-56", "w-44", "w-64", "w-48"];

export default function DashboardLoading() {
  return (
    <div className="dark min-h-svh bg-background py-8 text-foreground">
      <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-6 sm:px-8">
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-lg font-semibold tracking-tight">
              Renewd
            </span>
          </div>
          <SkeletonBlock className="h-8 w-24" />
        </header>

        <div className="flex gap-2">
          <SkeletonBlock className="h-7 w-16" />
          <SkeletonBlock className="h-7 w-24" />
        </div>

        <ul className="flex flex-col gap-0">
          {rowWidths.map((width, index) => (
            <li
              key={index}
              className="flex items-center justify-between gap-6 border-b border-white/10 py-3"
            >
              <SkeletonBlock className={`h-4 ${width}`} />
              <div className="flex items-center gap-6">
                <SkeletonBlock className="h-4 w-12" />
                <SkeletonBlock className="hidden h-4 w-14 sm:block" />
                <SkeletonBlock className="hidden h-4 w-10 sm:block" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
