import express from 'express';
import { prisma } from '../db';

const router = express.Router({ mergeParams: true });

// Status mapping between DB ints and API strings
const STATUS = {
  pending: 0,
  approved: 1,
  denied: 2,
} as const;

type StatusKey = keyof typeof STATUS;

function statusToString(code: number): StatusKey {
  switch (code) {
    case STATUS.approved:
      return "approved";
    case STATUS.denied:
      return "denied";
    case STATUS.pending:
    default:
      return "pending";
  }
}

function statusFromQuery(s: string | undefined): number | undefined {
  if (!s) return undefined;
  if (s === "pending" || s === "approved" || s === "denied") {
    return STATUS[s];
  }
  return undefined;
}

function formatDate(d: Date) {
  // YYYY-MM-DD
  return d.toISOString().slice(0, 10);
}

function formatTime(d: Date) {
  // HH:MM
  return d.toISOString().slice(11, 16);
}

function fullName(user: { firstName: string | null; lastName: string | null } | null) {
  if (!user) return "Unknown";
  const first = user.firstName ?? "";
  const last = user.lastName ?? "";
  const joined = `${first} ${last}`.trim();
  return joined || "Unknown";
}


router.get('/', async (req, res) => {
	try {
      const workspaceId = Number(req.params.workspaceId);
  
      if (!workspaceId || Number.isNaN(workspaceId)) {
        return res.status(400).json({ error: "Invalid workspace id" });
      }
  
      const statusCode = statusFromQuery(req.query.status as string | undefined);
  
      const where: any = { workspaceId };
      if (typeof statusCode === "number") {
        where.status = statusCode;
      }
  
      const rows = await prisma.shiftRequest.findMany({
        where,
        orderBy: { id: "desc" },
      });
  
      // Collect all shift IDs referenced by these requests
      const shiftIds = new Set<number>();
      for (const r of rows) {
        shiftIds.add(r.lendedShiftId);
        if (r.requestedShiftId != null) {
          shiftIds.add(r.requestedShiftId);
        }
      }
  
      const shiftIdList = Array.from(shiftIds);
      const shifts = shiftIdList.length
        ? await prisma.shift.findMany({
            where: { id: { in: shiftIdList } },
            include: { user: true },
          })
        : [];
  
      const shiftById = new Map<number, (typeof shifts)[number]>();
      for (const s of shifts) {
        shiftById.set(s.id, s);
      }
  
      const requests = rows
        .map((row) => {
          const lended = shiftById.get(row.lendedShiftId);
          const requested = row.requestedShiftId
            ? shiftById.get(row.requestedShiftId)
            : null;
  
          if (!lended) {
            // Inconsistent DB row, skip
            return null;
          }
  
          const base = {
            id: String(row.id),
            status: statusToString(row.status),
          };
  
          if (!requested) {
            // TIME OFF REQUEST: only one shift
            return {
              ...base,
              kind: "timeoff" as const,
              requesterNames: [fullName(lended.user)],
              dateRange: {
                start: formatDate(lended.startTime),
                end: formatDate(lended.endTime),
              },
              // reason can be added later
            };
          }
  
          // TRADE REQUEST: two shifts, two users
          const fromUser = lended.user;
          const toUser = requested.user;
  
          return {
            ...base,
            kind: "trade" as const,
            from: {
              name: fullName(fromUser),
              date: formatDate(lended.startTime),
              start: formatTime(lended.startTime),
              end: formatTime(lended.endTime),
            },
            to: {
              name: fullName(toUser),
              date: formatDate(requested.startTime),
              start: formatTime(requested.startTime),
              end: formatTime(requested.endTime),
            },
          };
        })
        .filter((r) => r !== null);
  
      return res.status(200).json({ requests });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      return res.status(500).json({ error: "Failed to load shift requests" });
    }
});

router.get('/:id', async (req, res) => {
	try {
      const workspaceId = Number(req.params.workspaceId);
      const id = Number(req.params.id);
  
      if (!workspaceId || Number.isNaN(workspaceId) || Number.isNaN(id)) {
        return res.status(400).json({ error: "Invalid id" });
      }
  
      const row = await prisma.shiftRequest.findFirst({
        where: { id, workspaceId },
      });
  
      if (!row) {
        return res.status(404).json({ error: "Shift request not found" });
      }
  
      const shiftIds = [row.lendedShiftId];
      if (row.requestedShiftId != null) shiftIds.push(row.requestedShiftId);
  
      const shifts = await prisma.shift.findMany({
        where: { id: { in: shiftIds } },
        include: { user: true },
      });
  
      const shiftById = new Map<number, (typeof shifts)[number]>();
      for (const s of shifts) shiftById.set(s.id, s);
  
      const lended = shiftById.get(row.lendedShiftId);
      const requested = row.requestedShiftId
        ? shiftById.get(row.requestedShiftId)
        : null;
  
      if (!lended) {
        return res.status(500).json({ error: "Inconsistent shift request data" });
      }
  
      const base = {
        id: String(row.id),
        status: statusToString(row.status),
      };
  
      let requestDto: any;
      if (!requested) {
        requestDto = {
          ...base,
          kind: "timeoff" as const,
          requesterNames: [fullName(lended.user)],
          dateRange: {
            start: formatDate(lended.startTime),
            end: formatDate(lended.endTime),
          },
        };
      } else {
        requestDto = {
          ...base,
          kind: "trade" as const,
          from: {
            name: fullName(lended.user),
            date: formatDate(lended.startTime),
            start: formatTime(lended.startTime),
            end: formatTime(lended.endTime),
          },
          to: {
            name: fullName(requested.user),
            date: formatDate(requested.startTime),
            start: formatTime(requested.startTime),
            end: formatTime(requested.endTime),
          },
        };
      }
  
      return res.status(200).json({ request: requestDto });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      return res.status(500).json({ error: "Failed to load shift request" });
    }
});

router.post('/', async (req, res) => {
	// TODO: Implement create shift request
	res.status(501).json({ error: 'Not implemented' });
});

router.patch('/:id', async (req, res) => {
	// TODO: Implement update shift request
	res.status(501).json({ error: 'Not implemented' });
});

router.delete('/:id', async (req, res) => {
	// TODO: Implement delete shift request
	res.status(501).json({ error: 'Not implemented' });
});

router.post('/:id/approve', async (req, res) => {
	try {
      const workspaceId = Number(req.params.workspaceId);
      const id = Number(req.params.id);
  
      if (!workspaceId || Number.isNaN(workspaceId) || Number.isNaN(id)) {
        return res.status(400).json({ error: "Invalid id" });
      }
  
      const existing = await prisma.shiftRequest.findFirst({
        where: { id, workspaceId },
      });
      if (!existing) {
        return res.status(404).json({ error: "Shift request not found" });
      }
  
      await prisma.shiftRequest.update({
        where: { id },
        data: { status: STATUS.approved },
      });
  
      return res.status(204).send();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      return res.status(500).json({ error: "Failed to approve shift request" });
    }
});

router.post('/:id/reject', async (req, res) => {
	try {
      const workspaceId = Number(req.params.workspaceId);
      const id = Number(req.params.id);
  
      if (!workspaceId || Number.isNaN(workspaceId) || Number.isNaN(id)) {
        return res.status(400).json({ error: "Invalid id" });
      }
  
      const existing = await prisma.shiftRequest.findFirst({
        where: { id, workspaceId },
      });
      if (!existing) {
        return res.status(404).json({ error: "Shift request not found" });
      }
  
      await prisma.shiftRequest.update({
        where: { id },
        data: { status: STATUS.denied },
      });
  
      return res.status(204).send();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      return res.status(500).json({ error: "Failed to reject shift request" });
    }
});

export default router;


