alter table public.messages drop constraint if exists messages_payload_valid;

alter table public.messages add constraint messages_payload_valid check (
  ((content is not null) and (char_length(content) between 1 and 5000))
  or image_url is not null
  or audio_path is not null
) not valid;
