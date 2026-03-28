import { useEffect } from "react";
import type { Child } from "../../storage/types";

export function useSSE(
  sseUrl: string | undefined,
  setChildren: React.Dispatch<React.SetStateAction<Child[]>>,
) {
  useEffect(() => {
    if (!sseUrl) return;
    const es = new EventSource(sseUrl);
    es.addEventListener("birthday-added", (e) => {
      const added = JSON.parse((e as MessageEvent).data) as Child;
      setChildren((prev) => {
        if (prev.some((c) => c.id === added.id)) return prev;
        return [...prev, added];
      });
    });
    es.addEventListener("birthday-deleted", (e) => {
      const { id } = JSON.parse((e as MessageEvent).data) as { id: string };
      setChildren((prev) => prev.filter((c) => c.id !== id));
    });
    es.addEventListener("birthday-updated", (e) => {
      const updated = JSON.parse((e as MessageEvent).data) as Child[];
      setChildren(updated);
    });
    return () => es.close();
  }, [sseUrl]);
}
