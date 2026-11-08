import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary";
import { useUser } from "./stores/userStore";
import { setupServiceWorker } from "./services/serviceWorker";

async function bootstrap() {
  setupServiceWorker();
  const root = createRoot(document.getElementById("root")!);

  try {
    await useUser.getState().hydrate();
  } catch (error) {
    console.error("Unable to load Offliner data:", error);
    // Do not start the app with an empty profile: its first save would
    // overwrite the data that could not be read.
    root.render(<ErrorBoundary initialError={error} />);
    return;
  }

  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}

void bootstrap();
