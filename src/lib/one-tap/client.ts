/* eslint-disable @typescript-eslint/no-explicit-any */
import { type BetterAuthClientPlugin } from "better-auth";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
        };
      };
    };
    googleScriptInitialized?: boolean;
  }
}

interface GoogleOneTapOptions {
  /**
   * Google client ID
   */
  clientId: string;
  /**
   * Auto select the account if the user is already signed in
   */
  autoSelect?: boolean;
  /**
   * Cancel the flow when the user taps outside the prompt
   */
  cancelOnTapOutside?: boolean;
  /**
   * Context of the Google One Tap flow
   */
  context?: "signin" | "signup" | "use";
}

interface GoogleOneTapActionOptions
  extends Omit<GoogleOneTapOptions, "clientId"> {
  callbackURL?: string;
}

let isRequestInProgress = false;

export const oneTapClient = (options: GoogleOneTapOptions) => {
  return {
    id: "one-tap",
    getActions: () => ({
      oneTap: async (opts?: GoogleOneTapActionOptions) => {
        if (isRequestInProgress) {
          console.warn(
            "A Google One Tap request is already in progress. Please wait.",
          );
          return;
        }

        isRequestInProgress = true;

        try {
          if (typeof window === "undefined" || !window.document) {
            console.warn(
              "Google One Tap is only available in browser environments",
            );
            return;
          }

          const { autoSelect, cancelOnTapOutside, context } = opts ?? {};
          const contextValue = context ?? options.context ?? "signin";

          await loadGoogleScript();

          await new Promise<void>((resolve) => {
            window.google?.accounts.id.initialize({
              client_id: options.clientId,
              callback: async (response: { credential: string }) => {
                const headers = new Headers();
                headers.set("Content-Type", "application/json");
                await fetch("/api/auth/one-tap/callback", {
                  method: "POST",
                  body: JSON.stringify({ idToken: response.credential }),
                  headers,
                });

                resolve();
              },
              auto_select: autoSelect,
              cancel_on_tap_outside: cancelOnTapOutside,
              context: contextValue,
            });
            window.google?.accounts.id.prompt();
          });
        } catch (error) {
          console.error("Error during Google One Tap flow:", error);
          throw error;
        } finally {
          isRequestInProgress = false;
        }
      },
    }),
    getAtoms() {
      return {};
    },
  } satisfies BetterAuthClientPlugin;
};

const loadGoogleScript = (): Promise<void> => {
  return new Promise((resolve) => {
    if (window.googleScriptInitialized) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.googleScriptInitialized = true;
      resolve();
    };
    document.head.appendChild(script);
  });
};
