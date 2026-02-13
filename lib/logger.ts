// ---------------------------------------------------------------------------
// Performance Logger — lightweight structured logging for discovery pipeline
// ---------------------------------------------------------------------------

interface LogEntry {
  phase: string;
  duration_ms: number;
  metadata?: Record<string, unknown>;
}

export class PerfLogger {
  private entries: LogEntry[] = [];
  private startTime: number;
  private lastMark: number;
  private readonly requestId: string;
  private readonly userId: string;

  constructor(userId: string) {
    this.startTime = performance.now();
    this.lastMark = this.startTime;
    this.requestId = crypto.randomUUID().slice(0, 8);
    this.userId = userId;
  }

  /** Mark a phase as complete and record its duration */
  mark(phase: string, metadata?: Record<string, unknown>) {
    const now = performance.now();
    this.entries.push({
      phase,
      duration_ms: Math.round((now - this.lastMark) * 100) / 100,
      metadata,
    });
    this.lastMark = now;
  }

  /** Get total elapsed time */
  get totalMs(): number {
    return Math.round((performance.now() - this.startTime) * 100) / 100;
  }

  /** Flush all entries to console as structured JSON */
  flush() {
    const total = this.totalMs;
    const memUsage = process.memoryUsage();

    const log = {
      type: "discovery_perf",
      request_id: this.requestId,
      user_id: this.userId.slice(0, 8) + "...",
      total_ms: total,
      phases: this.entries,
      memory: {
        heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024 * 10) / 10,
        rss_mb: Math.round(memUsage.rss / 1024 / 1024 * 10) / 10,
      },
    };

    console.log(`[PERF] ${JSON.stringify(log)}`);
    return log;
  }
}
