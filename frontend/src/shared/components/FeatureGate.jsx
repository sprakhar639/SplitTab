import { useState } from "react";

import { isFeatureReady } from "../../config/features";
import { PreviewContext } from "../../context/PreviewContext";
import ComingSoon, { PreviewBanner } from "./ComingSoon";

// Renders children only when the feature's backend support is ready, so
// mock-backed components never mount (or fetch) before then. "Take a peek"
// mounts them anyway, on mock data, under a preview banner.
//
// fallback may be a node, or a function receiving the peek callback.
export default function FeatureGate({ feature, variant = "section", fallback, children }) {
  const [peeking, setPeeking] = useState(false);

  if (isFeatureReady(feature)) return children;

  if (peeking) {
    return (
      <div className="flex flex-col gap-4">
        <PreviewBanner feature={feature} onExit={() => setPeeking(false)} />
        <PreviewContext.Provider value={true}>{children}</PreviewContext.Provider>
      </div>
    );
  }

  const peek = () => setPeeking(true);

  if (typeof fallback === "function") return fallback(peek);

  return fallback ?? <ComingSoon feature={feature} variant={variant} onPeek={peek} />;
}
