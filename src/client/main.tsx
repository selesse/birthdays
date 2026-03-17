import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ApiAdapter } from "../storage/ApiAdapter";

const root = document.getElementById("root")!;
createRoot(root).render(<App storage={new ApiAdapter()} sseUrl="/api/events" />);
