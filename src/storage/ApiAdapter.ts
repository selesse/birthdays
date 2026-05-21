import type { Person, StorageAdapter } from "./types";

type ServerPerson = {
  id: number;
  name: string;
  birthdate: string;
  note: string | null;
};

function normalize(c: ServerPerson): Person {
  return { ...c, id: String(c.id) };
}

export class ApiAdapter implements StorageAdapter {
  async getPeople(): Promise<Person[]> {
    const res = await fetch("/api/people");
    const data = (await res.json()) as ServerPerson[];
    return data.map(normalize);
  }

  async addPerson(
    name: string,
    birthdate: string,
    note?: string,
  ): Promise<Person[]> {
    await fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, birthdate, note }),
    });
    return this.getPeople();
  }

  async deletePerson(id: string): Promise<void> {
    await fetch(`/api/people/${id}`, { method: "DELETE" });
  }

  async updatePerson(
    id: string,
    name: string,
    birthdate: string,
    note?: string,
  ): Promise<Person[]> {
    const res = await fetch(`/api/people/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, birthdate, note }),
    });
    const data = (await res.json()) as ServerPerson[];
    return data.map(normalize);
  }
}
