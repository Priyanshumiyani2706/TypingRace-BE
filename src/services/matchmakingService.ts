/**
 * ELO-based matchmaking service
 * Manages a queue and matches players within an ELO range
 */

interface QueueEntry {
  userId: string;
  username: string;
  socketId: string;
  xp: number;
  joinedAt: number;
}

const ELO_RANGE_INITIAL = Infinity; // always match any two players – 1v1 duel
const ELO_RANGE_EXPAND = 100;      // unused when Infinity, kept for future
const MAX_WAIT_MS = 60_000;        // after 60s, match anyone

class MatchmakingService {
  private queue: Map<string, QueueEntry> = new Map();

  enqueue(entry: QueueEntry) {
    this.queue.set(entry.userId, entry);
  }

  dequeue(userId: string) {
    this.queue.delete(userId);
  }

  isQueued(userId: string): boolean {
    return this.queue.has(userId);
  }

  queueSize(): number {
    return this.queue.size;
  }

  /**
   * Find the best opponent for a given user.
   * Expands ELO range over time to avoid infinite waits.
   */
  findOpponent(userId: string): QueueEntry | null {
    const seeker = this.queue.get(userId);
    if (!seeker) return null;

    const waitMs = Date.now() - seeker.joinedAt;
    const expansions = Math.floor(waitMs / 10_000);
    const range = waitMs >= MAX_WAIT_MS
      ? Infinity
      : ELO_RANGE_INITIAL + expansions * ELO_RANGE_EXPAND;

    let best: QueueEntry | null = null;
    let bestDiff = Infinity;

    for (const [uid, entry] of this.queue) {
      if (uid === userId) continue;
      const diff = Math.abs(entry.xp - seeker.xp);
      if (diff <= range && diff < bestDiff) {
        best = entry;
        bestDiff = diff;
      }
    }

    return best;
  }

  /**
   * Remove stale entries (disconnected players)
   */
  cleanup(activeSocketIds: Set<string>) {
    for (const [userId, entry] of this.queue) {
      if (!activeSocketIds.has(entry.socketId)) {
        this.queue.delete(userId);
      }
    }
  }
}

export const matchmakingService = new MatchmakingService();
