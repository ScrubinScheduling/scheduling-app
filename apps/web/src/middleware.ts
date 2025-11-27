import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createApiClient } from "@scrubin/api-client";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/"]);
const isWorkspaceRoute = createRouteMatcher([
  "/workspaces/:workspaceId",
  "/workspaces/:workspaceId/:path*",
]);

const isWorkspaceRoot = createRouteMatcher(["/workspaces/:workspaceId"])

async function getWorkspaceMembershipStatus(token: string | null, workspaceId: number) {
  try {
    const apiClient = createApiClient({
      baseUrl: "http://localhost:4000",
      getToken: async () => token
    });
    
    await apiClient.getWorkspace(workspaceId); 
    return 200; 
  } catch (error: any) {
    return error.status || 500;
  }
}

async function isAdmin(token, userId: string | null, workspaceId: number) {
  try {
    const apiClient = createApiClient({
      baseUrl: "http://localhost:4000",
      getToken: async () => token
    });
    
    const workspace = await apiClient.getWorkspace(workspaceId); 

    return workspace.adminId === userId;
  } catch (err) {
    console.error(err)
  }
}

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  if (isWorkspaceRoute(req)) {
    const { getToken, userId } = await auth();
    const token = await getToken();
    const workspaceId = Number(req.url.split("/")[4])
	  const membershipStatus = await getWorkspaceMembershipStatus(token, workspaceId);

		if (membershipStatus === 403) {
			return NextResponse.redirect(new URL("/not-found", req.url));
		}

    if (isWorkspaceRoot(req)) {
      const isUserAdmin = await isAdmin(token, userId, workspaceId);
			return NextResponse.redirect(new URL(`/workspaces/${workspaceId}/${isUserAdmin ? 'admin': 'user'}/dashboard`, req.url));
    }

  }
});

export const config = {
  matcher: ["/((?!.*\\.\\w+$|_next).*)", "/(api|trpc)(.*)"],
};
