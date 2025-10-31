"use client";

import { memo } from "react";

const AccentLines = memo(function AccentLines() {
  return (
    <div className="accent-lines-fullpage" aria-hidden="true">
      <div className="accent-line h-line" />
      <div className="accent-line h-line" />
      <div className="accent-line h-line" />
      <div className="accent-line v-line" />
      <div className="accent-line v-line" />
      <div className="accent-line v-line" />
    </div>
  );
});

export default AccentLines;
