-- Add admin update functions that allow authenticated users to update any note

CREATE OR REPLACE FUNCTION public.admin_update_note_title(uuid_arg uuid, title_arg text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.notes
    SET title = title_arg
    WHERE id = uuid_arg;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_update_note_emoji(uuid_arg uuid, emoji_arg text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.notes
    SET emoji = emoji_arg
    WHERE id = uuid_arg;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_update_note_content(uuid_arg uuid, content_arg text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.notes
    SET content = content_arg
    WHERE id = uuid_arg;
END;
$function$
;
