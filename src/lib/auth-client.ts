import { createAuthClient } from "better-auth/react";
import { toast } from "./use-toast";
import { organizationClient, oneTapClient } from "better-auth/client/plugins";
import { env } from "~/env";

export const client = createAuthClient({
  baseURL: env.NEXT_PUBLIC_BETTER_AUTH_URL,
  plugins: [
    organizationClient(),
    oneTapClient({
      clientId: env.NEXT_PUBLIC_GOOGLE_AUTH_ID,
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
