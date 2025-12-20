import { cache } from "react";
import Note from "@/components/note";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createBrowserClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { Note as NoteType } from "@/lib/types";
import { cookies } from "next/headers";

// Use dynamic rendering to support authentication
export const dynamic = 'force-dynamic';

// Cached function to fetch a note by slug - eliminates duplicate fetches
const getNote = cache(async (slug: string) => {
  const supabase = createServerClient();
  const { data: note, error } = await supabase.rpc("select_note", {
    note_slug_arg: slug,
  }).single() as { data: NoteType | null; error: any };

  if (error) {
    console.error('[getNote] RPC error for slug:', slug, error);
  }
  if (!note) {
    console.log('[getNote] No note found for slug:', slug);
  }

  return note;
});

// Check if user has permission to access a note
async function canAccessNote(note: NoteType): Promise<boolean> {
  // Public notes: everyone can access
  if (note.public) {
    return true;
  }

  const supabase = createServerClient();

  // Check if user is authenticated (admin)
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    return true;
  }

  // Unauthenticated users: check session_id match
  const cookieStore = cookies();
  const sessionIdCookie = cookieStore.get('session_id');

  if (sessionIdCookie && sessionIdCookie.value === note.session_id) {
    return true;
  }

  return false;
}

// Dynamically determine if this is a user note
export async function generateStaticParams() {
  const supabase = createBrowserClient();
  const { data: posts } = await supabase
    .from("notes")
    .select("slug")
    .eq("public", true);

  return (posts || []).map(({ slug }) => ({
    slug,
  }));
}

// Use dynamic rendering for non-public notes
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const slug = params.slug.replace(/^notes\//, '');
  const note = await getNote(slug);

  if (!note) {
    return { title: "Note not found" };
  }

  // Check access permissions before showing metadata
  const hasAccess = await canAccessNote(note);

  if (!hasAccess) {
    return { title: "Note not found" }; // Don't leak note existence
  }

  const title = note.title || "new note";
  const emoji = note.emoji || "👋🏼";

  return {
    title: `maggie jin | ${title}`,
    openGraph: {
      images: [
        `/notes/api/og/?title=${encodeURIComponent(title)}&emoji=${encodeURIComponent(
          emoji
        )}`,
      ],
    },
  };
}

export default async function NotePage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params.slug.replace(/^notes\//, '');
  const note = await getNote(slug);

  if (!note) {
    return redirect("/notes/error");
  }

  // Check access permissions
  const hasAccess = await canAccessNote(note);

  if (!hasAccess) {
    return redirect("/notes/error"); // Show generic error
  }

  return (
    <div className="w-full min-h-dvh p-3">
      <Note note={note} />
    </div>
  );
}