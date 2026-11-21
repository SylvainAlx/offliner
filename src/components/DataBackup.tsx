import Card from "./ui/Card";
import Button from "./ui/Button";
import { useDataBackup } from "../hooks/useDataBackup";
import ConfirmModal from "./ui/ConfirmModal";

export default function DataBackup() {
  const {
    handleExport,
    handleImport,
    handleClearAll,
    fileInputRef,
    feedback,
    isResetModalOpen,
    setIsResetModalOpen,
    isImportModalOpen,
    setIsImportModalOpen,
    isExportModalOpen,
    setIsExportModalOpen,
  } = useDataBackup();

  return (
    <Card
      ariaLabel="Données du compte"
      title="Données du compte"
      subtitle="Exportez, importez ou effacez vos données Offliner."
    >
      <div className="w-full">
        <p className="text-[0.85rem] leading-[1.55] text-(--gray-600)">
          Enregistrez votre compte dans un fichier JSON pour conserver votre
          progression ou la transférer sur un autre appareil.
        </p>

        <div className="mt-4 grid gap-2.25 [&>button]:w-full">
          <Button
            onClick={() => setIsExportModalOpen(true)}
            color="var(--accent-solid)"
          >
            Exporter mes données
          </Button>
          <Button
            onClick={() => setIsImportModalOpen(true)}
            color="var(--green-solid)"
          >
            Importer une sauvegarde
          </Button>
          <Button
            onClick={() => setIsResetModalOpen(true)}
            color="var(--red-solid)"
          >
            Effacer toutes les données
          </Button>
          <input
            ref={fileInputRef}
            className="absolute h-px w-px overflow-hidden [clip:rect(0_0_0_0)] [clip-path:inset(50%)] whitespace-nowrap"
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
            aria-label="Choisir une sauvegarde JSON"
          />
        </div>

        {feedback && (
          <p
            className={`mt-2.75 text-[0.8rem] leading-[1.45] ${
              feedback.kind === "success"
                ? "text-(--green-dark)"
                : "text-(--red-dark)"
            }`}
            role={feedback.kind === "error" ? "alert" : "status"}
          >
            {feedback.message}
          </p>
        )}
      </div>
      <ConfirmModal
        isOpen={isResetModalOpen}
        title="Effacer toutes les données ?"
        message="Cette action supprimera toutes vos données Offliner. Continuer ?"
        confirmLabel="Effacer"
        onCancel={() => setIsResetModalOpen(false)}
        onConfirm={() => {
          handleClearAll();
          setIsResetModalOpen(false);
        }}
      />
      <ConfirmModal
        isOpen={isImportModalOpen}
        title="Importer une sauvegarde ?"
        message="Cette action remplacera le compte actuel par la sauvegarde sélectionnée. Continuer ?"
        confirmLabel="Importer"
        onCancel={() => setIsImportModalOpen(false)}
        onConfirm={() => {
          setIsImportModalOpen(false);
          fileInputRef.current?.click();
        }}
      />
      <ConfirmModal
        isOpen={isExportModalOpen}
        title="Exporter les données ?"
        message="Cette action exportera vos données Offliner au format JSON. Continuer ?"
        confirmLabel="Exporter"
        onCancel={() => setIsExportModalOpen(false)}
        onConfirm={() => {
          handleExport();
          setIsExportModalOpen(false);
        }}
      />
    </Card>
  );
}
