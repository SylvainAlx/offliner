import React, { useState } from "react";
import { Globe, CalendarCheck, Search } from "lucide-react";

interface UserRanking {
  username: string;
  total_duration: number;
  country: string | null;
  region: string | null;
  subregion: string | null;
  team_id: string | null;
  teams?: { name: string } | null;
  formatted_total_duration?: string;
  total_duration_num?: number;
}

interface Props {
  initialGlobalData: UserRanking[];
  initialWeeklyData: UserRanking[];
}

const RankingTable: React.FC<Props> = ({
  initialGlobalData,
  initialWeeklyData,
}) => {
  const [currentTab, setCurrentTab] = useState<"global" | "weekly">("global");

  const currentData =
    currentTab === "global" ? initialGlobalData : initialWeeklyData;

  const getMedal = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return "";
  };

  return (
    <div className="w-full flex flex-col items-center gap-6">
      {/* Tabs */}
      <div className="w-full max-w-5xl flex justify-center gap-4">
        <button
          onClick={() => setCurrentTab("global")}
          className={`cursor-pointer inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-semibold text-base transition-all duration-200 ease-in-out min-h-[48px] hover:-translate-y-0.5 active:scale-95 ${
            currentTab === "global"
              ? "bg-[#ffffa8] text-gray-900 shadow-[0_4px_15px_rgba(255,137,255,0.3)]"
              : "border border-primary/20 bg-secondary/10 text-primary hover:bg-secondary/20"
          }`}
        >
          <Globe className="w-5 h-5" />
          Top 100 mondial
        </button>
        <button
          onClick={() => setCurrentTab("weekly")}
          className={`cursor-pointer inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-semibold text-base transition-all duration-200 ease-in-out min-h-[48px] hover:-translate-y-0.5 active:scale-95 ${
            currentTab === "weekly"
              ? "bg-[#ffffa8] text-gray-900 shadow-[0_4px_15px_rgba(255,255,168,0.3)]"
              : "border border-primary/20 bg-secondary/10 text-primary hover:bg-secondary/20"
          }`}
        >
          <CalendarCheck className="w-5 h-5" />
          Top 100 hebdomadaire (ligue)
        </button>
      </div>

      <div className="overflow-x-auto w-full max-w-5xl mt-4 border border-primary/20 rounded-xl overflow-hidden shadow-2xl">
        <table className="table w-full text-base bg-secondary/10 backdrop-blur-md">
          <thead className="bg-[#ff89ff] text-black">
            <tr>
              <th className="text-right p-4">Rang</th>
              <th className="p-4">Pseudo</th>
              <th className="p-4">Équipe</th>
              <th className="text-right whitespace-nowrap p-4">Durée totale</th>
              <th className="p-4">Pays</th>
              <th className="p-4">Région</th>
              <th className="p-4">Département</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length > 0 ? (
              currentData.map((user, index) => (
                <tr
                  key={user.username}
                  className="hover:bg-secondary/20 border-b border-primary/10 last:border-0 transition-colors"
                >
                  <th className="text-right p-4 flex items-center justify-end gap-2">
                    <span className="text-lg">{getMedal(index)}</span>{" "}
                    {index + 1}
                  </th>
                  <td className="p-4">
                    <a
                      href={`/users/${encodeURIComponent(user.username)}`}
                      className="text-[#ff89ff] font-bold hover:underline transition-all"
                    >
                      {user.username}
                    </a>
                  </td>
                  <td className="p-4">
                    {user.team_id ? (
                      <a
                        href={`/teams/${encodeURIComponent(user.team_id)}`}
                        className="text-[#00abff] font-bold hover:underline"
                      >
                        {user.teams?.name || user.team_id}
                      </a>
                    ) : (
                      <span className="opacity-50">-</span>
                    )}
                  </td>
                  <td className="text-right p-4 text-[#ffffa8] font-mono">
                    {user.formatted_total_duration || "0s"}
                  </td>
                  <td className="p-4">
                    {user.country || <span className="opacity-50">-</span>}
                  </td>
                  <td className="p-4">
                    {user.region || <span className="opacity-50">-</span>}
                  </td>
                  <td className="p-4">
                    {user.subregion || <span className="opacity-50">-</span>}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center p-12 opacity-50 italic">
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RankingTable;
