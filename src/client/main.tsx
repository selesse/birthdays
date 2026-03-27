import { createRoot } from "react-dom/client";
import "./index.css";
import { ApiAdapter } from "../storage/ApiAdapter";
import { App } from "./App";

const root = document.getElementById("root")!;
createRoot(root).render(
  <App storage={new ApiAdapter()} sseUrl="/api/events" />,
);
