import express from "express";
import {
  listShiftRequests,
  getShiftRequest,
  createShiftRequest,
  updateShiftRequest,
  deleteShiftRequest,
  approveShiftRequest,
  rejectShiftRequest,
} from "../controllers/ShiftRequestsController";

const router = express.Router({ mergeParams: true });

// GET /workspaces/:workspaceId/shift-requests
router.get("/", listShiftRequests);

// GET /workspaces/:workspaceId/shift-requests/:id
router.get("/:id", getShiftRequest);

// POST /workspaces/:workspaceId/shift-requests
router.post("/", createShiftRequest);

// PATCH /workspaces/:workspaceId/shift-requests/:id
router.patch("/:id", updateShiftRequest);

// DELETE /workspaces/:workspaceId/shift-requests/:id
router.delete("/:id", deleteShiftRequest);

// POST /workspaces/:workspaceId/shift-requests/:id/approve
router.post("/:id/approve", approveShiftRequest);

// POST /workspaces/:workspaceId/shift-requests/:id/reject
router.post("/:id/reject", rejectShiftRequest);

export default router;