/**
 * GraphQL operation documents for the Latzu Entity API (port 8000).
 *
 * Endpoints:
 *   Queries   → entityTypes, entityType, entities, entity
 *   Mutations → createEntityType, updateEntityType, deleteEntityType,
 *               createEntity, updateEntity, deleteEntity
 *
 * All documents are used with { client: entityClient } from src/lib/apollo.ts.
 *
 * NOTE: Strawberry-GraphQL automatically converts Python snake_case field names
 * to camelCase in the GraphQL schema (e.g. entity_type → entityType).
 * All field names and argument names here must use camelCase to match.
 *
 * Example usage:
 *   import { GET_ENTITY_TYPES } from "@/graphql/api/operations";
 *   import { entityClient } from "@/lib/apollo";
 *   const { data } = useQuery(GET_ENTITY_TYPES, { client: entityClient });
 */

import { gql } from "@apollo/client";

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * List all entity type definitions stored in Neo4j, ordered alphabetically.
 */
export const GET_ENTITY_TYPES = gql`
  query GetEntityTypes {
    entityTypes {
      name
      description
      properties {
        name
        type
        required
        description
      }
      createdAt
      updatedAt
    }
  }
`;

/**
 * Fetch a single entity type by name.
 *
 * Variables: { name: string }
 * Returns null if the type does not exist.
 */
export const GET_ENTITY_TYPE = gql`
  query GetEntityType($name: String!) {
    entityType(name: $name) {
      name
      description
      properties {
        name
        type
        required
        description
      }
      createdAt
      updatedAt
    }
  }
`;

/**
 * List entity instances with optional type filter and pagination.
 *
 * Variables:
 *   - entityType: string? — filter to instances of this type
 *   - skip:       number  — offset for pagination (default 0)
 *   - limit:      number  — page size (default 50)
 */
export const GET_ENTITIES = gql`
  query GetEntities($entityType: String, $skip: Int, $limit: Int) {
    entities(entityType: $entityType, skip: $skip, limit: $limit) {
      total
      skip
      limit
      items {
        id
        entityType
        properties
        createdAt
        updatedAt
      }
    }
  }
`;

/**
 * Fetch a single entity instance by its UUID.
 *
 * Variables: { id: string }
 * Returns null if not found.
 */
export const GET_ENTITY = gql`
  query GetEntity($id: String!) {
    entity(id: $id) {
      id
      entityType
      properties
      createdAt
      updatedAt
    }
  }
`;

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Define a new entity type (like creating a table schema).
 *
 * Variables: { input: CreateEntityTypeInput }
 *   - name:        string                    — must be unique
 *   - description: string?                   — human-readable description
 *   - properties:  PropertyDefinitionInput[] — field definitions
 *
 * Errors: "EntityType 'Book' already exists."
 */
export const CREATE_ENTITY_TYPE = gql`
  mutation CreateEntityType($input: CreateEntityTypeInput!) {
    createEntityType(input: $input) {
      name
      description
      properties {
        name
        type
        required
        description
      }
      createdAt
      updatedAt
    }
  }
`;

/**
 * Update an existing entity type's description or property list.
 *
 * Variables: { name: string, input: UpdateEntityTypeInput }
 *
 * Errors: "EntityType 'X' not found."
 */
export const UPDATE_ENTITY_TYPE = gql`
  mutation UpdateEntityType($name: String!, $input: UpdateEntityTypeInput!) {
    updateEntityType(name: $name, input: $input) {
      name
      description
      properties {
        name
        type
        required
        description
      }
      updatedAt
    }
  }
`;

/**
 * Delete an entity type. Fails if any instances of this type still exist.
 *
 * Variables: { name: string }
 *
 * Errors:
 *   - "EntityType 'X' not found."
 *   - "Cannot delete EntityType 'X': N instances exist."
 */
export const DELETE_ENTITY_TYPE = gql`
  mutation DeleteEntityType($name: String!) {
    deleteEntityType(name: $name) {
      success
      message
    }
  }
`;

/**
 * Create a new entity instance.
 *
 * Variables: { input: CreateEntityInput }
 *   - entityType: string              — must exist as an EntityType
 *   - properties: Record<string, any> — key/value bag (JSON)
 *
 * Errors: "EntityType 'X' does not exist. Create it first."
 */
export const CREATE_ENTITY = gql`
  mutation CreateEntity($input: CreateEntityInput!) {
    createEntity(input: $input) {
      id
      entityType
      properties
      createdAt
      updatedAt
    }
  }
`;

/**
 * Update (merge) properties on an existing entity instance.
 * New properties are merged into existing ones — only provided keys change.
 *
 * Variables: { id: string, input: UpdateEntityInput }
 *
 * Errors: "Entity 'uuid' not found."
 */
export const UPDATE_ENTITY = gql`
  mutation UpdateEntity($id: String!, $input: UpdateEntityInput!) {
    updateEntity(id: $id, input: $input) {
      id
      entityType
      properties
      updatedAt
    }
  }
`;

/**
 * Permanently delete an entity instance from Neo4j.
 *
 * Variables: { id: string }
 *
 * Errors: "Entity 'uuid' not found."
 */
export const DELETE_ENTITY = gql`
  mutation DeleteEntity($id: String!) {
    deleteEntity(id: $id) {
      success
      message
    }
  }
`;

export const GET_USER_SUBSCRIPTION = gql`
  query GetUserSubscription($userId: String!) {
    userSubscription(userId: $userId) {
      plan
      status
      currentPeriodEnd
      stripeCustomerId
    }
  }
`;
