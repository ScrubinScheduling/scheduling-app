import { redirect } from "next/navigation";

export default function RequestsIndexPage({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/workspaces/${params.id}/requests/shift`);
}