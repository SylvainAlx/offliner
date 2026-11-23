import { useState } from "react";
import QrCode from "../install/QrCode";
import { renderQrCodePng } from "../../utils/qrImage";

const actionClass =
  "min-h-10 cursor-pointer rounded-[10px] border border-(--gray-200) bg-(--surface) px-3 text-[0.78rem] font-bold text-(--gray-700) hover:bg-(--gray-100) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--accent)";

/** File name of a downloaded QR code, from the planet's name. */
function fileName(planetName: string): string {
  const slug = planetName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `signal-${slug || "offliner"}.png`;
}

/**
 * A signal ready to leave: its code to copy and paste anywhere, and its QR
 * code to show, download or share. The player chooses how it travels.
 */
export default function SignalShare({ code, planetName }: { code: string; planetName: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("Code copié : collez-le où vous voulez.");
    } catch {
      setStatus("Copie impossible ici : sélectionnez le code et copiez-le à la main.");
    }
  }

  async function download() {
    const blob = await renderQrCodePng(code);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName(planetName);
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("QR code téléchargé.");
  }

  async function share() {
    try {
      const file = new File([await renderQrCodePng(code)], fileName(planetName), {
        type: "image/png",
      });
      const text = `Signal radar d'Offliner depuis ${planetName} :\n${code}`;
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "Signal Offliner", text, files: [file] });
      } else {
        await navigator.share({ title: "Signal Offliner", text });
      }
      setStatus(null);
    } catch (error) {
      // Closing the share sheet is not an error.
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus("Partage impossible : copiez le code ou téléchargez le QR code.");
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="mx-auto rounded-2xl bg-white p-2 shadow-(--shadow-sm)">
        <QrCode value={code} size={220} label={`QR code du signal de ${planetName}`} />
      </div>
      <label className="flex flex-col gap-1 text-[0.72rem] font-bold text-(--gray-700)">
        Code du signal
        <textarea
          className="min-h-20 w-full resize-y rounded-[10px] border border-(--gray-200) bg-(--gray-50) p-2.5 font-(--mono) text-[0.7rem] break-all text-(--gray-900)"
          value={code}
          readOnly
          onFocus={(event) => event.currentTarget.select()}
        />
      </label>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" className={actionClass} onClick={copy}>
          📋 Copier le code
        </button>
        <button type="button" className={actionClass} onClick={download}>
          ⬇️ Télécharger le QR code
        </button>
        {canShare && (
          <button type="button" className={actionClass} onClick={share}>
            📤 Partager
          </button>
        )}
      </div>
      {status && (
        <p className="m-0 text-center text-[0.74rem] text-(--gray-600)" role="status">
          {status}
        </p>
      )}
    </div>
  );
}
