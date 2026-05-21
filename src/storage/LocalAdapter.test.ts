import { beforeEach, describe, expect, test } from "bun:test";
import { LocalAdapter } from "./LocalAdapter";

class MockStorage {
  private data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  clear() {
    this.data.clear();
  }
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: MockStorage }).localStorage =
    new MockStorage();
});

describe("LocalAdapter", () => {
  test("getPeople returns empty array when storage is empty", async () => {
    const adapter = new LocalAdapter();
    expect(await adapter.getPeople()).toEqual([]);
  });

  test("addPerson stores a person and returns it", async () => {
    const adapter = new LocalAdapter();
    const people = await adapter.addPerson("Alice", "2020-06-15");

    expect(people).toHaveLength(1);
    expect(people[0].name).toBe("Alice");
    expect(people[0].birthdate).toBe("2020-06-15");
    expect(people[0].note).toBeNull();
    expect(typeof people[0].id).toBe("string");
  });

  test("addPerson stores note when provided", async () => {
    const adapter = new LocalAdapter();
    const people = await adapter.addPerson("Bob", "2021-03-01", "loves dogs");
    expect(people[0].note).toBe("loves dogs");
  });

  test("addPerson returns people sorted by birthdate", async () => {
    const adapter = new LocalAdapter();
    await adapter.addPerson("Bob", "2021-09-01");
    await adapter.addPerson("Alice", "2019-03-15");
    const people = await adapter.getPeople();

    expect(people[0].name).toBe("Alice");
    expect(people[1].name).toBe("Bob");
  });

  test("deletePerson removes the person", async () => {
    const adapter = new LocalAdapter();
    const [person] = await adapter.addPerson("Carol", "2022-01-10");
    await adapter.deletePerson(person.id);
    expect(await adapter.getPeople()).toHaveLength(0);
  });

  test("deletePerson with unknown id leaves others intact", async () => {
    const adapter = new LocalAdapter();
    await adapter.addPerson("Dave", "2020-05-05");
    await adapter.deletePerson("nonexistent-id");
    expect(await adapter.getPeople()).toHaveLength(1);
  });

  test("updatePerson modifies name, birthdate, and note", async () => {
    const adapter = new LocalAdapter();
    const [person] = await adapter.addPerson("Eve", "2023-07-20", "old note");
    const updated = await adapter.updatePerson(
      person.id,
      "Eve Updated",
      "2023-08-01",
      "new note",
    );

    expect(updated).toHaveLength(1);
    expect(updated[0].name).toBe("Eve Updated");
    expect(updated[0].birthdate).toBe("2023-08-01");
    expect(updated[0].note).toBe("new note");
  });

  test("updatePerson clears note when omitted", async () => {
    const adapter = new LocalAdapter();
    const [person] = await adapter.addPerson(
      "Frank",
      "2022-11-11",
      "some note",
    );
    const updated = await adapter.updatePerson(
      person.id,
      "Frank",
      "2022-11-11",
    );
    expect(updated[0].note).toBeNull();
  });

  test("getPeople reflects persisted state across adapter instances", async () => {
    const a = new LocalAdapter();
    await a.addPerson("Grace", "2020-04-04");

    const b = new LocalAdapter();
    const people = await b.getPeople();
    expect(people).toHaveLength(1);
    expect(people[0].name).toBe("Grace");
  });
});
