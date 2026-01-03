import AdminScheduleDashboard from '@/components/admin/AdminScheduleDashboard';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <AdminScheduleDashboard params={params} />;
}
