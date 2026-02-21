import { useCallback, useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { useFocusEffect } from "expo-router";
import { api } from "@/convex/_generated/api";
import { useNetwork } from "@/hooks/use-network";
import * as db from "@/lib/db/queries";
import type { NoteWithSync } from "@/lib/types/note";

export const useNotes = () => {
  const { isOnline } = useNetwork();
  const convexNotes = useQuery(api.notes.list);
  const [cachedNotes, setCachedNotes] = useState<NoteWithSync[]>([]);
  const [isLoadingCache, setIsLoadingCache] = useState<boolean>(true);

  // reload cached notes on screen focus (picks up offline creates/edits/deletes)
  useFocusEffect(
    useCallback(() => {
      const loadCache = async () => {
        try {
          const notes = await db.getCachedNotes();
          setCachedNotes(notes);
        } catch (error) {
          console.error("[use-notes] failed to load cache:", error);
        } finally {
          setIsLoadingCache(false);
        }
      };

      loadCache();
    }, []),
  );

  // cache convex notes when they arrive
  useEffect(() => {
    if (convexNotes) {
      db.cacheNotes(convexNotes).then(() => {
        // re-read from cache to get the deserialized NoteWithSync objects
        return db.getCachedNotes();
      }).then((notes) => {
        setCachedNotes(notes);
      }).catch((error) => {
        console.error("[use-notes] failed to cache notes:", error);
      });
    }
  }, [convexNotes]);

  // when offline, always use cache (it has offline mutations and sync status)
  // when online, prefer convex data but add syncStatus: 'synced'
  let notes: NoteWithSync[];

  if (isOnline && convexNotes) {
    notes = convexNotes.map((note) => ({ ...note, syncStatus: "synced" as const }));
  } else {
    notes = cachedNotes;
  }

  const isLoading = convexNotes === undefined && isLoadingCache;

  return { notes, isLoading };
};
