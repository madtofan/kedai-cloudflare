import { createAuthClient } from "better-auth/react";
import { oneTapClient, organizationClient } from "better-auth/client/plugins";
import { toast } from "~/hooks/use-toast";

export const client = createAuthClient({
  plugins: [
    organizationClient(),
    oneTapClient({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_AUTH_ID ?? "",
    }),
  ],
  fetchOptions: {
    onError(e) {
      if (e.error.status === 429) {
        toast({
          title: "Too many requests",
          description: "Please try again later.",
          variant: "destructive",
        });
      }
    },
  },
});

export const {
  signUp,
  signIn,
  signOut,
  useSession,
  organization,
  oneTap,
  useListOrganizations,
  useActiveOrganization,
} = client;
