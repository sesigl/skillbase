/**
 * Architecture Rules for Skillbase Core
 *
 * Enforces hexagonal architecture principles:
 * - Dependency Inversion: Domain at center, dependencies point inward
 * - Database Connection Management: Only Transactional decorator calls getDatabaseConnection()
 * - Transaction Management: Only use cases manage transactions via @Transactional decorator
 * - Layer Separation: Clear boundaries between interface (pages), application, domain, infrastructure
 *
 * @type {import('dependency-cruiser').IConfiguration}
 */
module.exports = {
  forbidden: [
    {
      name: 'no-get-database-connection-outside-transactional',
      comment:
        'Only Transactional, TransactionContext, and di.ts wiring should import getDatabaseConnection from database.ts. Use @Transactional decorator in use cases instead.',
      severity: 'error',
      from: {
        pathNot: [
          '^src/lib/shared/infrastructure/persistence/Transactional\\.ts$',
          '^src/lib/shared/infrastructure/persistence/TransactionContext\\.ts$',
          '^src/lib/shared/database\\.ts$',
          '^src/lib/.*/infrastructure/di\\.ts$',
        ],
      },
      to: {
        path: '^src/lib/shared/database\\.ts$',
      },
    },
    {
      name: 'no-direct-repository-access-from-pages',
      comment: 'Pages must not directly instantiate repositories. Use use cases instead.',
      severity: 'error',
      from: {
        path: ['^src/pages/.*'],
        pathNot: ['^src/pages/api/.*'],
      },
      to: {
        path: '^src/lib/.*/infrastructure/.*/Postgres.*Repository\\.ts$',
      },
    },
    {
      name: 'no-api-routes-to-infrastructure',
      comment:
        'API routes (interfaces layer) should not directly access infrastructure except di.ts factory methods.',
      severity: 'error',
      from: {
        path: '^src/pages/api',
      },
      to: {
        path: '^src/lib/.*/infrastructure',
        pathNot: ['^src/lib/.*/infrastructure/di\\.ts$'],
      },
    },
    {
      name: 'no-api-routes-to-domain',
      comment:
        'API routes should not directly access domain layer. They must go through use cases.',
      severity: 'error',
      from: {
        path: '^src/pages/api',
      },
      to: {
        path: '^src/lib/.*/domain',
        pathNot: ['\\.(types|interfaces)\\.ts$'],
      },
    },
    {
      name: 'api-routes-only-usecases',
      comment: 'API routes should only import use cases from application layer.',
      severity: 'error',
      from: {
        path: '^src/pages/api',
      },
      to: {
        path: '^src/lib/.*/application',
        pathNot: ['/application/usecases/.*\\.ts$'],
      },
    },
    {
      name: 'domain-no-outer-dependencies',
      comment:
        'Domain layer must not depend on application, interfaces, or infrastructure layers (Dependency Inversion Principle).',
      severity: 'error',
      from: {
        path: '^src/lib/.*/domain',
      },
      to: {
        path: ['^src/lib/.*/application', '^src/lib/.*/interfaces', '^src/lib/.*/infrastructure'],
      },
    },
    {
      name: 'infrastructure-no-reach-out',
      comment:
        'Infrastructure should implement domain interfaces but not reach into application or interfaces layers. Exception: di.ts wires application use cases.',
      severity: 'error',
      from: {
        path: '^src/lib/.*/infrastructure',
        pathNot: ['^src/lib/.*/infrastructure/di\\.ts$'],
      },
      to: {
        path: ['^src/lib/.*/application', '^src/lib/.*/interfaces'],
      },
    },
    {
      name: 'application-no-infrastructure-imports',
      comment:
        'Application layer must not import from infrastructure. Use dependency injection via constructor parameters and domain ports instead. Allowed exception: shared Transactional decorator for transaction management.',
      severity: 'error',
      from: {
        path: '^src/lib/.*/application',
      },
      to: {
        path: '^src/lib/.*/infrastructure',
        pathNot: [
          '^src/lib/shared/infrastructure/persistence/Transactional\\.ts$',
          '^src/lib/shared/infrastructure/persistence/TransactionContext\\.ts$',
        ],
      },
    },
    {
      name: 'no-circular-dependencies',
      comment: 'Circular dependencies are not allowed.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      comment: 'Modules should be connected to the dependency graph.',
      severity: 'error',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$',
          '\\.d\\.ts$',
          '(^|/)tsconfig\\.json$',
          '\\.astro$',
          '^src/env\\.d\\.ts$',
          '^src/middleware\\.ts$',
          '^src/pages/.*',
        ],
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: './tsconfig.json',
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
  },
};
