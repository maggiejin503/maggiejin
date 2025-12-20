-- Add admin delete function that allows authenticated users to delete any note
CREATE OR REPLACE FUNCTION public.admin_delete_note(uuid_arg uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    DELETE FROM public.notes
    WHERE id = uuid_arg;
END;
$function$
;
