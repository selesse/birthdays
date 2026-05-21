export interface Person {
  id: string; // covers both DB integers (as string) and crypto.randomUUID()
  name: string;
  birthdate: string;
  note: string | null;
}

export interface StorageAdapter {
  getPeople(): Promise<Person[]>;
  addPerson(name: string, birthdate: string, note?: string): Promise<Person[]>;
  deletePerson(id: string): Promise<void>;
  updatePerson(
    id: string,
    name: string,
    birthdate: string,
    note?: string,
  ): Promise<Person[]>;
}
