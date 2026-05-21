import { useEffect } from "react";
import type { Person } from "../../storage/types";

export function useSSE(
  sseUrl: string | undefined,
  setPeople: React.Dispatch<React.SetStateAction<Person[]>>,
) {
  useEffect(() => {
    if (!sseUrl) return;
    const es = new EventSource(sseUrl);
    es.addEventListener("birthday-added", (e) => {
      const added = JSON.parse((e as MessageEvent).data) as Person;
      setPeople((prev) => {
        if (prev.some((p) => p.id === added.id)) return prev;
        return [...prev, added];
      });
    });
    es.addEventListener("birthday-deleted", (e) => {
      const { id } = JSON.parse((e as MessageEvent).data) as { id: string };
      setPeople((prev) => prev.filter((p) => p.id !== id));
    });
    es.addEventListener("birthday-updated", (e) => {
      const updated = JSON.parse((e as MessageEvent).data) as Person[];
      setPeople(updated);
    });
    return () => es.close();
  }, [sseUrl]);
}
