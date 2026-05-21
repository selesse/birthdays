import { createRoot } from "react-dom/client";
import { LocalAdapter } from "../storage/LocalAdapter";
import { App } from "./App";
import "./index.css";
import { checkBirthdaysAndNotify } from "./staticNotifications";

const adapter = new LocalAdapter();

function ExportImport() {
  async function handleExport() {
    const people = await adapter.getPeople();
    const json = JSON.stringify(people, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "birthday-tracker.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        localStorage.setItem("birthday_people", text);
        window.location.reload();
      } catch {
        alert("Failed to import. Make sure it's a valid export file.");
      }
    };
    input.click();
  }

  return (
    <div className="toolbar-wrap">
      <button onClick={handleExport} className="toolbar-btn">
        Export JSON
      </button>
      <button onClick={handleImport} className="toolbar-btn">
        Import JSON
      </button>
    </div>
  );
}

function StaticRoot() {
  return (
    <>
      <App storage={adapter} />
      <ExportImport />
    </>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("No #root element found");

createRoot(root).render(<StaticRoot />);

checkBirthdaysAndNotify().catch(() => {});
