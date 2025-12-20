"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Textarea } from "./ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Note } from "@/lib/types";
import { useAuth } from "./auth-provider";
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Strikethrough,
  Link,
  CheckSquare
} from "lucide-react";

export default function NoteContent({
  note,
  saveNote,
  canEdit,
}: {
  note: Note;
  saveNote: (updates: Partial<Note>) => void;
  canEdit: boolean;
}) {
  const [isEditing, setIsEditing] = useState(!note.content && canEdit);
  const { user } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    saveNote({ content: e.target.value });
  }, [saveNote]);

  const wrapSelectedText = useCallback((before: string, after: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    const newText = beforeText + before + selectedText + after + afterText;
    saveNote({ content: newText });

    // Set cursor position after the formatting
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [saveNote]);

  const insertAtCursor = useCallback((text: string, moveCursor: number = 0) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    const newText = beforeText + text + afterText;
    saveNote({ content: newText });

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + text.length - moveCursor;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [saveNote]);

  const insertLink = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    // Prompt for link text
    const linkText = window.prompt('Enter text to display:', selectedText || '');
    if (!linkText) return; // User cancelled

    // Prompt for URL
    const url = window.prompt('Enter URL:', 'https://');
    if (!url) return; // User cancelled

    const markdown = `[${linkText}](${url})`;

    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);
    const newText = beforeText + markdown + afterText;

    saveNote({ content: newText });

    setTimeout(() => {
      textarea.focus();
      // Move cursor after the link
      const newCursorPos = start + markdown.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [saveNote]);

  const insertLinePrefix = useCallback((prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;

    // Find the start of the current line
    let lineStart = start;
    while (lineStart > 0 && value[lineStart - 1] !== '\n') {
      lineStart--;
    }

    // Find the end of the selection or current line
    let lineEnd = end;
    while (lineEnd < value.length && value[lineEnd] !== '\n') {
      lineEnd++;
    }

    const beforeLines = value.substring(0, lineStart);
    const selectedLines = value.substring(lineStart, lineEnd);
    const afterLines = value.substring(lineEnd);

    // Split into lines and add prefix to each
    const lines = selectedLines.split('\n');
    const newLines = lines.map(line => {
      // Check if line already has the prefix
      if (line.startsWith(prefix)) {
        return line; // Already has prefix
      }
      return prefix + line;
    });

    const newText = beforeLines + newLines.join('\n') + afterLines;
    saveNote({ content: newText });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart, lineStart + newLines.join('\n').length);
    }, 0);
  }, [saveNote]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.metaKey || e.ctrlKey) {
      if (e.key === 'b') {
        e.preventDefault();
        wrapSelectedText('**', '**');
      } else if (e.key === 'i') {
        e.preventDefault();
        wrapSelectedText('*', '*');
      } else if (e.key === 'u') {
        e.preventDefault();
        wrapSelectedText('<u>', '</u>');
      } else if (e.key === 'k') {
        e.preventDefault();
        insertLink();
      } else if (e.key === 'e') {
        e.preventDefault();
        wrapSelectedText('`', '`');
      }
    }
  }, [wrapSelectedText, insertLink]);

  const handleMarkdownCheckboxChange = useCallback((taskText: string, isChecked: boolean) => {
    const updatedContent = note.content.replace(
      new RegExp(`\\[[ x]\\] ${taskText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'),
      `[${isChecked ? 'x' : ' '}] ${taskText}`
    );
    saveNote({ content: updatedContent });
  }, [note.content, saveNote]);

  const renderListItem = useCallback(({ children, ...props }: any) => {
    if (!props.className?.includes('task-list-item')) return <li {...props}>{children}</li>;

    const checkbox = children.find((child: any) => child.type === 'input');
    if (!checkbox) return <li {...props}>{children}</li>;

    const isChecked = checkbox.props.checked;
    const taskContent = children.filter((child: any) => child !== checkbox);
    const taskText = taskContent.map((child: any) => {
      if (typeof child === 'string') return child;
      if (child.type === 'a') return `[${child.props.children}](${child.props.href})`;
      return child.props.children;
    }).join('').trim();

    const taskId = `task-${taskText.substring(0, 20).replace(/\s+/g, '-').toLowerCase()}-${props.index}`;

    const handleCheckboxClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (canEdit) handleMarkdownCheckboxChange(taskText, !isChecked);
    };

    return (
      <li {...props}>
        <span className="flex items-start">
          <span
            onClick={handleCheckboxClick}
            className={`${canEdit ? 'cursor-pointer' : 'cursor-default'} mr-1`}
          >
            <input
              type="checkbox"
              checked={isChecked}
              className="pointer-events-none"
              id={taskId}
              readOnly
            />
          </span>
          <span>{taskContent}</span>
        </span>
      </li>
    );
  }, [canEdit, handleMarkdownCheckboxChange]);

  const renderLink = useCallback((props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    return (
      <a {...props} target="_blank" rel="noopener noreferrer">
        {props.children}
      </a>
    );
  }, []);

  const FormattingButton = ({ onClick, icon: Icon, title }: { onClick: () => void; icon: any; title: string }) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      onMouseDown={(e) => e.preventDefault()} // Prevent blur
      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="px-2">
      {(isEditing && canEdit) || (!note.content && canEdit) ? (
        <div>
          {/* Formatting Toolbar */}
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 py-2 mb-2 flex flex-wrap gap-1">
            <FormattingButton onClick={() => wrapSelectedText('**', '**')} icon={Bold} title="Bold (Cmd+B)" />
            <FormattingButton onClick={() => wrapSelectedText('*', '*')} icon={Italic} title="Italic (Cmd+I)" />
            <FormattingButton onClick={() => wrapSelectedText('<u>', '</u>')} icon={Underline} title="Underline (Cmd+U)" />
            <FormattingButton onClick={() => wrapSelectedText('~~', '~~')} icon={Strikethrough} title="Strikethrough" />
            <div className="w-px bg-gray-300 dark:bg-gray-700 mx-1" />
            <FormattingButton onClick={() => insertLinePrefix('# ')} icon={Heading1} title="Heading 1" />
            <FormattingButton onClick={() => insertLinePrefix('## ')} icon={Heading2} title="Heading 2" />
            <FormattingButton onClick={() => insertLinePrefix('### ')} icon={Heading3} title="Heading 3" />
            <div className="w-px bg-gray-300 dark:bg-gray-700 mx-1" />
            <FormattingButton onClick={() => insertLinePrefix('- ')} icon={List} title="Bullet List" />
            <FormattingButton onClick={() => insertLinePrefix('1. ')} icon={ListOrdered} title="Numbered List" />
            <FormattingButton onClick={() => insertLinePrefix('- [ ] ')} icon={CheckSquare} title="Task List" />
            <div className="w-px bg-gray-300 dark:bg-gray-700 mx-1" />
            <FormattingButton onClick={() => wrapSelectedText('`', '`')} icon={Code} title="Inline Code (Cmd+E)" />
            <FormattingButton onClick={insertLink} icon={Link} title="Link (Cmd+K)" />
          </div>
          <Textarea
            ref={textareaRef}
            id="note-content"
            value={note.content || ""}
            className="min-h-dvh focus:outline-none leading-normal"
            placeholder="Start writing..."
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsEditing(true)}
            onBlur={(e) => {
              // Only blur if clicking outside the editor area (not on toolbar buttons)
              if (!e.relatedTarget?.closest('.px-2')) {
                setIsEditing(false);
              }
            }}
          />
        </div>
      ) : (
        <div
          className="h-full text-base md:text-sm"
          onClick={(e) => {
            if (canEdit && (!note.public || user)) {
              setIsEditing(true);
            }
          }}
        >
          <ReactMarkdown
            className="markdown-body min-h-dvh"
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              li: renderListItem,
              a: renderLink,
            }}
          >
            {note.content || "Start writing..."}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}