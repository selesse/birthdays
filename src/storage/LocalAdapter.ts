import type { Child, StorageAdapter } from "./types";

const STORAGE_KEY = "birthday_children";

export class LocalAdapter implements StorageAdapter {
  private load(): Child[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Child[]) : [];
    } catch {
      return [];
    }
  }

  private save(children: Child[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(children));
  }

  private sorted(children: Child[]): Child[] {
    return [...children].sort((a, b) => a.birthdate.localeCompare(b.birthdate));
  }

  async getChildren(): Promise<Child[]> {
    return this.sorted(this.load());
  }

  async addChild(
    name: string,
    birthdate: string,
    note?: string,
  ): Promise<Child[]> {
    const children = this.load();
    children.push({
      id: crypto.randomUUID(),
      name,
      birthdate,
      note: note ?? null,
    });
    this.save(children);
    return this.sorted(children);
  }

  async deleteChild(id: string): Promise<void> {
    const children = this.load().filter((c) => c.id !== id);
    this.save(children);
  }

  async updateChild(
    id: string,
    name: string,
    birthdate: string,
    note?: string,
  ): Promise<Child[]> {
    const children = this.load().map((c) =>
      c.id === id ? { id, name, birthdate, note: note ?? null } : c,
    );
    this.save(children);
    return this.sorted(children);
  }
}
