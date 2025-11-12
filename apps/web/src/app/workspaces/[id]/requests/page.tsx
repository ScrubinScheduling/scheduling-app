import { redirect } from "next/navigation";

export default function RequestsIndexPage({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/workspace/${params.id}/requests/shift`);
}