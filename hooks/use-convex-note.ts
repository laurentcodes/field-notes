import { useCallback, useState } from "react";
import { useQuery } from "convex/react";
import { useFocusEffect } from "expo-router";
import { api } from "@/convex/_generated/api";
import { useNetwork } from "@/hooks/use-network";
import * as db from "@/lib/db/queries";
import type { NoteWithSync, NoteId } from "@/lib/types/note";

export const useConvexNote = (id: string) => {
  const { isOnline } = useNetwork();
  const convexNote = useQuery(api.notes.get, { id: id as NoteId });
  const [cachedNote, setCachedNote] = useState<NoteWithSync | null>(null);
  const [isLoadingCache, setIsLoadingCache] = useState<boolean>(true);

  // reload cached note on screen focus
  useFocusEffect(
    useCallback(() => {
      const loadCache = async () => {
        try {
          const note = await db.getCachedNote(id);
          setCachedNote(note);
        } catch (error) {
          console.error("[use-note] failed to load cache:", error);
        } finally {
          setIsLoadingCache(false);
        }
      };

      loadCache();
    }, [id]),
  );

  // when offline, always use cache (it has sync status)
  // when online, prefer convex data with syncStatus: 'synced'
  let note: NoteWithSync | null;

  if (isOnline && convexNote !== undefined) {
    note = convexNote ? { ...convexNote, syncStatus: "synced" as const } : null;
  } else {
    note = cachedNote;
  }

  const isLoading = convexNote === undefined && isLoadingCache;

  return { note, isLoading };
};
