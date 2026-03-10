export default function AdminLoading() {
    return (
        <div>
            {/* Header skeleton */}
            <div className="mb-6">
                <div className="h-8 w-36 rounded bg-muted animate-pulse" />
                <div className="h-4 w-52 rounded bg-muted animate-pulse mt-2" />
            </div>

            {/* Stats grid skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-2xl border border-border/50 bg-card p-4 md:p-5 space-y-3"
                    >
                        <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
                        <div className="h-8 w-20 rounded bg-muted animate-pulse" />
                        <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                    </div>
                ))}
            </div>

            {/* Activity card skeleton */}
            <div className="mt-6 rounded-2xl border border-border/50 bg-card p-5 space-y-3">
                <div className="h-5 w-36 rounded bg-muted animate-pulse" />
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-muted animate-pulse" />
                        <div className="h-4 w-52 rounded bg-muted animate-pulse" />
                    </div>
                ))}
            </div>
        </div>
    );
}
