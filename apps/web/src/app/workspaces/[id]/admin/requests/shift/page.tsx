'use client';
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { CalendarDays, ArrowLeftRight, ArrowRight, Check, X } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useParams } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_BASE_URL as string;

/**** Types ****/

type RequestStatus = 'pending' | 'approved' | 'denied';

type RequestBase = {
  id: string;
  status: RequestStatus;
};

type TimeOffRequest = RequestBase & {
  kind: 'timeoff';
  requesterNames: string[]; // one or more employees
  dateRange: { start: string; end: string }; // ISO dates
  reason?: string;
};

type TradeRequest = RequestBase & {
  kind: 'trade';
  // A proposes swapping with B
  from: { name: string; date: string; start: string; end: string };
  to: { name: string; date: string; start: string; end: string };
};

type CoverRequest = RequestBase & {
  kind: 'cover';
  from: { name: string; date: string; start: string; end: string };
  coverer: { name: string };
};

type AnyRequest = TimeOffRequest | TradeRequest | CoverRequest;

/**** Component ****/

export default function ShiftRequestsPage() {
  // Data + selection
  const [requests, setRequests] = React.useState<AnyRequest[]>([]);
  const [selectedId, setSelectedId] = React.useState<string>('');

  // UX state
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  // Clerk + route params
  const { getToken } = useAuth();
  const { id } = useParams<{ id: string }>();
  const selected = React.useMemo(
    () => requests.find((r) => r.id === selectedId),
    [requests, selectedId]
  );

  React.useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const token = await getToken();
        const headers: HeadersInit = {
          Authorization: `Bearer ${token}`
        };

        // Fetch trade/cover requests and time off requests in parallel
        const [tradeRes, timeoffRes] = await Promise.all([
          fetch(`${API}/workspaces/${id}/shift-requests?status=pending`, {
            headers
          }),
          fetch(`${API}/workspaces/${id}/timeoff-requests?status=pending`, {
            headers
          })
        ]);

        if (!tradeRes.ok) {
          throw new Error(`Shift requests HTTP ${tradeRes.status}`);
        }
        if (!timeoffRes.ok) {
          throw new Error(`Time off requests HTTP ${timeoffRes.status}`);
        }

        const tradeData = await tradeRes.json();
        const timeoffData = await timeoffRes.json();

        const tradeList: AnyRequest[] = (tradeData.requests ?? []).map((r: AnyRequest) => ({
          ...r,
          id: `trade-${r.id}`
        }));

        const timeoffList: AnyRequest[] = (timeoffData.requests ?? []).map((r: AnyRequest) => ({
          ...r,
          id: `timeoff-${r.id}`
        }));

        const combined: AnyRequest[] = [...timeoffList, ...tradeList];

        if (!alive) return;
        setRequests(combined);
        setSelectedId(combined[0]?.id ?? '');
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : 'Failed to load requests');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id, getToken]);

  // Confirmation dialog state
  const [confirm, setConfirm] = React.useState<{
    open: boolean;
    action: 'approve' | 'reject' | null;
  }>({ open: false, action: null });

  function openConfirm(action: 'approve' | 'reject') {
    setConfirm({ open: true, action });
  }
  function closeConfirm() {
    setConfirm({ open: false, action: null });
  }

  async function applyDecision() {
    if (!selected || !confirm.action) return;

    try {
      const token = await getToken();
      const path = confirm.action === 'approve' ? 'approve' : 'reject';
      const baseRoute = selected.kind === 'timeoff' ? 'timeoff-requests' : 'shift-requests';

      // Strip the "timeoff-" / "trade-" prefix to get the DB id
      const rawId = selected.id.includes('-') ? selected.id.split('-')[1] : selected.id;

      const res = await fetch(`${API}/workspaces/${id}/${baseRoute}/${rawId}/admin/${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ decision: confirm.action })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      // Remove the handled request locally (only pending are shown)
      const idx = requests.findIndex((r) => r.id === selected.id);
      const nextRequests = requests.filter((r) => r.id !== selected.id);
      const nextSelected = nextRequests[idx]?.id ?? nextRequests[idx - 1]?.id ?? '';

      setRequests(nextRequests);
      setSelectedId(nextSelected);
    } catch (err) {
      setError(
        `Failed to ${confirm.action} request${err instanceof Error ? `: ${err.message}` : ''}`
      );
    } finally {
      closeConfirm();
    }
  }

  // Helpers
  function fmtRange(range: { start: string; end: string }) {
    return `${range.start} → ${range.end}`;
  }

  function statusChip(status: RequestStatus) {
    const map: Record<RequestStatus, string> = {
      pending: 'border border-border bg-muted text-muted-foreground',
      approved: 'border border-primary/20 bg-primary/10 text-primary',
      denied: 'border border-destructive/20 bg-destructive/10 text-destructive'
    };
    return (
      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}>
        {status}
      </span>
    );
  }

  function kindLabel(kind: AnyRequest['kind']) {
    if (kind === 'timeoff') return 'Time Off Request';
    if (kind === 'trade') return 'Trade Request';
    return 'Cover Request';
  }

  function kindIcon(kind: AnyRequest['kind']) {
    if (kind === 'timeoff') return <CalendarDays size={18} />;
    if (kind === 'trade') return <ArrowLeftRight size={18} />;
    return <ArrowRight size={18} />;
  }

  return (
    <div className="flex min-h-[640px]">
      {/* Left pane: request list */}
      <aside className="w-1/2 p-4">
        <h2 className="text-foreground mb-3 text-lg font-semibold">Requests</h2>
        {loading && <div className="text-muted-foreground mb-3 text-sm">Loading requests…</div>}
        {error && (
          <div className="border-destructive/20 bg-destructive/10 text-destructive mb-3 rounded-md border px-3 py-2 text-sm">
            Error: {error}
          </div>
        )}

        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="text-muted-foreground mt-10 text-center italic">
              There are currently no requests!
            </div>
          ) : (
            requests.map((req) => {
              const isSelected = req.id === selectedId;
              const baseCard =
                'cursor-pointer rounded-xl border p-3 transition-shadow hover:shadow-sm';
              const selectedRing = isSelected ? 'border-ring shadow-sm' : 'border-border';

              return (
                <div
                  key={req.id}
                  className={`${baseCard} ${selectedRing} bg-card`}
                  onClick={() => setSelectedId(req.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: icon + title */}
                    <div className="flex items-center gap-2">
                      <div className="bg-muted rounded-full p-2">{kindIcon(req.kind)}</div>

                      <div className="flex flex-col">
                        {req.kind === 'timeoff' && (
                          <>
                            <div className="text-foreground text-sm font-medium">
                              {req.requesterNames.join(', ')}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              Time off · {fmtRange(req.dateRange)}
                            </div>
                          </>
                        )}

                        {req.kind === 'trade' && (
                          <>
                            <div className="text-foreground text-sm font-medium">
                              Trade: {req.from.name} ↔ {req.to.name}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {req.from.date} ↔ {req.to.date}
                            </div>
                          </>
                        )}

                        {req.kind === 'cover' && (
                          <>
                            <div className="text-foreground text-sm font-medium">
                              Cover: {req.from.name} → {req.coverer.name}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {req.from.date} ({req.from.start}-{req.from.end})
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
        <h2 className="text-foreground mb-3 text-lg font-semibold">Details</h2>

        {!selected ? (
          <div className="border-border text-muted-foreground rounded-xl border border-dashed p-8 text-center">
            Select a request to see details
          </div>
        ) : (
          <div className="border-border bg-card rounded-2xl border p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-muted rounded-full p-2">{kindIcon(selected.kind)}</div>
                <div className="text-foreground text-sm font-semibold">
                  {kindLabel(selected.kind)}
                </div>
              </div>
              {statusChip(selected.status)}
            </div>

            {/* Body */}
            {selected.kind === 'timeoff' && (
              <div className="space-y-2">
                <div className="text-foreground text-base font-semibold">
                  {selected.requesterNames.join(', ')}
                </div>
                <div className="text-muted-foreground text-sm">
                  Date range: {fmtRange(selected.dateRange)}
                </div>
                {selected.reason ? (
                  <div className="text-muted-foreground text-sm">Reason: {selected.reason}</div>
                ) : null}
              </div>
            )}

            {selected.kind === 'trade' && (
              <div className="space-y-3">
                <div className="text-muted-foreground text-sm">
                  <span className="font-semibold">{selected.from.name}</span> → {selected.from.date}{' '}
                  ({selected.from.start}-{selected.from.end})
                </div>
                <div className="text-muted-foreground text-sm">
                  <span className="font-semibold">{selected.to.name}</span> → {selected.to.date} (
                  {selected.to.start}-{selected.to.end})
                </div>
              </div>
            )}

            {selected.kind === 'cover' && (
              <div className="space-y-3">
                <div className="text-muted-foreground text-sm">
                  <span className="font-semibold">Original owner:</span> {selected.from.name}
                </div>
                <div className="text-muted-foreground text-sm">
                  <span className="font-semibold">Covering:</span> {selected.coverer.name}
                </div>
                <div className="text-muted-foreground text-sm">
                  <span className="font-semibold">Shift:</span> {selected.from.date} (
                  {selected.from.start}-{selected.from.end})
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-2">
              {/* Deny */}
              <button
                type="button"
                onClick={() => openConfirm('reject')}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
              >
                <X size={16} /> Deny
              </button>

              {/* Approve */}
              <button
                type="button"
                onClick={() => openConfirm('approve')}
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
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
              {confirm.action === 'approve' ? 'Approve request?' : 'Deny request?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {confirm.action === 'approve'
                ? 'This will mark the request as approved. You cannot change it later.'
                : 'This will mark the request as denied. You cannot change it later.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirm} className="hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={applyDecision}
              className={
                confirm.action === 'approve'
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              }
            >
              {confirm.action === 'approve' ? 'Confirm Approve' : 'Confirm Deny'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
