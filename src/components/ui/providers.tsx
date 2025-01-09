"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ReactNode } from "react";
import { TRPCReactProvider } from "~/trpc/react";
import { ToastProvider } from "./toast";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps): ReactNode {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <TRPCReactProvider>
          <NextThemesProvider
            attribute="class"
            defaultTheme="dark"
            disableTransitionOnChange
          >
            {children}
          </NextThemesProvider>
        </TRPCReactProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
