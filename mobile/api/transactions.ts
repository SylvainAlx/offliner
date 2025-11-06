import { z } from "zod";
import { showMessage } from "@/utils/formatNotification";
import { Session } from "@supabase/supabase-js";
import { getDeviceId } from "./devices";
import { supabase } from "@/utils/supabase";

const TransactionSchema = z.object({
  user_id: z.string(),
  device_id: z.number().nullable(),
  type: z.enum(["pool_adjust", "deposit", "mining"]),
  amount: z.number(),
  target: z.enum(["pool", "user"]),
  direction: z.enum(["in", "out"]),
});

type TransactionDB = z.infer<typeof TransactionSchema>;
type InsertTransactionProps = {
  session: Session;
  deviceName: string;
} & Pick<TransactionDB, "type" | "amount" | "target" | "direction">;

export async function InsertTransaction({
  session,
  deviceName,
  type,
  amount,
  target,
  direction,
}: InsertTransactionProps) {
  try {
    const device = await getDeviceId(session, deviceName);
    if (!device) throw new Error("Appareil non reconnu");

    const transactionData: TransactionDB = {
      user_id: session.user.id as string,
      device_id: device.id,
      type,
      amount,
      target,
      direction,
    };

    // validation
    const parsed = TransactionSchema.safeParse(transactionData);
    if (!parsed.success) {
      // 1) format "plat" pour renvoyer au front ou manipuler programme.
      const flattened = z.flattenError(parsed.error);
      // flattened.fieldErrors: Record<string, string[]>
      // flattened.formErrors: string[]

      // 2) version lisible pour logs / notifications
      const pretty = z.prettifyError(parsed.error);

      console.error("Validation transaction (pretty):\n", pretty);
      // si tu veux logger structure programmatiquement :
      console.debug("Validation transaction (flat):", flattened);

      // renvoyer message utile côté utilisateur
      throw new Error(
        "Données de transaction invalides : " +
          (flattened.formErrors.length
            ? flattened.formErrors.join(", ")
            : Object.entries(flattened.fieldErrors)
                .flatMap(([k, arr]) => arr.map((m) => `${k}: ${m}`))
                .join("; ")),
      );
    }

    // insert avec les données validées
    const { error: insertError } = await supabase
      .from("transactions")
      .insert([parsed.data]);

    // console.log("Session user ID:", session.user.id);

    // console.log({ data, error });

    if (insertError) throw insertError;

    return { success: true };
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      showMessage(error.message, "error", "Erreur");
    }
    return { success: false };
  }
}
