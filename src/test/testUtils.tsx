import { render as rtlRender, within } from "@testing-library/react";
import type React from "react";

export function render(ui: React.ReactElement) {
  const result = rtlRender(ui);
  return {
    ...result,
    screen: within(result.container),
  };
}

export { act, cleanup, waitFor } from "@testing-library/react";
