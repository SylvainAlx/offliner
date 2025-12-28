import React from "react";
import { Users } from "lucide-react";

interface TeamRanking {
  id: string;
  name: string;
  member_count: number;
  invite_code: string;
  total_duration: number;
  formatted_total_duration?: string;
}

interface Props {
  data: TeamRanking[];
}

const TeamRankingTable: React.FC<Props> = ({ data }) => {
  const getMedal = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return "";
  };

  return (
    <div className="overflow-x-auto w-full max-w-5xl mt-4 border border-primary/20 rounded-xl overflow-hidden shadow-2xl">
      <table className="table w-full text-base bg-secondary/10 backdrop-blur-md">
        <thead className="bg-[#00abff] text-white">
          <tr>
            <th className="text-right p-4">Rang</th>
            <th className="p-4">Équipe</th>
            <th className="text-right p-4">Membres</th>
            <th className="text-right p-4">Code d&apos;invitation</th>
            <th className="text-right whitespace-nowrap p-4">
              Durée totale cumulée
            </th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((team, index) => (
              <tr
                key={team.id}
                className="hover:bg-secondary/20 border-b border-primary/10 last:border-0 transition-colors [&>td]:whitespace-nowrap"
              >
                <th className="text-right p-4 flex items-center justify-end gap-2">
                  <span className="text-lg">{getMedal(index)}</span> {index + 1}
                </th>
                <td className="p-4">
                  <a
                    href={`/teams/${encodeURIComponent(team.id)}`}
                    className="text-[#00abff] font-bold hover:underline transition-all"
                  >
                    {team.name}
                  </a>
                </td>
                <td className="text-right p-4 font-semibold">
                  <div className="flex items-center justify-end gap-2">
                    {team.member_count} <Users className="w-4 h-4 opacity-70" />
                  </div>
                </td>
                <td className="text-right p-4 text-[#ffffa8] font-mono">
                  {team.invite_code}
                </td>
                <td className="text-right p-4 text-[#ffffa8] font-mono">
                  {team.formatted_total_duration || "0s"}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-center p-12 opacity-50 italic">
                Aucune équipe trouvée.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TeamRankingTable;
