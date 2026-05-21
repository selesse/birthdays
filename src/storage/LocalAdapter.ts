import type { Person, StorageAdapter } from "./types";

const STORAGE_KEY = "birthday_people";

export class LocalAdapter implements StorageAdapter {
  private load(): Person[] {
    try {
      // Migrate data from old key name
      const legacy = localStorage.getItem("birthday_children");
      if (legacy && !localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, legacy);
        localStorage.removeItem("birthday_children");
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Person[]) : [];
    } catch {
      return [];
    }
  }

  private save(people: Person[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(people));
  }

  private sorted(people: Person[]): Person[] {
    return [...people].sort((a, b) => a.birthdate.localeCompare(b.birthdate));
  }

  async getPeople(): Promise<Person[]> {
    return this.sorted(this.load());
  }

  async addPerson(
    name: string,
    birthdate: string,
    note?: string,
  ): Promise<Person[]> {
    const people = this.load();
    people.push({
      id: crypto.randomUUID(),
      name,
      birthdate,
      note: note ?? null,
    });
    this.save(people);
    return this.sorted(people);
  }

  async deletePerson(id: string): Promise<void> {
    const people = this.load().filter((p) => p.id !== id);
    this.save(people);
  }

  async updatePerson(
    id: string,
    name: string,
    birthdate: string,
    note?: string,
  ): Promise<Person[]> {
    const people = this.load().map((p) =>
      p.id === id ? { id, name, birthdate, note: note ?? null } : p,
    );
    this.save(people);
    return this.sorted(people);
  }
}
