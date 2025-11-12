"use client";
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CalendarDays,
  ArrowLeftRight,
  Check,
  X,
} from "lucide-react";

/* ==================== Types ==================== */

type RequestStatus = "pending" | "approved" | "denied";

type RequestBase = {
  id: string;
  createdAt: string; // ISO
  status: RequestStatus;
};

type TimeOffRequest = RequestBase & {
  kind: "timeoff";
  requesterNames: string[]; // one or more employees
  dateRange: { start: string; end: string }; // ISO dates
  reason?: string;
};

type TradeRequest = RequestBase & {
  kind: "trade";
  // A proposes swapping with B
  from: { name: string; date: string; start: string; end: string };
  to: { name: string; date: string; start: string; end: string };
};

type AnyRequest = TimeOffRequest | TradeRequest;

/* ==================== Mock data ==================== */

const MOCK: AnyRequest[] = [
  {
    id: "r1",
    kind: "timeoff",
    requesterNames: ["Alice Carter"],
    createdAt: "2025-11-10T09:00:00Z",
    status: "pending",
    dateRange: { start: "2025-12-05", end: "2025-12-07" },
    reason: "Family trip",
  },
  {
    id: "r2",
    kind: "trade",
    createdAt: "2025-11-10T12:30:00Z",
    status: "pending",
    from: { name: "Bob Ito", date: "2025-12-03", start: "09:00", end: "17:00" },
    to:   { name: "Jonny Bravo", date: "2025-12-04", start: "10:00", end: "18:00" },
  },
  {
    id: "r3",
    kind: "timeoff",
    requesterNames: ["David Suzuki"],
    createdAt: "2025-11-09T18:15:00Z",
    status: "pending",
    dateRange: { start: "2025-12-10", end: "2025-12-10" },
    reason: "Appointment",
  },
  {
    id: "r4",
    kind: "trade",
    createdAt: "2025-11-08T15:00:00Z",
    status: "pending",
    from: { name: "Adam Eve", date: "2025-12-01", start: "07:00", end: "15:00" },
    to:   { name: "Reggie Watts", date: "2025-12-02", start: "08:00", end: "16:00" },
  },
];

/* ==================== Component ==================== */

export default function ShiftRequestsPage() {
  const [requests, setRequests] = React.useState<AnyRequest[]>(
    () => MOCK.filter((r) => r.status === "pending")
  );
  const [selectedId, setSelectedId] = React.useState<string>(MOCK[0]?.id ?? "");
  const selected = React.useMemo(
    () => requests.find((r) => r.id === selectedId),
    [requests, selectedId]
  );
  

  // Confirmation dialog state
  const [confirm, setConfirm] = React.useState<{
    open: boolean;
    action: "approve" | "deny" | null;
  }>({ open: false, action: null });

  function openConfirm(action: "approve" | "deny") {
    setConfirm({ open: true, action });
  }
  function closeConfirm() {
    setConfirm({ open: false, action: null });
  }

  function applyDecision() {
  if (!selected || !confirm.action) return;

  // compute next list & next selection based on current state
  const idx = requests.findIndex((r) => r.id === selected.id);
  const nextRequests = requests.filter((r) => r.id !== selected.id);
  const nextSelected =
    nextRequests[idx]?.id ?? nextRequests[idx - 1]?.id ?? "";

  setRequests(nextRequests);
  setSelectedId(nextSelected);
  closeConfirm();
}

  // Helpers
  function fmtRange(range: { start: string; end: string }) {
    const s = new Date(range.start);
    const e = new Date(range.end);
    return `${s.toLocaleDateString()} - ${e.toLocaleDateString()}`;
  }

  function statusChip(status: RequestStatus) {
    const map: Record<RequestStatus, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      denied: "bg-red-100 text-red-800",
    };
    return (
      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}>
        {status}
      </span>
    );
  }

  return (
    <div className="flex min-h-[640px]">
      {/* Left pane: request list */}
      <aside className="w-1/2 border-r border-gray-200 p-4">
        <h2 className="mb-3 text-lg font-semibold text-gray-800">Requests</h2>

        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="mt-10 text-center text-gray-500 italic">
              There are currently no requests!
            </div>
          ) : (
            requests.map((req) => {
              const isSelected = req.id === selectedId;
              const baseCard =
                "cursor-pointer rounded-xl border p-3 transition-shadow hover:shadow-sm";
              const selectedRing = isSelected ? "border-gray-900 shadow-sm" : "border-gray-200";

              return (
                <div
                  key={req.id}
                  className={`${baseCard} ${selectedRing} bg-white`}
                  onClick={() => setSelectedId(req.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: icon + title */}
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-gray-100 p-2">
                        {req.kind === "timeoff" ? (
                          <CalendarDays size={18} />
                        ) : (
                          <ArrowLeftRight size={18} />
                        )}
                      </div>

                      <div className="flex flex-col">
                        {req.kind === "timeoff" ? (
                          <>
                            <div className="text-sm font-medium text-gray-900">
                              {req.requesterNames.join(", ")}
                            </div>
                            <div className="text-xs text-gray-600">
                              Time off · {fmtRange(req.dateRange)}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm font-medium text-gray-900">
                              Trade: {req.from.name} ↔ {req.to.name}
                            </div>
                            <div className="text-xs text-gray-600">
                              {req.from.date} ({req.from.start}-{req.from.end}) ↔ {req.to.date} ({req.to.start}-{req.to.end})
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: status */}
                    {statusChip(req.status)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Right pane: details */}
      <section className="w-1/2 p-4">
        <h2 className="mb-3 text-lg font-semibold text-gray-800">Details</h2>

        {!selected ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
            Select a request to see details
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-gray-100 p-2">
                  {selected.kind === "timeoff" ? (
                    <CalendarDays size={18} />
                  ) : (
                    <ArrowLeftRight size={18} />
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  Created {new Date(selected.createdAt).toLocaleString()}
                </div>
              </div>
              {statusChip(selected.status)}
            </div>

            {/* Body */}
            {selected.kind === "timeoff" ? (
              <div className="space-y-2">
                <div className="text-base font-semibold text-gray-900">
                  {selected.requesterNames.join(", ")}
                </div>
                <div className="text-sm text-gray-700">
                  Date range: {fmtRange(selected.dateRange)}
                </div>
                {selected.reason ? (
                  <div className="text-sm text-gray-700">Reason: {selected.reason}</div>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">{selected.from.name}</span> → {selected.from.date} ({selected.from.start}-{selected.from.end})
                </div>
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">{selected.to.name}</span> → {selected.to.date} ({selected.to.start}-{selected.to.end})
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-2">
              {/* Deny */}
              <button
                type="button"
                onClick={() => openConfirm("deny")}
                className="inline-flex items-center gap-2 rounded-lg border bg-red-500 px-4 py-2 text-sm font-medium text-black hover:bg-red-700"
              >
                <X size={16} /> Deny
              </button>

              {/* Approve */}
              <button
                type="button"
                onClick={() => openConfirm("approve")}
                className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                <Check size={16} /> Approve
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Confirmation dialog */}
      <AlertDialog open={confirm.open} onOpenChange={(o) => !o && closeConfirm()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold">
              {confirm.action === "approve" ? "Approve request?" : "Deny request?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700">
              {confirm.action === "approve"
                ? "This will mark the request as approved. You can change it later, but it may affect scheduling."
                : "This will mark the request as denied. You can change it later if needed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirm} className="hover:bg-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={applyDecision}
              className={
                confirm.action === "approve"
                  ? "bg-green-500 hover:bg-green-700"
                  : "bg-red-500 hover:bg-red-700"
              }
            >
              <span className="text-black">
                {confirm.action === "approve" ? "Confirm approve" : "Confirm deny"}
              </span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
