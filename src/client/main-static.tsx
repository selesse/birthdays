import { createRoot } from "react-dom/client";
import { LocalAdapter } from "../storage/LocalAdapter";
import { App } from "./App";

const btnStyle: React.CSSProperties = {
  background: "#1a1a2e",
  color: "#888",
  border: "1px solid #2d3436",
  borderRadius: 6,
  padding: "6px 14px",
  fontSize: "0.8rem",
  cursor: "pointer",
};

const adapter = new LocalAdapter();

function ExportImport() {
  async function handleExport() {
    const children = await adapter.getChildren();
    const json = JSON.stringify(children, null, 2);
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
        localStorage.setItem("birthday_children", text);
        window.location.reload();
      } catch {
        alert("Failed to import. Make sure it's a valid export file.");
      }
    };
    input.click();
  }

  return (
    <div
      style={{
        maxWidth: 860,
        margin: "0 auto",
        padding: "0 16px 24px",
        display: "flex",
        gap: 8,
      }}
    >
      <button onClick={handleExport} style={btnStyle}>
        Export JSON
      </button>
      <button onClick={handleImport} style={btnStyle}>
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
