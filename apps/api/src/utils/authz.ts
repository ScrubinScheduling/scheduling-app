import { prisma } from '../db'

export async function getWorkspaceMembership(clerkId: string, workspaceId: number) {
    const membership = await prisma.userWorkspaceMembership.findFirst({
        where: { workspaceId, user: { id: clerkId } },

        include: {
            workspace: true,
            user: true,
        },
    })

    return membership
}
