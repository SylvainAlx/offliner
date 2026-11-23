import { useRef, useState } from "react";
import Card from "../ui/Card";
import SignalCard from "./SignalCard";
import SignalShare from "./SignalShare";
import { useUser } from "../../stores/userStore";
import { getRadarMessageLength } from "../../models/buildings";
import { SIGNAL_ERROR_MESSAGES, type SentSignal } from "../../models/signal";
import type { SignalReception } from "../../models/user";
import { readQrCodeFromImage } from "../../utils/qrImage";

type Tab = "emit" | "receive" | "journal";

const fieldClass =
  "min-h-11 w-full rounded-[10px] border border-(--gray-200) bg-(--surface) px-3 py-2.5 font-inherit text-[0.88rem] text-(--gray-900) outline-offset-1 focus:outline-2 focus:outline-(--accent-border)";
const labelClass = "flex flex-col gap-1 text-[0.76rem] font-bold text-(--gray-700)";
const primaryClass =
  "min-h-11 cursor-pointer rounded-[10px] border-0 bg-(--accent-solid) px-4 text-[0.86rem] font-bold text-(--on-color) disabled:cursor-not-allowed disabled:opacity-40";
const secondaryClass =
  "min-h-10 cursor-pointer rounded-[10px] border border-(--gray-200) bg-(--surface) px-3 text-[0.78rem] font-bold text-(--gray-700) hover:bg-(--gray-100)";

function EmitPanel() {
  const user = useUser((state) => state.user);
  const emitSignal = useUser((state) => state.emitSignal);
  const radars = user.colonies.filter((colony) => colony.planet.levels.radar > 0);
  const [colonyId, setColonyId] = useState(
    radars.find((colony) => colony.id === user.activeColonyId)?.id ?? radars[0]?.id ?? "",
  );
  const [authorId, setAuthorId] = useState(user.leader?.id ?? user.notables[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState<SentSignal | null>(null);

  const colony = radars.find((item) => item.id === colonyId) ?? radars[0];
  const maxLength = getRadarMessageLength(colony?.planet.levels.radar ?? 0);
  const text = message.trim();
  const canEmit = Boolean(colony && authorId && text && text.length <= maxLength);

  if (sent) {
    return (
      <div className="flex flex-col gap-3">
        <p className="m-0 text-center text-[0.84rem] font-bold text-(--green-dark)" role="status">
          📡 Signal émis ! Transmettez ce code ou ce QR code par le moyen de votre choix.
        </p>
        <SignalShare code={sent.code} planetName={sent.planetName} />
        <button type="button" className={secondaryClass} onClick={() => setSent(null)}>
          Émettre un autre signal
        </button>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!colony) return;
        const result = emitSignal(colony.id, authorId, message);
        if (result) {
          setSent(result);
          setMessage("");
        }
      }}
    >
      <label className={labelClass}>
        Planète émettrice
        <select className={fieldClass} value={colony?.id} onChange={(event) => setColonyId(event.target.value)}>
          {radars.map((item) => (
            <option key={item.id} value={item.id}>
              {item.planet.name} (radar niv. {item.planet.levels.radar})
            </option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        Auteur
        <select className={fieldClass} value={authorId} onChange={(event) => setAuthorId(event.target.value)}>
          {user.notables.map((notable) => (
            <option key={notable.id} value={notable.id}>
              {notable.name} — {notable.title}
            </option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        Message
        <textarea
          className={`${fieldClass} min-h-28 resize-y`}
          value={message}
          maxLength={maxLength}
          placeholder="Que voulez-vous dire aux autres planètes ?"
          onChange={(event) => setMessage(event.target.value)}
        />
        <span className="text-right font-(--mono) text-[0.68rem] font-normal text-(--gray-500)">
          {message.length} / {maxLength}
        </span>
      </label>
      <p className="m-0 text-[0.72rem] leading-snug text-(--gray-500)">
        Le signal est encodé, pas chiffré : toute personne qui reçoit le code peut lire le
        message. Chaque niveau de radar permet {getRadarMessageLength(1)} caractères de plus.
      </p>
      <button type="submit" className={primaryClass} disabled={!canEmit}>
        📡 Émettre le signal
      </button>
    </form>
  );
}

function describeReception(reception: SignalReception): { text: string; tone: "ok" | "info" | "error" } {
  switch (reception.status) {
    case "received":
      return { text: "Signal capté ! Il est rangé dans le journal.", tone: "ok" };
    case "duplicate":
      return { text: "Ce signal a déjà été capté : il est dans votre journal.", tone: "info" };
    case "own":
      return { text: "C'est votre propre signal : il a bien été décodé, mais n'est pas ajouté au journal.", tone: "info" };
    case "noRadar":
      return { text: "Il faut un radar pour capter les signaux.", tone: "error" };
    case "error":
      return { text: SIGNAL_ERROR_MESSAGES[reception.error], tone: "error" };
  }
}

function ReceivePanel() {
  const receiveSignal = useUser((state) => state.receiveSignal);
  const [code, setCode] = useState("");
  const [reception, setReception] = useState<SignalReception | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function receive(value: string) {
    setScanError(null);
    setReception(receiveSignal(value));
  }

  async function scan(file: File) {
    setIsScanning(true);
    setScanError(null);
    setReception(null);
    try {
      const value = await readQrCodeFromImage(file);
      if (value) {
        setCode(value);
        receive(value);
      } else {
        setScanError(
          "Aucun QR code lisible sur cette image. Cadrez-le bien en entier, net et bien éclairé, puis réessayez.",
        );
      }
    } catch {
      setScanError("Impossible de lire cette image. Essayez avec une autre photo.");
    } finally {
      setIsScanning(false);
    }
  }

  const outcome = reception && describeReception(reception);
  const toneClass = {
    ok: "text-(--green-dark)",
    info: "text-(--gray-700)",
    error: "text-(--red-dark)",
  } as const;

  return (
    <div className="flex flex-col gap-3">
      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          receive(code);
        }}
      >
        <label className={labelClass}>
          Code reçu
          <textarea
            className={`${fieldClass} min-h-24 resize-y font-(--mono) text-[0.74rem] break-all`}
            value={code}
            placeholder="OFFLINER1.…"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            onChange={(event) => setCode(event.target.value)}
          />
        </label>
        <button type="submit" className={primaryClass} disabled={!code.trim()}>
          Décoder le signal
        </button>
      </form>

      <div className="flex items-center gap-2 text-[0.72rem] text-(--gray-500)" aria-hidden="true">
        <span className="h-px flex-1 bg-(--gray-200)" /> ou <span className="h-px flex-1 bg-(--gray-200)" />
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void scan(file);
        }}
      />
      <button
        type="button"
        className={secondaryClass}
        disabled={isScanning}
        onClick={() => fileInput.current?.click()}
      >
        {isScanning ? "Lecture du QR code…" : "📷 Photographier ou choisir un QR code"}
      </button>

      {scanError && (
        <p className="m-0 text-[0.78rem] text-(--red-dark)" role="alert">
          {scanError}
        </p>
      )}
      {outcome && (
        <p className={`m-0 text-[0.8rem] font-bold ${toneClass[outcome.tone]}`} role="status">
          {outcome.text}
        </p>
      )}
      {reception && "signal" in reception && <SignalCard signal={reception.signal} />}
    </div>
  );
}

function JournalPanel() {
  const received = useUser((state) => state.user.receivedSignals);
  const sent = useUser((state) => state.user.sentSignals);
  const deleteReceivedSignal = useUser((state) => state.deleteReceivedSignal);
  const [shownCode, setShownCode] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-2" aria-label="Signaux captés">
        <h3 className="m-0 text-[0.9rem] font-extrabold text-(--gray-900)">
          Signaux captés <span className="text-(--gray-500)">({received.length})</span>
        </h3>
        {received.length === 0 ? (
          <p className="m-0 rounded-xl bg-(--gray-50) p-3 text-[0.8rem] text-(--gray-600)">
            Aucun signal pour l&apos;instant. Demandez à un autre joueur son code ou son QR code,
            puis captez-le dans l&apos;onglet Recevoir.
          </p>
        ) : (
          received.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              footer={
                <button
                  type="button"
                  className={`${secondaryClass} self-end`}
                  onClick={() => deleteReceivedSignal(signal.id)}
                  aria-label={`Supprimer le signal de ${signal.authorName}`}
                >
                  🗑️ Supprimer
                </button>
              }
            />
          ))
        )}
      </section>

      <section className="flex flex-col gap-2" aria-label="Signaux émis">
        <h3 className="m-0 text-[0.9rem] font-extrabold text-(--gray-900)">
          Signaux émis <span className="text-(--gray-500)">({sent.length})</span>
        </h3>
        {sent.length === 0 ? (
          <p className="m-0 rounded-xl bg-(--gray-50) p-3 text-[0.8rem] text-(--gray-600)">
            Vous n&apos;avez encore émis aucun signal.
          </p>
        ) : (
          sent.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              footer={
                shownCode === signal.code ? (
                  <SignalShare code={signal.code} planetName={signal.planetName} />
                ) : (
                  <button
                    type="button"
                    className={`${secondaryClass} self-end`}
                    onClick={() => setShownCode(signal.code)}
                  >
                    Afficher le code et le QR code
                  </button>
                )
              }
            />
          ))
        )}
      </section>
    </div>
  );
}

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "emit", label: "📡 Émettre" },
  { id: "receive", label: "📥 Recevoir" },
  { id: "journal", label: "📒 Journal" },
];

/**
 * The radar: signals between players' planets without any server. A signal
 * becomes a code (or a QR code) that players pass on however they like.
 */
export default function RadarSection() {
  const [tab, setTab] = useState<Tab>("emit");
  const receivedCount = useUser((state) => state.user.receivedSignals.length);

  return (
    <Card
      ariaLabel="Communications"
      title="Communications"
      subtitle="Échangez des signaux avec les planètes d'autres joueurs, sans serveur."
    >
      <div className="grid w-full grid-cols-3 gap-1 rounded-xl bg-(--gray-50) p-1" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={[
              "min-h-10 cursor-pointer rounded-[9px] border-0 px-2 text-[0.8rem] font-bold",
              tab === item.id
                ? "bg-(--surface) text-(--gray-900) shadow-(--shadow-sm)"
                : "bg-transparent text-(--gray-600)",
            ].join(" ")}
            onClick={() => setTab(item.id)}
          >
            {item.label}
            {item.id === "journal" && receivedCount > 0 ? ` (${receivedCount})` : ""}
          </button>
        ))}
      </div>
      <div className="w-full" role="tabpanel">
        {tab === "emit" && <EmitPanel />}
        {tab === "receive" && <ReceivePanel />}
        {tab === "journal" && <JournalPanel />}
      </div>
    </Card>
  );
}
