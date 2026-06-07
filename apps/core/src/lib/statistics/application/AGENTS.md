# Statistics Application Layer

This layer is orchestration only.

Use it for:
- Use case methods that coordinate domain ports and domain objects.
- Input normalization needed before calling ports.
- Transaction boundaries with `@Transactional` or `runInNewTransaction`.
- Wiring-adjacent concerns such as publishing messages after a completed use case.

Do not put here:
- Domain decisions, validation rules, derivation rules, or parsing logic.
- Filesystem, database, HTTP, framework, URL encoding, or rendering concerns.
- Repository implementations or direct infrastructure imports, except approved shared transaction helpers.
- Helpers used by only Astro pages or adapters.

If code starts making decisions instead of coordinating collaborators, move that behavior into the domain or an infrastructure adapter.
