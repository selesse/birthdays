import type { Child, StorageAdapter } from "./types";

type ServerChild = {
  id: number;
  name: string;
  birthdate: string;
  note: string | null;
};

function normalize(c: ServerChild): Child {
  return { ...c, id: String(c.id) };
}

export class ApiAdapter implements StorageAdapter {
  async getChildren(): Promise<Child[]> {
    const res = await fetch("/api/children");
    const data = (await res.json()) as ServerChild[];
    return data.map(normalize);
  }

  async addChild(
    name: string,
    birthdate: string,
    note?: string,
  ): Promise<Child[]> {
    await fetch("/api/children", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, birthdate, note }),
    });
    return this.getChildren();
  }

  async deleteChild(id: string): Promise<void> {
    await fetch(`/api/children/${id}`, { method: "DELETE" });
  }

  async updateChild(
    id: string,
    name: string,
    birthdate: string,
    note?: string,
  ): Promise<Child[]> {
    const res = await fetch(`/api/children/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, birthdate, note }),
    });
    const data = (await res.json()) as ServerChild[];
    return data.map(normalize);
  }
}
