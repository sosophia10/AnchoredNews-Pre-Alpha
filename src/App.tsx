/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Provides a light application entry wrapper that lazy-loads the
 * main dashboard shell without changing the product behavior.
 */

import { Suspense, lazy } from "react";

const DashboardApp = lazy(() =>
  import("@/features/dashboard/DashboardApp").then((module) => ({
    default: module.DashboardApp,
  })),
);

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen bg-[#0b1c2c]" />
      }
    >
      <DashboardApp />
    </Suspense>
  );
}
