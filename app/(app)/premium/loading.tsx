export default function PremiumLoading() {
    return (
        <div className="min-h-full pb-6">
            {/* Header skeleton */}
            <div className="px-4 py-3">
                <div className="h-6 w-36 rounded bg-muted animate-pulse" />
                <div className="h-4 w-56 rounded bg-muted animate-pulse mt-1.5" />
            </div>

            {/* Plan cards skeleton */}
            <div className="px-4 space-y-4 mt-2">
                {Array.from({ length: 2 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-2xl border-2 border-border/50 p-5 space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
                                <div className="h-5 w-20 rounded bg-muted animate-pulse" />
                            </div>
                            <div className="text-right space-y-1">
                                <div className="h-8 w-12 rounded bg-muted animate-pulse" />
                                <div className="h-3 w-8 rounded bg-muted animate-pulse" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            {Array.from({ length: 4 }).map((_, j) => (
                                <div key={j} className="h-4 w-48 rounded bg-muted animate-pulse" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Info note skeleton */}
            <div className="px-4 mt-6">
                <div className="h-16 rounded-2xl bg-muted animate-pulse" />
            </div>
        </div>
    );
}
