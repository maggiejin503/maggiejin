"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import NoteHeader from "./note-header";
import NoteContent from "./note-content";
import SessionId from "./session-id";
import { useState, useCallback, useRef, useContext } from "react";
import { SessionNotesContext } from "@/app/notes/session-notes";

export default function Note({ note: initialNote }: { note: any }) {
  const supabase = createClient();
  const router = useRouter();
  const [note, setNote] = useState(initialNote);
  const [sessionId, setSessionId] = useState("");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Partial<typeof note>>({});
  const noteRef = useRef(initialNote);

  const { refreshSessionNotes } = useContext(SessionNotesContext);

  const [isSaving, setIsSaving] = useState(false);

  const saveToDatabase = useCallback(async () => {
    console.log("saveToDatabase called", {
      noteId: noteRef.current.id,
      sessionId,
      pendingUpdates: pendingUpdatesRef.current
    });

    if (!noteRef.current.id || !sessionId || Object.keys(pendingUpdatesRef.current).length === 0) {
      console.log("saveToDatabase returning early");
      return;
    }

    setIsSaving(true);
    try {
      const updatesToSave = pendingUpdatesRef.current;
      const currentNote = noteRef.current;

      console.log("Saving updates:", updatesToSave);

      // Clear pending updates before making calls
      pendingUpdatesRef.current = {};

      // Make RPC calls only for fields that were actually updated
      const promises = [];

      if ('title' in updatesToSave) {
        promises.push(
          supabase.rpc("update_note_title", {
            uuid_arg: currentNote.id,
            session_arg: sessionId,
            title_arg: updatesToSave.title,
          })
        );
      }
      if ('emoji' in updatesToSave) {
        promises.push(
          supabase.rpc("update_note_emoji", {
            uuid_arg: currentNote.id,
            session_arg: sessionId,
            emoji_arg: updatesToSave.emoji,
          })
        );
      }
      if ('content' in updatesToSave) {
        promises.push(
          supabase.rpc("update_note_content", {
            uuid_arg: currentNote.id,
            session_arg: sessionId,
            content_arg: updatesToSave.content,
          })
        );
      }
      if ('public' in updatesToSave) {
        const { error } = await supabase
          .from("notes")
          .update({ public: updatesToSave.public })
          .eq("id", currentNote.id);

        if (error) {
          console.error("Error updating public status:", error);
          throw error;
        }
        console.log("Public status updated to:", updatesToSave.public);
      }

      // Execute all other updates in parallel
      if (promises.length > 0) {
        await Promise.all(promises);
      }

      // Only revalidate and refresh if we didn't update the public status
      // (to avoid fetching stale cached data)
      if (!('public' in updatesToSave)) {
        await fetch("/notes/revalidate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-revalidate-token": process.env.NEXT_PUBLIC_REVALIDATE_TOKEN || '',
          },
          body: JSON.stringify({ slug: currentNote.slug }),
        });
        router.refresh();
      }

      refreshSessionNotes();
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  }, [supabase, router, refreshSessionNotes, sessionId]);

  const saveNote = useCallback(
    async (updates: Partial<typeof note>) => {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Update local state immediately (optimistic update)
      setNote((prevNote: typeof note) => {
        const updatedNote = { ...prevNote, ...updates };
        noteRef.current = updatedNote;
        return updatedNote;
      });

      // Accumulate all pending updates
      pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };

      // Set new timeout to batch save all pending updates
      saveTimeoutRef.current = setTimeout(saveToDatabase, 500);
    },
    [saveToDatabase]
  );

  const handleSaveClick = useCallback(() => {
    // Clear any pending timeout and save immediately
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveToDatabase();
  }, [saveToDatabase]);

  const canEdit = sessionId === note.session_id;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <SessionId setSessionId={setSessionId} />
      <NoteHeader
        note={note}
        saveNote={saveNote}
        canEdit={canEdit}
        onSave={handleSaveClick}
        isSaving={isSaving}
      />
      <NoteContent note={note} saveNote={saveNote} canEdit={canEdit} />
    </div>
  );
}