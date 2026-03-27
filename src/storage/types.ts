export interface Child {
  id: string; // covers both DB integers (as string) and crypto.randomUUID()
  name: string;
  birthdate: string;
  note: string | null;
}

export interface StorageAdapter {
  getChildren(): Promise<Child[]>;
  addChild(name: string, birthdate: string, note?: string): Promise<Child[]>;
  deleteChild(id: string): Promise<void>;
  updateChild(
    id: string,
    name: string,
    birthdate: string,
    note?: string,
  ): Promise<Child[]>;
}
