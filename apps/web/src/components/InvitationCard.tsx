'use client';
import React, { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Building2, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { createApiClient } from '@scrubin/api-client';
import { InvitationInfo } from '@scrubin/schemas';

export default function InvitationCard({
  workspaceName,
  workspaceOwnerName,
  workspaceOwnerEmail,
  invitationId
}: InvitationInfo) {
  const [isLoading, setIsLoading] = useState(false);
  const { getToken } = useAuth();
  const router = useRouter();

  const apiClient = useMemo(
    () =>
      createApiClient({
        baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL as string,
        getToken
      }),
    [getToken]
  );

  const clickHandler = async () => {
    setIsLoading(true);
    try {
      await apiClient.acceptInvitation(invitationId);
      router.push('/workspaces');
    } catch (error) {
      console.error('Something went wrong', error);
      setIsLoading(false);
    }
  };
  return (
    <div>
      <Card className="space-y-2 rounded-2xl p-4 shadow-lg">
        <CardHeader className="mt-2">
          <div className="flex justify-center">
            <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
              <CheckCircle2 className="text-primary h-8 w-8" />
            </div>
          </div>

          <div className="space-y-2 text-center">
            <CardTitle className="text-2xl">You have been invited</CardTitle>
            <CardDescription>Join the team and start collaborating</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted flex items-center gap-3 rounded-lg p-4">
            <div className="bg-primary flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg">
              <Building2 className="text-primary-foreground h-6 w-6" />
            </div>

            <div className="min-w-0 space-y-1">
              <div className="text-muted-foreground block text-xs font-medium">WORKSPACE</div>
              <div className="text-foreground block truncate font-semibold">{workspaceName}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-muted-foreground block text-xs font-medium">INVITED BY</div>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>KA</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-foreground truncate font-semibold">{workspaceOwnerName}</div>
                <div className="text-muted-foreground truncate text-xs font-medium">
                  {workspaceOwnerEmail}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-border h-px" />
          <Button
            onClick={clickHandler}
            disabled={isLoading}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-lg px-4 py-3 transition-colors duration-200 hover:cursor-pointer"
          >
            {isLoading && <Spinner className="text-primary-foreground" />}
            Accept
          </Button>
        </CardContent>
        <CardFooter>
          <p className="text-muted-foreground w-full text-center text-xs">
            This invitation expires in 1 day
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
