/**
 * Apollo Client configuration for Latzu Platform.
 *
 * Single unified client connecting to the merged backend on one port.
 * Exported as both `aiClient` and `entityClient` (same object) so all
 * existing hooks work without changes.
 *
 * Uses a split link: HTTP for queries/mutations, WebSocket for subscriptions.
 */

import { ApolloClient, HttpLink, InMemoryCache, split } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { getSession } from "next-auth/react";
import { createClient } from "graphql-ws";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_URL = API_URL.replace(/^http/, "ws");

// ─── Auth link ─────────────────────────────────────────────────────────────────

const authLink = setContext(async (_, { headers }) => {
  try {
    const session = await getSession();
    const token = session?.backendToken;
    return {
      headers: {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
  } catch {
    return { headers };
  }
});

// ─── Transport links ───────────────────────────────────────────────────────────

const httpLink = new HttpLink({ uri: `${API_URL}/graphql` });

const wsLink =
  typeof window !== "undefined"
    ? new GraphQLWsLink(createClient({ url: `${WS_URL}/graphql` }))
    : null;

const splitLink =
  wsLink !== null
    ? split(
        ({ query }) => {
          const def = getMainDefinition(query);
          return def.kind === "OperationDefinition" && def.operation === "subscription";
        },
        wsLink,
        authLink.concat(httpLink)
      )
    : authLink.concat(httpLink);

// ─── Unified client ────────────────────────────────────────────────────────────

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      ChatSessionGQL:    { keyFields: ["sessionId"] },
      SendMessageResult: { keyFields: ["sessionId"] },
      EntityTypeGQL:     { keyFields: ["name"] },
      EntityGQL:         { keyFields: ["id"] },
    },
  }),
  defaultOptions: {
    watchQuery: { fetchPolicy: "cache-and-network" },
  },
});

// Aliases so existing imports require no changes
export const aiClient = client;
export const entityClient = client;
