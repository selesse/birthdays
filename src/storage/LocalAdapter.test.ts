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
  test("getChildren returns empty array when storage is empty", async () => {
    const adapter = new LocalAdapter();
    expect(await adapter.getChildren()).toEqual([]);
  });

  test("addChild stores a child and returns it", async () => {
    const adapter = new LocalAdapter();
    const children = await adapter.addChild("Alice", "2020-06-15");

    expect(children).toHaveLength(1);
    expect(children[0].name).toBe("Alice");
    expect(children[0].birthdate).toBe("2020-06-15");
    expect(children[0].note).toBeNull();
    expect(typeof children[0].id).toBe("string");
  });

  test("addChild stores note when provided", async () => {
    const adapter = new LocalAdapter();
    const children = await adapter.addChild("Bob", "2021-03-01", "loves dogs");
    expect(children[0].note).toBe("loves dogs");
  });

  test("addChild returns children sorted by birthdate", async () => {
    const adapter = new LocalAdapter();
    await adapter.addChild("Bob", "2021-09-01");
    await adapter.addChild("Alice", "2019-03-15");
    const children = await adapter.getChildren();

    expect(children[0].name).toBe("Alice");
    expect(children[1].name).toBe("Bob");
  });

  test("deleteChild removes the child", async () => {
    const adapter = new LocalAdapter();
    const [child] = await adapter.addChild("Carol", "2022-01-10");
    await adapter.deleteChild(child.id);
    expect(await adapter.getChildren()).toHaveLength(0);
  });

  test("deleteChild with unknown id leaves others intact", async () => {
    const adapter = new LocalAdapter();
    await adapter.addChild("Dave", "2020-05-05");
    await adapter.deleteChild("nonexistent-id");
    expect(await adapter.getChildren()).toHaveLength(1);
  });

  test("updateChild modifies name, birthdate, and note", async () => {
    const adapter = new LocalAdapter();
    const [child] = await adapter.addChild("Eve", "2023-07-20", "old note");
    const updated = await adapter.updateChild(
      child.id,
      "Eve Updated",
      "2023-08-01",
      "new note",
    );

    expect(updated).toHaveLength(1);
    expect(updated[0].name).toBe("Eve Updated");
    expect(updated[0].birthdate).toBe("2023-08-01");
    expect(updated[0].note).toBe("new note");
  });

  test("updateChild clears note when omitted", async () => {
    const adapter = new LocalAdapter();
    const [child] = await adapter.addChild("Frank", "2022-11-11", "some note");
    const updated = await adapter.updateChild(child.id, "Frank", "2022-11-11");
    expect(updated[0].note).toBeNull();
  });

  test("getChildren reflects persisted state across adapter instances", async () => {
    const a = new LocalAdapter();
    await a.addChild("Grace", "2020-04-04");

    const b = new LocalAdapter();
    const children = await b.getChildren();
    expect(children).toHaveLength(1);
    expect(children[0].name).toBe("Grace");
  });
});
