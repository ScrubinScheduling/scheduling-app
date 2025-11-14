import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createApiClient } from "@scrubin/api-client";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/"]);
const isWorkspaceRoute = createRouteMatcher([
  "/workspaces/:workspaceId",
  "/workspaces/:workspaceId/:path*",
]);

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

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  if (isWorkspaceRoute(req)) {
    const { getToken } = await auth();
    const token = await getToken();
    const workspaceId = Number(req.url.split("/")[4])
	  const membershipStatus = await getWorkspaceMembershipStatus(token, workspaceId);

		if (membershipStatus === 403) {
			return NextResponse.redirect(new URL("/not-found", req.url));
		}

  }
});

export const config = {
  matcher: ["/((?!.*\\.\\w+$|_next).*)", "/(api|trpc)(.*)"],
};
