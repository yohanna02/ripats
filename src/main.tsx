import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { BrowserRouter } from "react-router-dom";
import ProductApp from "./ProductApp";
import { ToastProvider } from "./components/ui/ToastProvider";
import "./index.css";
import "./ProductApp.css";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const root = createRoot(document.getElementById("root")!);

if (!convexUrl) {
  root.render(
    <main className="rp-config-screen">
      <div>
        <span className="rp-eyebrow">RIPATS · ATBU</span>
        <h1>Connect the university research workspace.</h1>
        <p>
          Set <code>VITE_CONVEX_URL</code> for the selected Convex deployment,
          then restart the application.
        </p>
      </div>
    </main>,
  );
} else {
  const convex = new ConvexReactClient(convexUrl);
  root.render(
    <StrictMode>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <ToastProvider>
            <ProductApp />
          </ToastProvider>
        </BrowserRouter>
      </ConvexAuthProvider>
    </StrictMode>,
  );
}
