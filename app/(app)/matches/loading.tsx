export default function MatchesLoading() {
    return (
        <div className="min-h-full pb-6">
            {/* Header skeleton */}
            <div className="px-4 py-3">
                <div className="h-6 w-32 rounded bg-muted animate-pulse" />
            </div>

            {/* Tabs skeleton */}
            <div className="px-4 mb-4">
                <div className="h-11 rounded-xl bg-muted animate-pulse" />
            </div>

            {/* New matches row skeleton */}
            <div className="px-4 mb-5">
                <div className="h-4 w-28 rounded bg-muted animate-pulse mb-3" />
                <div className="flex gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
                            <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
                            <div className="h-3 w-12 rounded bg-muted animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Match list skeleton */}
            <div className="px-4 space-y-2">
                <div className="h-4 w-32 rounded bg-muted animate-pulse mb-3" />
                {Array.from({ length: 5 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3"
                    >
                        <div className="h-12 w-12 rounded-full bg-muted animate-pulse shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                            <div className="h-3 w-36 rounded bg-muted animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
