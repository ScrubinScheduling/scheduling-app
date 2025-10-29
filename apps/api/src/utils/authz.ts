import { prisma } from '../db'


export async function getWorkspaceMembership(clerkId: string | null, workspaceId: number) {
    const membership = await prisma.userWorkspaceMembership.findFirst({
        where: { workspaceId, user: { clerkId } },

        include: {
            workspace: true,
            user: true,
        },
    });

    return membership
}
