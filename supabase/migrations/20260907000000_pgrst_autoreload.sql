-- Recarrega o cache de schema do PostgREST automaticamente após DDLs

CREATE OR REPLACE FUNCTION public.pgrst_watch()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$;

DROP EVENT TRIGGER IF EXISTS pgrst_schema_update;
CREATE EVENT TRIGGER pgrst_schema_update
  ON ddl_command_end
  EXECUTE FUNCTION public.pgrst_watch();
