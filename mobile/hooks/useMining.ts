import { getCreditPool } from "@/api/config";
import { useSession } from "@/contexts/SessionContext";
import { useEffect, useState } from "react";

export default function UseMining() {
  const [miningCapacity, setMiningCapacity] = useState<number | null>(null);
  const { dailySyncSeconds } = useSession();

  useEffect(() => {
    const fetchMiningCapacity = async () => {
      const result = await getCreditPool();
      setMiningCapacity(parseInt(result));
    };
    fetchMiningCapacity();
  }, []);

  return { miningCapacity, dailySyncSeconds };
}
