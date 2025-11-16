import { Request, Response } from "express";
import { prisma } from "../db";
import { createClerkClient } from "@clerk/backend";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

type MemberDTO = {
  id: string;       
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
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          clerkId: true,
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
    rows.map(async ({ user }) => {
      const firstRole = user.UserRoleMembership[0]?.role?.name ?? "Member";

      let cu = cache.get(user.clerkId);
      if (!cu) {
        cu = await clerk.users.getUser(user.clerkId);
        cache.set(user.clerkId, cu);
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
  const userId = Number(req.params.userId);

  await prisma.userWorkspaceMembership.deleteMany({
    where: { workspaceId, userId },
  });

  await prisma.userRoleMembership.deleteMany({
    where: { userId, workSpaceId: workspaceId },
  });

  res.status(204).send();
}
