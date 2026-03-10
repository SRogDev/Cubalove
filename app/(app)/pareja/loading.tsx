export default function ParejaLoading() {
    return (
        <div className="min-h-full pb-24">
            {/* Header skeleton */}
            <div className="flex items-center justify-between px-4 py-3">
                <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                <div className="h-6 w-32 rounded bg-muted animate-pulse" />
                <div className="w-9" />
            </div>

            {/* Partner header skeleton */}
            <div className="flex flex-col items-center px-4 mt-4">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-14 w-14 rounded-full bg-muted animate-pulse" />
                    <div className="space-y-2">
                        <div className="h-5 w-24 rounded bg-muted animate-pulse" />
                        <div className="h-3 w-28 rounded bg-muted animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Daily challenge skeleton */}
            <div className="px-4 mb-6">
                <div className="h-28 rounded-2xl bg-muted animate-pulse" />
            </div>

            {/* Vault skeleton */}
            <div className="px-4 mb-6">
                <div className="h-48 rounded-2xl bg-muted animate-pulse" />
            </div>

            {/* Diary button skeleton */}
            <div className="px-4">
                <div className="h-16 rounded-2xl bg-muted animate-pulse" />
            </div>
        </div>
    );
}
