import { createContext, useContext } from "react";

// True inside a "Take a peek" preview of a feature that isn't live yet.
// Components use it to block actions that would write real data.
export const PreviewContext = createContext(false);

export function usePreview() {
  return useContext(PreviewContext);
}
