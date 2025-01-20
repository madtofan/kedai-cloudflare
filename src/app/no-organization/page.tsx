"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Check, X, LogOut } from "lucide-react";
import { api } from "~/trpc/react";
import { type TRPCError } from "@trpc/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Spinner } from "~/components/ui/spinner";
import { signOut } from "~/lib/auth-client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { useToast } from "~/hooks/use-toast";

const formSchema = z.object({
  organizationName: z.string().min(1),
  storeName: z.string().min(1),
});

export default function NoOrganization() {
  const [loadingSignOut, setLoadingSignOut] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationName: "",
      storeName: "",
    },
  });

  const { mutateAsync: createOrganization } =
    api.organization.createOrganization.useMutation();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    createOrganization({
      organizationName: values.organizationName,
      storeName: values.storeName,
    })
      .then(() => {
        toast({
          title: "Organization Created",
          description: `Your organization "${values.organizationName}" has been created successfully.`,
        });
        router.push("/no-organization/new-menu-group");
      })
      .catch((error: TRPCError) => {
        console.error(error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="container mx-auto max-w-3xl p-4">
      <h1 className="mb-6 text-3xl font-bold">
        Welcome to Kedai Solutions Point of Sale System
      </h1>
      <Card className="mb-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Create Your Organization</CardTitle>
              <CardDescription>
                Start managing your restaurant by creating an organization.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex flex-col space-y-2">
                <FormField
                  control={form.control}
                  name="organizationName"
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex flex-col space-y-2">
                <FormField
                  control={form.control}
                  name="storeName"
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormLabel>Store Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="submit" disabled={loading || loadingSignOut}>
                {loading ? <Spinner /> : <Plus className="mr-2 h-4 w-4" />}
                Create Organization
              </Button>
              <Button
                disabled={loading || loadingSignOut}
                variant={"ghost"}
                onClick={async () => {
                  await signOut({
                    fetchOptions: {
                      onRequest: () => {
                        setLoadingSignOut(true);
                      },
                      onResponse: () => {
                        setLoadingSignOut(false);
                      },
                      onSuccess: () => {
                        router.push("/");
                      },
                      onError: (ctx) => {
                        toast({
                          title: "Error Logging Out",
                          description: ctx.error.message,
                          variant: "destructive",
                        });
                      },
                    },
                  });
                }}
              >
                {loadingSignOut ? <Spinner /> : <LogOut />}
                Log Out
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      <Separator className="my-8" />
      <InvitationCard />
    </div>
  );
}

function InvitationCard() {
  const router = useRouter();
  const { toast } = useToast();

  const { data: invitations } = api.user.getAllInvitations.useQuery();

  const { data: userInformation } = api.user.getCurrentUser.useQuery();

  const { mutateAsync: acceptInvitation } =
    api.user.acceptInvitation.useMutation();

  const { mutateAsync: declineInvitation } =
    api.user.declineInvitation.useMutation();

  useEffect(() => {
    if (userInformation?.activeOrganizationId) {
      router.replace("/dashboard");
    }
  }, [router, userInformation?.activeOrganizationId]);

  const handleAcceptInvitation = (invitationId: string) => {
    acceptInvitation({
      invitationId,
    })
      .then(() => {
        toast({
          title: "Invitation Accepted",
          description: "You have successfully joined the organization.",
        });
        router.replace("/dashboard");
      })
      .catch((error: TRPCError) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      });
  };

  const handleDeclineInvitation = (invitationId: string) => {
    declineInvitation({
      invitationId,
    })
      .then(() => {
        toast({
          title: "Invitation Declined",
          description: "You have declined the organization invitation.",
        });
      })
      .catch((error: TRPCError) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      });
  };

  if (invitations === undefined) {
    return <Spinner />;
  }

  return (
    <>
      <h2 className="mb-4 text-2xl font-semibold">Organization Invitations</h2>
      {invitations.length > 0 ? (
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <Card key={invitation.id}>
              <CardHeader>
                <CardTitle>{invitation.organization.name}</CardTitle>
                <CardDescription>
                  Invited by {invitation.inviter.name}
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handleDeclineInvitation(invitation.id)}
                >
                  <X className="mr-2 h-4 w-4" /> Decline
                </Button>
                <Button onClick={() => handleAcceptInvitation(invitation.id)}>
                  <Check className="mr-2 h-4 w-4" /> Accept
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground">
              You have no pending invitations.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
