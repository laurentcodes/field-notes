import { ConvexReactClient } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getPendingMutations, removePendingMutation } from "@/lib/db/queries";
import { isOnline } from "@/lib/sync/network-monitor";

// process all pending mutations through convex
export const processPendingMutations = async (
  convex: ConvexReactClient,
): Promise<void> => {
  if (!isOnline()) {
    return;
  }

  const mutations = await getPendingMutations();

  if (mutations.length === 0) {
    return;
  }

  console.log(`[offline-sync] processing ${mutations.length} pending mutations`);

  for (const mutation of mutations) {
    try {
      switch (mutation.type) {
        case "create":
          await convex.mutation(api.notes.create, {
            title: mutation.payload.title as string,
            body: mutation.payload.body as string,
            tags: mutation.payload.tags as string[],
          });
          break;

        case "update":
          await convex.mutation(api.notes.update, {
            id: mutation.payload.id as any,
            title: mutation.payload.title as string | undefined,
            body: mutation.payload.body as string | undefined,
            tags: mutation.payload.tags as string[] | undefined,
          });
          break;

        case "remove":
          await convex.mutation(api.notes.remove, {
            id: mutation.payload.id as any,
          });
          break;
      }

      await removePendingMutation(mutation.id);
      console.log(`[offline-sync] synced mutation ${mutation.id} (${mutation.type})`);
    } catch (error) {
      console.error(`[offline-sync] failed to sync mutation ${mutation.id}:`, error);
      // stop processing on failure to preserve order
      break;
    }
  }
};
