export class TownHall {
  id: string;
  builtAt: number;

  constructor() {
    this.id = crypto.randomUUID();
    this.builtAt = Date.now();
  }
}
