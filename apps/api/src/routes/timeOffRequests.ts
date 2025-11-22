import express from "express";
import { prisma } from "../db";

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
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fullName(user: { firstName: string | null; lastName: string | null } | null) {
  if (!user) return "Unknown";
  const first = user.firstName ?? "";
  const last = user.lastName ?? "";
  const joined = `${first} ${last}`.trim();
  return joined || "Unknown";
}

/**
 * GET /workspaces/:workspaceId/timeoff-requests
 * Returns { requests: AnyRequest[] } but only "timeoff" kinds.
 */
router.get("/", async (req, res) => {
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

    const rows = await prisma.timeOffRequest.findMany({
      where,
      orderBy: { id: "desc" },
      include: { user: true },
    });

    const requests = rows.map((row) => {
      return {
        id: String(row.id),
        status: statusToString(row.status),
        kind: "timeoff" as const,
        requesterNames: [fullName(row.user)],
        dateRange: {
          start: formatDate(row.startDate),
          end: formatDate(row.endDate),
        },
        // reason could be added later if you add a column
      };
    });

    return res.status(200).json({ requests });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: "Failed to load time off requests" });
  }
});

/**
 * GET /workspaces/:workspaceId/timeoff-requests/:id
 * Returns a single timeoff request (same shape).
 */
router.get("/:id", async (req, res) => {
  try {
    const workspaceId = Number(req.params.workspaceId);
    const id = Number(req.params.id);

    if (!workspaceId || Number.isNaN(workspaceId) || Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const row = await prisma.timeOffRequest.findFirst({
      where: { id, workspaceId },
      include: { user: true },
    });

    if (!row) {
      return res.status(404).json({ error: "Time off request not found" });
    }

    const request = {
      id: String(row.id),
      status: statusToString(row.status),
      kind: "timeoff" as const,
      requesterNames: [fullName(row.user)],
      dateRange: {
        start: formatDate(row.startDate),
        end: formatDate(row.endDate),
      },
    };

    return res.status(200).json({ request });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: "Failed to load time off request" });
  }
});

/**
 * POST /workspaces/:workspaceId/timeoff-requests
 * TODO: Implement create time off request
 */
router.post("/", async (req, res) => {
  // TODO: Implement create time off request
  return res.status(501).json({ error: "Not implemented" });
});

/**
 * PATCH /workspaces/:workspaceId/timeoff-requests/:id
 * TODO: Implement update time off request
 */
router.patch("/:id", async (req, res) => {
  // TODO: Implement update time off request
  return res.status(501).json({ error: "Not implemented" });
});

/**
 * DELETE /workspaces/:workspaceId/timeoff-requests/:id
 * TODO: Implement delete time off request
 */
router.delete("/:id", async (req, res) => {
  // TODO: Implement delete time off request
  return res.status(501).json({ error: "Not implemented" });
});

/**
 * POST /workspaces/:workspaceId/timeoff-requests/:id/approve
 * Marks time off request as approved.
 */
router.post("/:id/approve", async (req, res) => {
  try {
    const workspaceId = Number(req.params.workspaceId);
    const id = Number(req.params.id);

    if (!workspaceId || Number.isNaN(workspaceId) || Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const existing = await prisma.timeOffRequest.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Time off request not found" });
    }

    await prisma.timeOffRequest.update({
      where: { id },
      data: { status: STATUS.approved },
    });

    return res.status(204).send();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: "Failed to approve time off request" });
  }
});

/**
 * POST /workspaces/:workspaceId/timeoff-requests/:id/reject
 * Marks time off request as denied.
 */
router.post("/:id/reject", async (req, res) => {
  try {
    const workspaceId = Number(req.params.workspaceId);
    const id = Number(req.params.id);

    if (!workspaceId || Number.isNaN(workspaceId) || Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const existing = await prisma.timeOffRequest.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Time off request not found" });
    }

    await prisma.timeOffRequest.update({
      where: { id },
      data: { status: STATUS.denied },
    });

    return res.status(204).send();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: "Failed to reject time off request" });
  }
});

export default router;