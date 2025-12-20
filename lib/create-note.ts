import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/components/ui/use-toast";

export async function createNote(
  sessionId: string | null,
  router: any,
  addNewPinnedNote: (slug: string) => void,
  refreshSessionNotes: () => Promise<void>,
  setSelectedNoteSlug: (slug: string | null) => void,
  isMobile: boolean
) {
  const supabase = createClient();
  const noteId = uuidv4();
  const slug = `new-note-${noteId}`;

  console.log('[createNote] sessionId:', sessionId);

  const note = {
    id: noteId,
    slug: slug,
    title: "",
    content: "",
    public: false,
    created_at: new Date().toISOString(),
    session_id: sessionId,
    category: "today",
    emoji: "👋🏼",
  };

  console.log('[createNote] Creating note:', note);

  try {
    const { error } = await supabase.from("notes").insert(note);

    console.log('[createNote] Insert result - error:', error);

    if (error) throw error;

    addNewPinnedNote(slug);

    if (!isMobile) {
      refreshSessionNotes().then(() => {
        setSelectedNoteSlug(slug);
        router.push(`/notes/${slug}`);
        router.refresh();
      });
    } else {
      router.push(`/notes/${slug}`).then(() => {
        refreshSessionNotes();
        setSelectedNoteSlug(slug);
      });
    }

    toast({
      description: "Private note created",
    });
  } catch (error) {
    console.error("Error creating note:", error);
    toast({
      description: `Error creating note: ${error instanceof Error ? error.message : 'Unknown error'}`,
      variant: "destructive"
    });
  }
}
