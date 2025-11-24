import { Request, Response } from "express";
import { prisma } from "../db";
import { createClerkClient } from "@clerk/backend";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

type MemberDTO = {
  id: string;              // userId (Clerk id)
  membershipId: number;    // UserWorkspaceMembership.id
  role: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export async function listMembers(req: Request, res: Response) {
  const workspaceId = Number(req.params.workspaceId ?? req.params.id);

  const rows = await prisma.userWorkspaceMembership.findMany({
    where: { workspaceId },
    select: {
      id: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          UserRoleMembership: {
            where: { workSpaceId: workspaceId },
            select: { role: { select: { name: true } } },
          },
        },
      },
    },
  });

  const cache = new Map<string, any>();

  const members: MemberDTO[] = await Promise.all(
    rows.map(async ({ id: membershipId, user }) => {
      const firstRole = user.UserRoleMembership[0]?.role?.name ?? "Member";

      let cu = cache.get(user.id);
      if (!cu) {
        cu = await clerk.users.getUser(user.id);
        cache.set(user.id, cu);
      }
      const email =
        cu.primaryEmailAddress?.emailAddress ??
        cu.emailAddresses?.[0]?.emailAddress ??
        "";
      const phone =
        cu.primaryPhoneNumber?.phoneNumber ??
        cu.phoneNumbers?.[0]?.phoneNumber ??
        "";

      return {
        id: String(user.id),
        membershipId,
        role: firstRole,
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email,
        phone,
      };
    })
  );

  res.json({ members });
}

export async function removeMember(req: Request, res: Response) {
  const workspaceId = Number(req.params.workspaceId ?? req.params.id);
  const userId = String(req.params.userId);

  await prisma.userWorkspaceMembership.deleteMany({
    where: { workspaceId, userId },
  });

  await prisma.userRoleMembership.deleteMany({
    where: { userId, workSpaceId: workspaceId },
  });

  res.status(204).send();
}
