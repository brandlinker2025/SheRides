alter table public.messages add column if not exists audio_path text;
alter table public.messages add column if not exists audio_duration_seconds integer;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('message-audio', 'message-audio', true, 10485760, array['audio/webm','audio/mp4','audio/mpeg','audio/ogg','audio/wav'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Members upload message audio" on storage.objects;
create policy "Members upload message audio" on storage.objects for insert to authenticated
with check (bucket_id = 'message-audio' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Members delete own message audio" on storage.objects;
create policy "Members delete own message audio" on storage.objects for delete to authenticated
using (bucket_id = 'message-audio' and (storage.foldername(name))[1] = auth.uid()::text);
