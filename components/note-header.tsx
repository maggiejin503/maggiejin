"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Input } from "./ui/input";
import Picker from "@emoji-mart/react";
import { useMobileDetect } from "./mobile-detector";
import { ChevronLeft, Lock, Globe, Save } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Icons } from "./icons";
import { getDisplayDateByCategory } from "@/lib/note-utils";
import { useAuth } from "./auth-provider";

export default function NoteHeader({
  note,
  saveNote,
  canEdit,
  onSave,
  isSaving,
}: {
  note: any;
  saveNote: (updates: Partial<typeof note>) => void;
  canEdit: boolean;
  onSave: () => void;
  isSaving: boolean;
}) {
  const isMobile = useMobileDetect();
  const pathname = usePathname();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [formattedDate, setFormattedDate] = useState("");
  const { user } = useAuth();

  const handleTogglePublic = () => {
    saveNote({ public: !note.public });
  };

  useEffect(() => {
    const displayDate = getDisplayDateByCategory(note.category, note.id);
    setFormattedDate(
      format(displayDate, "MMMM d, yyyy 'at' h:mm a")
    );
  }, [note.category, note.id]);

  const handleEmojiSelect = (emojiObject: any) => {
    const newEmoji = emojiObject.native;
    saveNote({ emoji: newEmoji });
    setShowEmojiPicker(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    saveNote({ title: e.target.value });
  };

  return (
    <>
      {isMobile && pathname !== "/notes" && (
        <Link href="/notes">
          <button className="pt-2 flex items-center">
            <Icons.back />
            <span className="text-[#e2a727] text-base ml-1">Notes</span>
          </button>
        </Link>
      )}
      <div className="px-2 mb-4 relative">
        <div className="flex justify-center items-center">
          <p className="text-muted-foreground text-xs">{formattedDate}</p>
          <div className="ml-2 h-6 flex items-center gap-2">
            {user && canEdit ? (
              <button
                onClick={handleTogglePublic}
                className="focus:outline-none"
                title={note.public ? "Make private" : "Make public"}
              >
                <Badge className="text-xs justify-center items-center cursor-pointer hover:opacity-80">
                  {note.public ? (
                    <>
                      <Globe className="w-3 h-3 mr-1" />
                      Public
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 mr-1" />
                      Private
                    </>
                  )}
                </Badge>
              </button>
            ) : (
              !note.public && (
                <Badge className="text-xs justify-center items-center">
                  <Lock className="w-3 h-3 mr-1" />
                  Private
                </Badge>
              )
            )}
            {user && (canEdit || note.public) && (
              <button
                onClick={onSave}
                disabled={isSaving}
                className="focus:outline-none"
                title="Save note"
              >
                <Badge className="text-xs justify-center items-center cursor-pointer hover:opacity-80">
                  <Save className="w-3 h-3 mr-1" />
                  {isSaving ? "Saving..." : "Save"}
                </Badge>
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center relative">
          {canEdit && (!note.public || user) && !isMobile ? (
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="cursor-pointer mr-2"
            >
              {note.emoji}
            </button>
          ) : (
            <span className="mr-2">{note.emoji}</span>
          )}
          {(note.public && !user) || !canEdit ? (
            <span className="text-2xl font-bold flex-grow py-2 leading-normal min-h-[50px]">
              {note.title}
            </span>
          ) : (
            <Input
              id="title"
              value={note.title}
              className="bg-background placeholder:text-muted-foreground text-2xl font-bold flex-grow py-2 leading-normal min-h-[50px]"
              placeholder="Your title here..."
              onChange={handleTitleChange}
              autoFocus={!note.title}
            />
          )}
        </div>
        {showEmojiPicker && !isMobile && (!note.public || user) && canEdit && (
          <div className="absolute top-full left-0 z-10">
            <Picker
              onEmojiSelect={handleEmojiSelect}
              autoFocus={true}
              searchPosition="top"
              onClickOutside={() => setShowEmojiPicker(false)}
            />
          </div>
        )}
      </div>
    </>
  );
}