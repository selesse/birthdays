import { afterEach } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { cleanup } from "@testing-library/react";

GlobalRegistrator.register();

if (!document.body) {
  document.body = document.createElement("body");
}

afterEach(() => {
  cleanup();
});

const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args: unknown[]) => {
  const msg = args[0];
  if (typeof msg === "string" && msg.includes("width(0) and height(0)")) return;
  originalWarn.apply(console, args);
};

console.error = (...args: unknown[]) => {
  const msg = args[0];
  if (typeof msg === "string" && msg.includes("was not wrapped in act")) return;
  originalError.apply(console, args);
};
