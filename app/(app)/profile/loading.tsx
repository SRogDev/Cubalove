export default function ProfileLoading() {
    return (
        <div className="min-h-full pb-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between px-4 py-3">
                <div className="h-6 w-24 rounded bg-muted animate-pulse" />
                <div className="flex gap-1">
                    <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                    <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                </div>
            </div>

            {/* Avatar + name skeleton */}
            <div className="flex flex-col items-center px-6 pb-6">
                <div className="h-28 w-28 rounded-full bg-muted animate-pulse mb-4" />
                <div className="h-7 w-40 rounded bg-muted animate-pulse mb-2" />
                <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            </div>

            {/* Photos grid skeleton */}
            <div className="px-4 mb-6">
                <div className="h-4 w-16 rounded bg-muted animate-pulse mb-3" />
                <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="aspect-[2/3] rounded-xl bg-muted animate-pulse"
                        />
                    ))}
                </div>
            </div>

            {/* Bio skeleton */}
            <div className="px-4 mb-6">
                <div className="h-4 w-20 rounded bg-muted animate-pulse mb-2" />
                <div className="h-20 rounded-2xl bg-muted animate-pulse" />
            </div>

            {/* Interests skeleton */}
            <div className="px-4 mb-6">
                <div className="h-4 w-20 rounded bg-muted animate-pulse mb-3" />
                <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-8 rounded-full bg-muted animate-pulse"
                            style={{ width: 60 + Math.random() * 40 }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
