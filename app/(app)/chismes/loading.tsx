export default function ChismesLoading() {
    return (
        <div className="min-h-full pb-6">
            {/* Header skeleton */}
            <div className="px-4 py-3">
                <div className="h-6 w-28 rounded bg-muted animate-pulse" />
                <div className="h-4 w-44 rounded bg-muted animate-pulse mt-1.5" />
            </div>

            {/* Tip banner skeleton */}
            <div className="px-4 mb-4">
                <div className="h-16 rounded-2xl bg-muted animate-pulse" />
            </div>

            {/* Feed skeleton */}
            <div className="px-4 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-border/50 bg-card p-4 space-y-3">
                        <div className="h-4 w-full rounded bg-muted animate-pulse" />
                        <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                        {i % 2 === 1 && (
                            <div className="h-40 rounded-xl bg-muted animate-pulse" />
                        )}
                        <div className="flex items-center gap-4 pt-2">
                            <div className="h-4 w-12 rounded bg-muted animate-pulse" />
                            <div className="h-4 w-12 rounded bg-muted animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
