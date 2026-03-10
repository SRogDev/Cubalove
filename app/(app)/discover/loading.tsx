export default function DiscoverLoading() {
    return (
        <div className="h-[calc(100svh-var(--top-bar-height)-var(--bottom-nav-height))] flex flex-col items-center justify-center px-4">
            {/* Card skeleton */}
            <div className="w-full max-w-sm aspect-[3/4] rounded-3xl bg-muted animate-pulse" />
            {/* Action buttons skeleton */}
            <div className="flex items-center gap-4 mt-6">
                {[44, 56, 56, 44].map((size, i) => (
                    <div
                        key={i}
                        className="rounded-full bg-muted animate-pulse"
                        style={{ width: size, height: size }}
                    />
                ))}
            </div>
        </div>
    );
}
