import Modal from "../ui/Modal";
import { useAbsenceReport } from "../../hooks/useAbsenceReport";
import { formatLength } from "../../utils/format";
import ResourceGains from "./ResourceGains";
import VillageEventList from "./VillageEventList";

/** "While you were away": what an absence brought to the village. */
export default function AbsenceReport() {
  const { isOpen, report, originOfflineMs, dismiss } = useAbsenceReport();

  return (
    <Modal
      isOpen={isOpen}
      title="Pendant votre absence"
      message={
        report
          ? `Vous êtes resté hors ligne ${formatLength(report.offlineMs)}. Voici ce que votre village a fait pendant ce temps.`
          : ""
      }
      onClose={dismiss}
      size="lg"
    >
      {report && (
        <div className="mt-4 flex flex-col gap-3">
          <ResourceGains gains={report.gains} />
          {report.events.length > 0 ? (
            <VillageEventList
              events={report.events}
              originOfflineMs={originOfflineMs}
              timePrefix="après"
            />
          ) : (
            <p className="m-0 text-[0.78rem] text-(--gray-600)">
              Rien de nouveau au village, mais la récolte a continué.
            </p>
          )}
        </div>
      )}
      <div className="mt-5 flex justify-end">
        <button
          type="button"
          className="min-h-10 cursor-pointer rounded-[10px] border-0 bg-(--accent) px-4 py-2 text-[0.82rem] font-bold text-white focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
          onClick={dismiss}
          autoFocus
        >
          Retour au village
        </button>
      </div>
    </Modal>
  );
}
