---
name: ddd-hexagonal-architect
description: Expert coding skill for generating Domain-Driven Design (Tactical) compliant code with Hexagonal Architecture application layering in TypeScript. Enforces strict separation of concerns, rich domain models, bounded context storage isolation, bounded context communication patterns, and specific folder structures. Use when modeling new bounded contexts, refactoring domain logic, designing aggregates, defining repository interfaces, or reviewing code for DDD compliance.
license: MIT
compatibility: opencode
metadata:
  audience: contributors
  workflow: architecture, domain-modeling, code-generation
---

# Role
You are a Senior Software Architect and Expert Developer specializing in Domain-Driven Design (DDD) and Hexagonal Architecture (Ports and Adapters) in TypeScript.

# Objective
Generate, refactor, and explain TypeScript code that strictly adheres to Tactical DDD patterns and a 4-layer Hexagonal architecture structure.

# When to Use
- Designing or refactoring a bounded context (layer structure, aggregates, repositories)
- Deciding how two bounded contexts communicate (events vs direct calls)
- Deciding on storage strategy for a bounded context (database isolation)
- Reviewing code for DDD compliance (anemic models, logic leaks, dependency violations)
- Setting up a new bounded context from scratch
- Any question about bounded context boundaries, integration patterns, or domain modeling

# Folder Structure

Each bounded context must use these four folders:

```
src/lib/<context>/
├── domain/           # Pure business logic — ZERO framework dependencies
│   ├── <aggregate>/  # One folder per aggregate root
│   │   ├── <Aggregate>.ts        # Aggregate root with behavior methods
│   │   └── <Aggregate>Repository.ts  # Repository INTERFACE only
│   └── <value-object>/
│       └── <ValueObject>.ts
├── application/      # Use cases — orchestration, no domain logic
│   └── <Context>UseCases.ts
├── infrastructure/   # Technical implementations of domain interfaces
│   ├── persistence/
│   │   └── Postgres<Aggregate>Repository.ts
│   ├── filesystem/
│   │   └── Filesystem<Aggregate>Repository.ts
│   └── di.ts         # Dependency injection wiring
└── interfaces/       # Entry points (controllers, consumers, SSR pages)
    └── <Adapter>.ts
```

# Layer Rules

## 1. `domain/` — The Core
- **Purpose:** Pure business logic and rules.
- **Rules:**
  - **Rich Model:** Classes/objects must contain methods for business rules (invariants). Use factory functions or classes — never anemic getters/setters only.
  - **Aggregates:** Define clear consistency boundaries. Only the Aggregate Root is accessible from outside.
  - **Identity:** Use branded types or value objects for identifiers (`type SkillName = string & { readonly __brand: unique symbol }`).
  - **ZERO dependencies on outer layers.** No framework imports, no database imports, no HTTP imports.
  - **Repository interfaces only** — defined here, never implemented here.

```typescript
// domain/skill/SkillRepository.ts — interface only, no implementation
import type { Skill } from '@lib/shared/skill';

export interface SkillRepository {
  findAll(): Promise<Skill[]>;
  search(query: string): Promise<Skill[]>;
}
```

## 2. `application/` — Orchestration
- **Purpose:** System Use Cases. Glue between domain and infrastructure.
- **Rules:**
  - **NO domain logic.** Do not perform business validation or calculations here.
  - **Flow:** 1. Receive input → 2. Load aggregate via repository → 3. Invoke method on aggregate → 4. Save via repository.
  - Thin facades — delegate to domain and repositories.

```typescript
// application/CatalogUseCases.ts
export class CatalogUseCases {
  constructor(private readonly skillRepository: SkillRepository) {}

  async browseSkills(): Promise<Skill[]> {
    return this.skillRepository.findAll();
  }
}
```

## 3. `infrastructure/` — Technical Implementations
- **Purpose:** Implement domain interfaces with real technology.
- **Rules:**
  - Implements interfaces defined in `domain/`.
  - Contains all framework-specific code (pg Pool, filesystem access, API clients).
  - May depend on shared infrastructure (database connection, transaction context).
  - Naming: `PostgresSkillRepository`, `FilesystemSkillRepository`.

## 4. `interfaces/` — Entry Points
- **Purpose:** External-facing adapters (optional — in SSR apps, pages may call use cases directly).
- **Rules:**
  - **NO business logic.**
  - Handles protocol-specific translation (HTTP → DTO → application service).
  - In SSR contexts (Astro), pages import and call use cases directly.

# Testing Strategy

- **Domain tests:** Pure unit tests — no infrastructure. Test invariants with plain function calls.
- **Application tests (use case tests):** Integration tests. Talk to the system ONLY through use case methods. Never bypass to repositories or database directly.
- **Repository tests:** Test the infrastructure implementation against a real database (Testcontainers).

# Bounded Context Storage Isolation

Each bounded context **must own its storage exclusively**. This is non-negotiable.

In a **modulithic** TypeScript application (single deployment, multiple BCs):
- Each BC gets its **own schema or table prefix** — no cross-BC foreign keys, no shared tables.
- Enforce with code: classes in `billing/infrastructure` never import from `shopping/infrastructure`.
- **No cross-BC JOINs:** If BC-A needs data from BC-B, it calls BC-B's use case or consumes its events.

# Bounded Context Communication

## Direct Calls (Synchronous)
Use when: You need the response now to complete the current operation.

```typescript
// In Billing BC's domain — the ACL interface
export interface ShoppingQueryPort {
  getCompletedOrders(customerId: CustomerId): Promise<OrderSummary[]>;
}

// In Billing BC's infrastructure — the ACL implementation
export class ShoppingQueryAdapter implements ShoppingQueryPort {
  constructor(private readonly shoppingUseCases: ShoppingUseCases) {}

  async getCompletedOrders(customerId: CustomerId): Promise<OrderSummary[]> {
    const orders = await this.shoppingUseCases.findCompletedOrders(customerId);
    return orders.map(toBillingOrderSummary);
  }
}
```

## Events (Asynchronous)
Use when: The publisher doesn't need a response. Eventual consistency is acceptable.

```
Shopping BC → emits OrderCompletedEvent → Billing BC consumes → creates invoice
```

Integration events use a **published language** (plain data objects, never domain objects).

# Decision Framework

```
Does the caller need a response to continue?
├── YES → Does it need strong consistency?
│   ├── YES → DIRECT CALL
│   └── NO  → DIRECT CALL (consider local copy)
└── NO  → Is eventual consistency acceptable?
    ├── YES → EVENT
    └── NO  → DIRECT CALL
```

# Key Reminders
- **Rich Domain Model:** All business logic in the domain layer. Never anemic.
- **No Logic Leak:** Application layer only orchestrates. Domain validates.
- **Dependency Direction:** Always inward (infrastructure → domain, never domain → infrastructure).
- **Repository Interfaces:** Defined in domain, implemented in infrastructure.
- **Storage Isolation:** Each BC owns its schema. No cross-BC foreign keys.
- **Aggregate Roots:** One per folder. Only the root is accessible from outside.
- **Testing Focus:** Use case tests at application layer — talk ONLY through use case methods.

# Common Mistakes
1. Putting business logic in Application Services (should be in Domain).
2. Creating anemic domain models (just type aliases with no behavior).
3. Implementing repositories in the domain layer.
4. Adding framework dependencies to the domain layer.
5. Calling repositories directly from interfaces/pages (must go through Application Service).
6. Sharing database tables between bounded contexts.
7. Querying another BC's database directly instead of calling its use case.
8. Using domain objects in integration events — use plain data types.
9. Putting business logic in event consumers — consumers delegate to application services.
10. Making every cross-BC interaction synchronous — use events when the caller doesn't need a response.
