"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApolloProvider } from "@apollo/client";
import { useState, type ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { client } from "@/lib/apollo";
import { LanguageProvider } from "@/lib/i18n";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <ApolloProvider client={client}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange={false}
          >
            <LanguageProvider>
              {children}
            </LanguageProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ApolloProvider>
    </SessionProvider>
  );
}



