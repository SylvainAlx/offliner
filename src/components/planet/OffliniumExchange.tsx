import { useState } from "react";
import { useUser } from "../../stores/userStore";
import {
  RESOURCE_ICONS,
  RESOURCE_LABELS,
  formatAmount,
} from "../../models/resources";
import {
  getExchangeAmount,
  type ExchangeResource,
} from "../../models/exchange";
import PlanetSection from "../PlanetSection";

/**
 * Exchanges Offlinium for metal or food on the planet shown: one hour of
 * Offlinium is worth one hour of the planet's production.
 */
export default function OffliniumExchange() {
  const user = useUser((state) => state.user);
  const exchangeOfflinium = useUser((state) => state.exchangeOfflinium);
  const [resource, setResource] = useState<ExchangeResource>("metal");
  const [amount, setAmount] = useState(0);
  const [done, setDone] = useState<string | null>(null);

  const quote = user.getExchangeQuote(resource);
  const offlinium = Math.min(amount, quote.maxOfflinium);
  const received = getExchangeAmount(quote, offlinium);
  const icon = RESOURCE_ICONS[resource];
  const isDepotFull = quote.freeCapacity <= 0;
  const balance = Math.floor(user.offlinium);
  const limitedByDepot = quote.maxOfflinium < balance;

  function choose(next: number) {
    setAmount(Math.max(0, Math.min(Math.floor(next), quote.maxOfflinium)));
    setDone(null);
  }

  return (
    <PlanetSection
      title="Comptoir d'échange"
      subtitle={`1 h d'Offlinium (${formatAmount(quote.offliniumPerHour)} ${RESOURCE_ICONS.offlinium}) vaut 1 h de production de ${user.activeColony.planet.name} (${formatAmount(quote.resourcePerHour)} ${icon}).`}
    >
      <div className="flex flex-col gap-3">
        <div
          className="grid grid-cols-2 gap-1 rounded-xl bg-(--gray-50) p-1"
          role="radiogroup"
          aria-label="Ressource à obtenir"
        >
          {(["metal", "food"] as const).map((type) => (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={resource === type}
              className={[
                "min-h-10 cursor-pointer rounded-[9px] border-0 text-[0.8rem] font-bold",
                resource === type
                  ? "bg-(--surface) text-(--gray-900) shadow-(--shadow-sm)"
                  : "bg-transparent text-(--gray-600)",
              ].join(" ")}
              onClick={() => {
                setResource(type);
                setAmount(0);
                setDone(null);
              }}
            >
              {RESOURCE_ICONS[type]} {RESOURCE_LABELS[type]}
            </button>
          ))}
        </div>

        <label className="flex flex-col gap-1 text-[0.74rem] font-bold text-(--gray-700)">
          Offlinium à échanger (solde : {formatAmount(balance)}{" "}
          {RESOURCE_ICONS.offlinium})
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={quote.maxOfflinium}
            className="min-h-11 w-full rounded-[10px] border border-(--gray-200) bg-(--surface) px-3 font-(--mono) text-[0.9rem] text-(--gray-900) outline-offset-1 focus:outline-2 focus:outline-(--accent-border)"
            value={amount || ""}
            placeholder="0"
            onChange={(event) => choose(Number(event.target.value) || 0)}
          />
        </label>

        <p
          className="m-0 rounded-xl bg-(--gray-50) p-3 text-center font-(--mono) text-[0.9rem] text-(--gray-900)"
          aria-live="polite"
        >
          {formatAmount(offlinium)} {RESOURCE_ICONS.offlinium} →{" "}
          {formatAmount(received)} {icon}
        </p>

        {isDepotFull ? (
          <p className="m-0 text-[0.74rem] text-(--warning-text)">
            Le dépôt est plein pour {RESOURCE_LABELS[resource].toLowerCase()} :
            améliorez-le pour en stocker davantage.
          </p>
        ) : (
          limitedByDepot && (
            <p className="m-0 text-[0.72rem] text-(--gray-500)">
              Le dépôt n&apos;a de place que pour{" "}
              {formatAmount(quote.freeCapacity)} {icon} : au plus{" "}
              {formatAmount(quote.maxOfflinium)} {RESOURCE_ICONS.offlinium}{" "}
              peuvent être échangés.
            </p>
          )
        )}
        {done && (
          <p
            className="m-0 text-[0.78rem] font-bold text-(--green-dark)"
            role="status"
          >
            {done}
          </p>
        )}
        <button
          type="button"
          className="min-h-11 cursor-pointer rounded-[10px] border-0 bg-(--accent-solid) px-4 text-[0.86rem] font-bold text-(--on-color) disabled:cursor-not-allowed disabled:opacity-40"
          disabled={received <= 0}
          onClick={() => {
            const got = exchangeOfflinium(resource, offlinium);
            if (got > 0) {
              setDone(
                `Échange fait : ${formatAmount(offlinium)} ${RESOURCE_ICONS.offlinium} contre ${formatAmount(got)} ${icon}.`,
              );
              setAmount(0);
            }
          }}
        >
          Échanger
        </button>
      </div>
    </PlanetSection>
  );
}
