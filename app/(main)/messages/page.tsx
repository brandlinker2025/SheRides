import { MessagesInbox } from "@/components/messages/MessagesInbox";

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function MessagesRoute({
  searchParams,
}: {
  searchParams: Promise<{ c?: string | string[]; to?: string | string[] }>;
}) {
  const params = await searchParams;
  return <MessagesInbox queryId={firstParam(params.c)} toId={firstParam(params.to)} />;
}
