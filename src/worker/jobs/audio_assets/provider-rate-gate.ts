/** Límite local por proceso; la cuota/budget global permanece en PostgreSQL. */
export class ProviderRateGate {
  private readonly timestamps: number[] = [];
  private lock: Promise<void> = Promise.resolve();
  constructor(private readonly maxPerSecond: number) {}

  async waitTurn(): Promise<void> {
    let unlock!: () => void;
    const previous = this.lock;
    this.lock = new Promise<void>((resolve) => { unlock = resolve; });
    await previous;
    try {
      while (true) {
        const now = Date.now();
        while (this.timestamps.length > 0 && now - this.timestamps[0] >= 1000) this.timestamps.shift();
        if (this.timestamps.length < this.maxPerSecond) { this.timestamps.push(now); return; }
        await new Promise((resolve) => setTimeout(resolve, Math.max(1, 1000 - (now - this.timestamps[0]))));
      }
    } finally { unlock(); }
  }
}
