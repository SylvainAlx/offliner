import { Component, type ErrorInfo, type ReactNode } from "react";
import { userRepository } from "../services/userRepository";
import { useUser } from "../stores/userStore";
import { downloadJson, getBackupFileName } from "../utils/download";
import Button from "./ui/Button";
import Card from "./ui/Card";

interface ErrorBoundaryProps {
  children?: ReactNode;
  /** Error raised before rendering (e.g. the local database could not be read). */
  initialError?: unknown;
}

interface ErrorBoundaryState {
  error: unknown;
  isConfirmingReset: boolean;
  feedback: string | null;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    error: this.props.initialError ?? null,
    isConfirmingReset: false,
    feedback: null,
  };

  static getDerivedStateFromError(error: unknown): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error("Offliner crashed:", error, info.componentStack);
  }

  private handleExportRawData = async () => {
    try {
      const data = await userRepository.exportSnapshot();
      if (data === null) {
        this.setState({ feedback: "Aucune donnée à exporter." });
        return;
      }
      downloadJson(data, getBackupFileName("donnees-brutes"));
      this.setState({ feedback: "Données exportées." });
    } catch {
      this.setState({ feedback: "Impossible de lire les données locales." });
    }
  };

  private handleReset = async () => {
    if (!this.state.isConfirmingReset) {
      this.setState({ isConfirmingReset: true });
      return;
    }
    await useUser.getState().resetAll();
    window.location.reload();
  };

  render() {
    if (this.state.error === null) return this.props.children;

    // A failure before rendering means the database itself is unavailable:
    // resetting it would be pointless and could hide a transient problem.
    const canRepairData = this.props.initialError === undefined;

    return (
      <main className="mx-auto flex min-h-screen w-[min(calc(100%-32px),560px)] items-center">
        <Card
          ariaLabel="Erreur"
          title="Une erreur est survenue"
          subtitle={
            canRepairData
              ? "Vos données locales semblent invalides ou l'application a rencontré un problème."
              : "Impossible d'accéder au stockage local de l'appareil."
          }
        >
          <div className="grid w-full gap-2.25 [&>button]:w-full">
            <Button onClick={() => window.location.reload()}>Recharger</Button>
            {canRepairData && (
              <>
                <Button
                  onClick={() => void this.handleExportRawData()}
                  color="var(--green-dark)"
                >
                  Exporter mes données brutes
                </Button>
                <Button
                  onClick={() => void this.handleReset()}
                  color="var(--red-dark)"
                >
                  {this.state.isConfirmingReset
                    ? "Confirmer l'effacement définitif"
                    : "Effacer les données et repartir de zéro"}
                </Button>
              </>
            )}
          </div>
          {this.state.feedback && (
            <p className="m-0 text-[0.8rem] text-(--gray-600)" role="status">
              {this.state.feedback}
            </p>
          )}
        </Card>
      </main>
    );
  }
}
