import Link from "next/link";
import {
  Calendar,
  LayoutDashboard,
  UsersRound,
  UserRoundCog,
  Send,
  Bell,
  Bolt,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { useParams } from "next/navigation";

export default function AppHeader() {
  const { id } = useParams<{ id: string }>();
  const href_dashboard = `/workspaces/${id}/admin/dashboard`;
  const href_team = `/workspaces/${id}/admin/team`;
  const href_roles = `/workspaces/${id}/roles`;
  const href_requests = `/workspaces/${id}/admin/requests`;
  
  return (
    <div className="w-full bg-white p-4 shadow flex-row justify-between items-center flex border-b-gray-500 border-b">
      {/* Left Header */}
      <div className="flex flex-row gap-4 items-center">
        <div className="p-2 rounded-2xl bg-[#3F37C9] border border-gray-200 shadow-md">
          <Calendar size={30} color="white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-black">Scrubin</h1>
          <p className="text-gray-500 text-sm">Fairlight Veterinary Services</p>
        </div>
        <div className="flex flex-row gap-4 ml-5">
          <Link href={href_dashboard} className="flex flex-row gap-2 items-center bg-gray-100 p-2 rounded-lg cursor-pointer hover:bg-gray-200">
            <LayoutDashboard size={20} color="gray" />
            <h1 className="text-gray-500 text-md">Dashboard</h1>
          </Link>
          <Link href={href_team} className="flex flex-row gap-2 items-center bg-gray-100 p-2 rounded-lg cursor-pointer hover:bg-gray-200">
            <UsersRound size={20} color="gray" />
            <h1 className="text-gray-500 text-md">Team</h1>
          </Link>
          <Link href={href_requests} className="flex flex-row gap-2 items-center bg-gray-100 p-2 rounded-lg cursor-pointer hover:bg-gray-200">
            <Send size={20} color="gray" />
            <h1 className="text-gray-500 text-md">Requests</h1>
          </Link>
        </div>
      </div>

      {/* Right Header */}
      <div className="flex flex-row gap-4 items-center">
        <button>
          <Bell size={24} color="gray" />
        </button>
        <button>
          <Bolt size={24} color="gray" />
        </button>
        <UserButton />
      </div>
    </div>
  );
}
