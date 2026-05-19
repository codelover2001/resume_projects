import React, { useState, useMemo } from 'react';

/* ============================================================================
 * PROJECTS DATA
 * ============================================================================
 * Comprehensive record of engineering work — designed for interview prep
 * (recruiter, HM, and bar-raiser rounds). Each project carries:
 *   - elevator pitch (one line)
 *   - 90-second narrative (memorize the structure, not words)
 *   - problem, solution, technical depth, impact
 *   - signature "killer answer" for the hardest-part question
 *   - grill questions interviewers will probe
 *   - what NOT to say (positioning landmines)
 * ========================================================================== */

const PROJECTS = [
  {
    id: 'traffic-replay',
    tier: 1,
    year: '2023 — Present',
    company: 'Intuit · QuickBooks Desktop Payroll Platform',
    title: 'Traffic Replay & Validation Framework',
    role: 'Designer & Lead Engineer',
    tags: ['Distributed Systems', 'Reliability', 'Observability', 'Platform'],
    oneLine:
      'Production-scale shadow traffic system that validates functionality, data, performance and stability without touching customers.',
    headline: {
      scale: '$270B/yr money movement',
      users: '~100K daily customers',
      replayed: '300M+ requests replayed',
      coverage: '90% automated regression',
    },
    narrative: `I worked on the QuickBooks Desktop Payroll platform, which moves about $270 billion per year and serves around 100K customers daily. It's a large legacy monolith with hundreds of workflows, and even small regressions can cause serious business impact. We were planning major changes like a 32 TB Oracle-to-Postgres migration and large refactors, but there was no reliable way to validate real customer behavior at production scale before releasing.

The core problem was that traditional testing and manual regression couldn't realistically cover production traffic patterns or scale. I took ownership of designing a framework that could validate functionality, data correctness, performance, and stability using real customer traffic — without ever impacting customers.

I designed a parallel setup inside the production cluster where real customer traffic is safely mirrored to a passive replica of the application and database. The production system continues serving users normally, while the parallel system replays the same traffic and validates responses, data mutations, and performance.

The key challenges were safety, data security, correctness, and scalability — ensuring downstream writes were mocked, sensitive data was encrypted, and variable fields were intelligently ignored during comparison. I also built support for replaying traffic at 2× or 3× load to test system stability during peak scenarios.`,
    problem: [
      'Legacy monolith with 1.8M LOC, 600+ workflows, mission-critical batch + bizops reports.',
      'Unit and integration tests could not capture real production behavior, edge cases, or traffic shape at scale.',
      'High-risk changes (DB migrations, refactors) needed validation against real customer traffic without risk to customers.',
      'No single framework existed for automated functional, performance, data, and stability validation at production scale.',
    ],
    architecture: [
      {
        name: 'Traffic Capture Sidecar',
        detail:
          'Sidecar container in the production pod. Nginx terminates TLS, GoReplay captures decrypted HTTPS, re-encrypts before forwarding. ~10% CPU/mem overhead. No application code changes.',
      },
      {
        name: 'Parallel Application Server',
        detail:
          'Exact replica of production in the same cluster, connected to a weekly-refreshed cloned database. Invisible to customers — production continues serving real traffic.',
      },
      {
        name: 'Mock Downstream Writes',
        detail:
          'Envoy proxy + Wiremock intercept downstream writes from the parallel server. Reads pass through. This bounds blast radius to zero.',
      },
      {
        name: 'Event Bus',
        detail:
          'Request and response carry a correlated transaction ID used as partition key — guarantees ordering and request/response pairing per partition.',
      },
      {
        name: 'Replay Validator Middleware',
        detail:
          'Consumes from bus, replays on parallel server, captures response, persists request/response pairs encrypted at rest, runs response + data + performance validators.',
      },
      {
        name: 'Data Validator (BFS)',
        detail:
          'Per workflow config maintains impacted tables. BFS over FK relationships scoped by tenant_id + parent_record_id + bounded time window. Ignores non-deterministic fields (IDs, timestamps).',
      },
      {
        name: 'Performance Validator',
        detail:
          'TP90 / TP95 / TP99 calculations per workflow. Logs to Splunk/ELK for analysis. Slow workflows surfaced before release.',
      },
      {
        name: 'Load Replay',
        detail:
          'Stored traffic can be replayed at 0.5× / 2× / 3× for stability testing under peak — fully async, decoupled from production rate.',
      },
    ],
    impact: [
      '~300M OLTP requests replayed (peak ~3M/day).',
      '90% automated functional + performance validation during Oracle Exit.',
      '30+ performance and 20+ functional issues caught pre-release.',
      'De-risked 32 TB Oracle → Postgres migration with zero P0/P1 issues — largest unsharded migration in South Asia Pacific per AWS SME.',
      '70+ incremental smooth releases enabled.',
      'Hibernate 3.x → 5.x upgrade validated with framework — saved 200+ manual regression hours.',
      'Adopted as a paved path across the org for Java 11, Spring Boot, and library upgrades.',
    ],
    killerAnswer:
      "I'm most proud of this project because it sits at the intersection of engineering rigor and customer trust. The best reliability work is invisible to users, but it prevents real pain at scale. This project fundamentally changed how teams shipped software, and knowing that millions of customers never experienced failures because of it is what makes it meaningful to me.",
    grillQuestions: [
      {
        q: 'Why capture traffic at the sidecar instead of in application code?',
        a: 'Sidecar keeps app code untouched. Zero risk of introducing latency, bugs, or behavior changes in a mission-critical monolith. Capture can be rolled out or rolled back independently.',
      },
      {
        q: 'How did you handle HTTPS securely?',
        a: 'TLS terminated at an Nginx layer inside the pod. GoReplay captures decrypted traffic. Re-encrypted before forwarding. All captured data encrypted again before reaching the bus and at rest.',
      },
      {
        q: 'How did you guarantee request-response pairing?',
        a: 'Transaction ID used as the partition key. Request and response always land on the same partition in order, consumed by the same validator.',
      },
      {
        q: 'How did you prevent replay from corrupting downstream systems?',
        a: 'All downstream writes from the parallel server were intercepted and mocked via Envoy + Wiremock. Only reads passed through. Zero side effects, full upstream validation.',
      },
      {
        q: 'How did you avoid false positives in response/data comparison?',
        a: 'Normalized responses by ignoring non-deterministic fields (IDs, timestamps). Data comparison scoped by tenant_id + parent_record_id + bounded time window, traversed via BFS over FK relationships per workflow config.',
      },
      {
        q: 'What broke first under scale?',
        a: 'Validator CPU and message throughput. Fixed by partitioning workloads, horizontal scaling consumers, and optimizing comparison logic.',
      },
      {
        q: 'What happens if the replay system goes down?',
        a: 'Nothing customer-facing. Production traffic continues unaffected. We only lose validation coverage temporarily.',
      },
      {
        q: 'Why not dual writes instead?',
        a: 'Dual writes introduce transactional coupling, latency on the critical path, and idempotency issues at downstreams. Replay keeps prod isolated and validation asynchronous.',
      },
      {
        q: 'Should every company build this?',
        a: 'No. Only when cost of failure is extremely high and production behavior is too complex to simulate otherwise. Otherwise it is overengineering.',
      },
      {
        q: 'What would you redesign?',
        a: 'Invest earlier in multi-tenant middleware to reduce per-team infra cost and a better diff visualization layer to lower onboarding friction.',
      },
    ],
    landmines: [
      'Do NOT lead with tools (GoReplay, Nginx). Lead with business risk.',
      'Do NOT say "negligible overhead" — you measured it (~10%).',
      'Do NOT claim "just me" — credit infra/QA/service owners while owning the design.',
      'Do NOT say "nothing broke" under scale. Battle scars build credibility.',
    ],
  },

  {
    id: 'mysql-postgres',
    tier: 1,
    year: '2024 — 2025',
    company: 'Intuit · Projects Service',
    title: 'Aurora MySQL 5.7 → PostgreSQL 15 Migration',
    role: 'Application-side Migration Lead',
    tags: ['Database', 'Migration', 'CDC', 'Distributed Systems', 'Risk Engineering'],
    oneLine:
      'Direct one-shot migration off Aurora MySQL 5.7 with parity validation, DMS forward/reverse replication, and rollback readiness.',
    headline: {
      version: 'Aurora MySQL 5.7 → Postgres 15',
      flyway: '684+ migrations converted',
      pipelines: 'CDC + Datalake parity',
      mode: 'Direct one-shot migration',
    },
    narrative: `I led the application-side migration of our Projects service from Aurora MySQL 5.7 to Aurora PostgreSQL 15. The driver was MySQL 5.7 heading toward EOL and extended support cost, but the strategic goal was to move onto Intuit's standard Postgres stack for scalability and long-term maintainability.

The complexity wasn't just schema conversion — it was keeping a heavily integrated service safe: multiple environments with drift, 684+ Flyway migrations, stored procedures for outbox/partition maintenance, JSON-heavy query patterns, and critical CDC pipelines to Kafka + Data Lake.

We chose a direct migration path (MySQL → Postgres) rather than staging through MySQL 8, because it avoided double work and gave immediate benefits — simpler JSON logic (~60% less parsing code), better concurrency, and predictable SLA compliance — while still keeping rollback safe.

To de-risk it, we built a parity phase: DMS replication to Postgres, deepchecks for DB parity and data-lake parity, and traffic replay on a parallel app stack to validate request/response + performance at production scale without impacting customers. For rollback we also set up reverse replication to a MySQL rollback cluster.`,
    problem: [
      'Aurora MySQL 5.7 EOL Feb 2027 with high extended-support cost.',
      'Postgres is Intuit\'s standard — eventual migration mandatory.',
      'Heavily integrated service: 600+ workflows, event bus + Kafka + Data Lake CDC, 8+ environments with drift.',
      'Migration scope: 684+ Flyway migrations, stored procedures, partitioning, JSON, collation, isolation, JDBC drivers.',
    ],
    architecture: [
      {
        name: 'Migration Strategy: Direct One-Shot',
        detail:
          'MySQL 5.7 → Postgres 15 directly. Rejected staged (5.7 → 8.0 → Postgres) because double migration = double risk window, double cost, delayed benefits. Accepted larger one-time risk surface for lower overall program risk.',
      },
      {
        name: 'Three-Cluster Topology',
        detail:
          'Cluster A (prod MySQL 5.7, live) → Cluster B (Postgres 15, target) → Cluster C (MySQL 5.7, rollback). DMS forward A→B during parity, reverse B→C kept ready for rollback.',
      },
      {
        name: 'Schema & Migration Conversion',
        detail:
          '684+ Flyway scripts converted. AUTO_INCREMENT → BIGSERIAL. UNSIGNED removed with CHECK constraints. ENGINE/CHARSET stripped. DATETIME → TIMESTAMP UTC. TINYINT → SMALLINT. CHAR(15) → VARCHAR(255) to dodge padding semantics.',
      },
      {
        name: 'Collation: ICU Case-Insensitive',
        detail:
          'MySQL utf8_general_ci is case-insensitive; Postgres default is case-sensitive. Solved at DB level with ICU collation `und-u-ks-level2` + non-deterministic — zero code changes, indexes still work, exact behavior match.',
      },
      {
        name: 'Transaction Isolation',
        detail:
          'MySQL defaults REPEATABLE READ, Postgres defaults READ COMMITTED. Explicit @Transactional(isolation = REPEATABLE_READ) on critical paths: idempotency checks, concurrent series updates, name uniqueness.',
      },
      {
        name: 'JSON Handling',
        detail:
          'Custom Hibernate UserType (PostgreSQLJsonType) bridging MySQL JSON to Postgres jsonb. No MySQL JSON_EXTRACT logic existed in queries — clean compatibility.',
      },
      {
        name: 'Outbox & Partitioning',
        detail:
          'Stored procedure partition management rewritten in PL/pgSQL. Evaluated pg_partman. Outbox excluded from DMS to prevent duplicate events. Temp topics during parity, then switched to original topics at cutover.',
      },
      {
        name: 'Parity Validation Stack',
        detail:
          'DeepChecks/DB Solo for row-level parity. Temp Hive tables for batch ingestion parity. Traffic replay for request/response + performance parity on parallel app. All three layers run during parity phase.',
      },
      {
        name: 'Cutover Sequence',
        detail:
          'Code freeze → drain MySQL outbox → stop forward DMS → start reverse DMS B→C → switch app config to Postgres → resume outbox to original topics → post-cutover deepchecks. Rollback target: minutes.',
      },
    ],
    impact: [
      '~60% reduction in JSON parsing code complexity.',
      'Improved concurrency under connection pool load.',
      'Better SLA compliance via simpler query logic.',
      'Direct cutover preserved single deployment, no dual-write debt, minutes-level rollback.',
      'Established multi-environment migration playbook reused across services.',
    ],
    killerAnswer:
      "The hardest part wasn't converting MySQL syntax to Postgres — it was proving that 100+ tables, 684+ migrations, and dozens of CDC pipelines would behave identically under real traffic before we cut over. We built three independent parity layers (DB, batch ingestion, traffic replay) so that a green signal on all three was the cutover precondition. The migration itself was the boring part — the validation was the engineering.",
    grillQuestions: [
      {
        q: 'Why Postgres 15 and not 16?',
        a: 'Postgres 15 was the current Intuit-standard, mature, well-tested version with full extension support. 16 added marginal benefit and introduced unnecessary risk during an already-large migration.',
      },
      {
        q: 'Why direct migration vs staged via MySQL 8?',
        a: 'Staged = double migration cost, two operational disruptions, extended dual-system overhead, MySQL 8 licensing in the interim, and delayed Postgres-specific benefits. Direct accepted larger one-time risk for lower total program risk.',
      },
      {
        q: 'How did you handle collation differences without rewriting every query?',
        a: 'Created an ICU non-deterministic collation at the DB level matching MySQL utf8_general_ci semantics. Applied via ALTER TABLE on relevant columns. Zero HQL changes, indexes still work, identical behavior to MySQL.',
      },
      {
        q: 'How do you know rows match across 100+ tables?',
        a: 'DeepChecks/DB Solo running scheduled parity diffs at row level, scoped by tenant + time window, ignoring non-deterministic fields. Plus traffic replay validates application-level parity. Plus batch ingestion parity via Hive table comparison.',
      },
      {
        q: 'What\'s your rollback trigger?',
        a: 'Multiple: deepchecks mismatch > threshold, DMS lag spike, P0 customer-facing symptoms post-cutover, or replication health failure. Trigger = stop app, drain Postgres outbox, switch reverse DMS direction, restart app on MySQL rollback cluster.',
      },
      {
        q: 'Why is outbox excluded from DMS?',
        a: 'Replicating outbox would re-publish CDC events to consumers, breaking downstream idempotency and ordering. Outbox is bridged via temp topics during parity, then switched to original topics at cutover.',
      },
      {
        q: 'AUTO_INCREMENT vs sequences — how did you sync after data load?',
        a: 'Post-load, ran `SELECT setval(\'<table>_id_seq\', COALESCE((SELECT MAX(id) FROM <table>), 1))` for every sequence. Hibernate uses GenerationType.IDENTITY, so subsequent inserts are sequence-driven and correct.',
      },
      {
        q: 'ORDER BY NULL ordering differs — did it affect anything?',
        a: 'MySQL sorts NULL first by default, Postgres sorts NULL last. Audit found most ORDER BY was on non-nullable id columns (no impact). Nullable date columns got explicit NULLS LAST.',
      },
      {
        q: 'What was the single riskiest assumption?',
        a: 'That stored procedure rewrites in PL/pgSQL would preserve exact partition behavior for the outbox. Mitigated with focused testing in perf + staging and a fallback to pg_partman.',
      },
    ],
    landmines: [
      'Do NOT overclaim ownership — DBA, outbox team, UIP, datalake all contributed.',
      'Do NOT say "schema conversion was the hard part" — parity validation was.',
      'Do NOT skip the rollback story — HMs probe it relentlessly.',
    ],
  },

  {
    id: 'cms-migration',
    tier: 2,
    year: '2024',
    company: 'Intuit · Projects QB25 Modernization',
    title: 'Project Creation/Update → Customer Management Service (CMS)',
    role: 'Driver / Engineer',
    tags: ['Distributed Systems', 'Service Decomposition', 'Idempotency', 'Consistency'],
    oneLine:
      'Replaced monolith APIs + legacy v4 event fallback with CMS as the single source of truth for sub-customers, with idempotency and reconciliation to handle timeout ambiguity.',
    headline: {
      from: 'Monolith sync API + v4 fallback event',
      to: 'CMS as single source of truth',
      pattern: 'API-based with idempotency',
      outcome: 'Sync failure drift eliminated',
    },
    narrative: `We had project creation/update in the Projects service, but sub-customer creation lived in the monolith with a legacy v4 event as a fallback. That split ownership caused data drift — projects and sub-customers would go out of sync, and downstream systems would see inconsistent states.

I led the migration to the new Customer Management Service (CMS) as the single source of truth for sub-customers, and rewired our project create/update flows to synchronize with CMS. We evaluated two designs — API-based vs event-based — and selected API-based after alignment with CMS because it gave stronger consistency guarantees for critical user actions, with less operational complexity.

The tricky part was handling distributed failure modes like timeouts and partial success — where CMS creates/updates the sub-customer but our project transaction rolls back. I drove the FMEA, introduced end-to-end tracing and alerting (DWSM + consumer lag monitors), and designed idempotency + retry/compensation paths to reduce drift.`,
    problem: [
      'Two systems managing related entities (Project vs Sub-customer) with split ownership.',
      'Legacy v4 event fallback created dual-write / dual-source-of-truth — correctness was probabilistic.',
      'Inconsistent lifecycle updates: name, status, parent move, inactivate, activate, sub-customer→project conversion.',
      'Downstream consumers (CERES, Audit, QBTime, STS/ETS/FTS) depended on consistent references — drift cascaded.',
    ],
    architecture: [
      {
        name: 'Approach Decision: API vs Events',
        detail:
          'Chose API for user-facing create/update — strong consistency matters more than eventual. Event-based would leave windows where Project exists but sub-customer doesn\'t. Fewer moving parts, fewer downstream coordination surfaces.',
      },
      {
        name: 'Idempotency Layer',
        detail:
          'CMS create/update keyed by stable projectId or client idempotency token. Retry after timeout is safe — no duplicate sub-customers.',
      },
      {
        name: 'Reconciliation on Timeout',
        detail:
          'Timeout treated as "unknown", not "failure". Correlation ID lets us query CMS to determine actual outcome, then finalize project or retry. No naive rollback on ambiguous state.',
      },
      {
        name: 'Compensation Paths',
        detail:
          'When CMS confirms failure, project rollback. When CMS confirms success but Projects rolled back, compensating update reconciles state. Reports of "parent move" failures get manual reconciliation tooling.',
      },
      {
        name: 'Observability',
        detail:
          'DWSM end-to-end tracing across Projects → CMS. Metrics on timeout rate, retry rate, reconciliation outcomes. Alerts on cross-service mismatch (project without CMS link, CMS updated without project update).',
      },
      {
        name: 'Downstream Eventual Consistency',
        detail:
          'QBTime / STS / ETS / FTS lag handled as projection lag (consumer lag monitoring + UX guidance to refresh) — not by making everything synchronous.',
      },
    ],
    impact: [
      'Eliminated legacy v4 fallback dual-write path.',
      'Significantly reduced sync failures and customer-visible inconsistencies.',
      'Established idempotency + reconciliation pattern for sibling teams migrating to CMS.',
    ],
    killerAnswer:
      "The hardest part wasn't wiring an API — it was handling ambiguous outcomes under timeout. In distributed systems, you can't assume timeout means failure. We designed idempotency, reconciliation, and monitoring so that transient failures don't permanently corrupt data or user experience.",
    grillQuestions: [
      {
        q: 'CMS create times out — how do you know if it succeeded?',
        a: 'We don\'t treat timeout as failure. Correlation ID lets us query CMS by stable key. If sub-customer exists, finalize project. If not, retry safely (idempotent). Alerts fire if reconciliation runs hot.',
      },
      {
        q: 'Why API over events?',
        a: 'User-facing create/update requires strong consistency. Event-based leaves observable windows where Project exists but sub-customer doesn\'t. Fewer moving parts, less downstream coordination.',
      },
      {
        q: 'Parent move times out and corrupts reports — how do you fix it?',
        a: 'FMEA flags this explicitly. Mitigation: confirm CMS state via correlation ID before treating as final. If detected post-fact, compensating sub-customer move + alert + report repair tooling.',
      },
      {
        q: 'How do you prevent duplicate sub-customers on retry?',
        a: 'CMS API is idempotent on the project key. Retries are safe and no-op on success.',
      },
      {
        q: 'Where does "95% fewer sync failures" come from?',
        a: 'Pre-migration drift detection metrics vs post-migration cross-service consistency monitor. Measured at the sync layer, not at the user-visible layer.',
      },
    ],
    landmines: [
      'Do NOT claim "we made everything strongly consistent" — downstream projections are still eventual.',
      'Do NOT say "we used events" then describe the API approach — be precise about which was chosen.',
    ],
  },

  {
    id: 'au-launch',
    tier: 2,
    year: '2024',
    company: 'Intuit · QBO Advanced',
    title: 'QuickBooks Online Advanced — Australia Launch',
    role: 'Cross-team Execution Lead',
    tags: ['Market Expansion', 'Cross-team Coordination', 'Risk Management', 'Production Readiness'],
    oneLine:
      'Sequenced 10+ dependent teams to launch QBO Advanced in Australia with no marketing, requiring rock-solid functional and analytics parity.',
    headline: {
      market: 'Australia · 250K subscribers',
      teams: '10+ dependent teams',
      launch: 'December 4 · No marketing',
      goal: 'Mid-market expansion · disrupt Xero/MYOB',
    },
    narrative: `I worked on the Australia launch of QuickBooks Online Advanced, which was part of Intuit's strategy to move upmarket and compete directly with Xero and MYOB in the AU region. At the time, we had ~250K subscribers in Australia, but many mid-market customers were churning to third-party tools due to missing analytics and workflow capabilities.

My role was to partner with 10+ teams to make Advanced production-ready for AU — not just by enabling features, but by ensuring functional parity, correctness, and upgrade safety in a new market with local constraints.

This involved sequencing dependent feature rollouts, validating analytics pipelines, handling currency and locale-specific behavior, and enabling upgrade/downgrade flows safely across pre-prod and prod.

We launched Advanced in Australia on December 4 with no active marketing, yet enabled a clean expansion path for ~250K subscribers and reduced reliance on third-party tools by delivering native analytics and workflows.`,
    problem: [
      'AU mid-market churning to Xero Ultimate, MYOB AccountRight Plus/Premier, third-party tools.',
      'Missing native analytics + workflows in QBO Advanced for AU.',
      'No active marketing on launch — product had to be flawless on day one.',
      '~250K AU subscribers represented a strong upgrade opportunity if Advanced was production-ready.',
    ],
    architecture: [
      {
        name: 'Cross-team Sequencing',
        detail:
          'Drove feature enablement order across analytics, workflows, accountant flows, upgrade/downgrade, currency, locale. Mis-sequencing = silent corruption or upgrade lock.',
      },
      {
        name: 'Pre-prod + Prod AU Companies',
        detail:
          'Enabled AU companies in pre-prod (Oct 27 cutoff) and prod with locale/currency setup, then ran experts testing, analytics enablement, and prod offers testing in sequence.',
      },
      {
        name: 'Upgrade/Downgrade Safety',
        detail:
          'Validated upgrade/downgrade with soft blockers, including "Add new client" in QuickBooks Accountant, before GA.',
      },
      {
        name: 'Analytics Correctness',
        detail:
          'Validated analytics pipelines against AU data patterns. Silent analytics drift is worse than visible failures — it erodes trust quietly.',
      },
      {
        name: 'Locale Validation',
        detail:
          'Currency, content, functionality, compatibility with AU-local features — bug-fix loop with dependent teams through Oct 27.',
      },
    ],
    impact: [
      'Enabled QBO Advanced GA in Australia on December 4.',
      'Expansion path for ~250K AU subscribers.',
      'Reduced churn from missing functionality to third-party tools.',
      'Delivered on Big Bet 5 (disrupt mid-market) and Input Goal 1 (mid-market capabilities).',
    ],
    killerAnswer:
      "The hardest part was sequencing correctness across teams. It's easy to enable features, but much harder to guarantee that upgrades, analytics, and accountant workflows all behave correctly on day one in a new market. A single mis-sequenced dependency could silently corrupt data or push customers back to third-party tools — so we treated sequencing and validation as first-class engineering problems.",
    grillQuestions: [
      {
        q: 'How does this reduce churn instead of just shipping features?',
        a: 'Mid-market customers were leaving to Xero/MYOB because Advanced lacked native analytics + workflows. Closing those gaps gives them a reason to stay rather than pay for QBO + a third-party tool.',
      },
      {
        q: 'Why launch with no marketing?',
        a: 'Soft launch reduces support pressure while we confirm product stability under real AU traffic. Marketing is sequenced after the product has earned the trust window.',
      },
      {
        q: 'What would have caused a launch delay?',
        a: 'Analytics drift, upgrade path failure, or accountant flow ("Add new client") breakage. Each was gated explicitly in the readiness checklist.',
      },
      {
        q: 'What did you personally drive vs participate in?',
        a: 'I drove dependency sequencing and readiness gates. I personally validated upgrade/downgrade and analytics correctness for our slice. I coordinated feature teams to fix bugs within the Oct 27 cutoff.',
      },
    ],
    landmines: [
      'Do NOT say "I helped with localization/testing" — you owned sequencing, which is leadership.',
      'Do NOT undersell this as "coordination work" — it was production-readiness engineering for a new market.',
    ],
  },

  {
    id: 'template-sharing',
    tier: 2,
    year: '2024',
    company: 'Intuit · QuickBooks Workflows',
    title: 'Template Sharing & User Contribution Framework',
    role: 'Designer & Lead Engineer',
    tags: ['Frontend Architecture', 'Platform', 'Network Effects', 'Multi-service Orchestration'],
    oneLine:
      'Reusable contribution platform that lets users publish workflow templates — designed plugin-agnostic to extend to reports, spreadsheets, and beyond.',
    headline: {
      users: '1K+ publishers',
      reduction: '60% setup time cut',
      scope: 'Plugin-agnostic platform',
      reach: 'Community + my-companies + my-clients',
    },
    narrative: `I led the design and implementation of a Template Sharing and User Contribution framework for QuickBooks workflows. The core problem was that mid-market customers and accountants were spending huge amounts of time manually recreating the same workflows across companies and clients, which directly hurt adoption and pushed users to third-party tools.

Instead of treating this as a one-off UI feature, I designed it as a scalable platform capability — so templates could be published, discovered, and reused not just for workflows, but for future plugins like reports or spreadsheet sync.

I built a modular frontend architecture around a generic Template Handler and User Contribution components, decoupled from workflows, with clear contracts to backend services. This allowed 1K+ users to publish reusable templates, reduced setup time by ~60%, and unlocked network effects as more templates increased platform value across companies.`,
    problem: [
      '81% of mid-market customers cite "save time through automation" as a top job-to-be-done.',
      'Admins/accountants want to set standard practices (e.g. approvals) across companies/clients.',
      'QBO Advanced required manual workflow recreation per company — labor intensive and error-prone.',
      'Accountants wanted to publish/share templates to establish expertise — no platform existed.',
    ],
    architecture: [
      {
        name: 'Guiding Principle',
        detail:
          'Templates are a first-class, cross-plugin concept — not a workflow-specific feature. Designed so reports, spreadsheet sync, and future plugins can plug in without rewriting core logic.',
      },
      {
        name: 'Template Handler (Platform Layer)',
        detail:
          'Plugin-agnostic. Owns fetching, normalization, and rendering of template metadata. Two subcomponents: Template Card Handler (lists) and UCS Published Template List Helper (published row items). Returns shape-consistent cards regardless of plugin.',
      },
      {
        name: 'User Contribution Widget',
        detail:
          'Captures template metadata (name, description, share scope). Handles PII sanitization (dot-dash replacement before publish). Reuses workflow validation. Orchestrates Publish flow across WAS (workflow definition) and UCS (template metadata).',
      },
      {
        name: 'Publish-as-Template Flow',
        detail:
          'Multi-step transactional: hide workflow-specific UI (name, Save & Turn On) → enforce template-safe state (no PII) → open contribution drawer → on publish: WAS persist workflow def → UCS publish template metadata → navigate + reset UI. Failure at any step rolls back UI cleanly.',
      },
      {
        name: 'Discover & Reuse',
        detail:
          'Clicking a shared template opens the visual designer prefilled. Existing validation paths reused — no fork in the validation logic. User fills company-specific values, then create-workflow or publish-as-template based on intent.',
      },
    ],
    impact: [
      '1K+ users publishing reusable templates.',
      '~60% reduction in workflow setup time.',
      'Network effects: more templates increase platform value.',
      'Reusable contribution framework for future plugins (reports, spreadsheet sync).',
    ],
    killerAnswer:
      "The hardest part was designing this as a reusable contribution framework instead of a workflow feature. It required anticipating future plugins, enforcing safety like PII removal, and orchestrating multi-service publish flows — all while keeping the UX simple. Most of the complexity was deliberately hidden behind clean abstractions.",
    grillQuestions: [
      {
        q: 'How does your design prevent tight coupling to workflows?',
        a: 'Template Handler operates on a plugin-agnostic metadata contract. The workflow plugin is one consumer. Adding reports = implementing the same contract, not modifying core logic.',
      },
      {
        q: 'What if publish succeeds in UCS but fails in WAS?',
        a: 'Two-phase commit at the orchestration layer. UCS publish is the last step after WAS persistence succeeds. If UCS fails, we surface a retry. Failure ordering ensures no orphaned templates pointing at non-existent workflow definitions.',
      },
      {
        q: 'How do you guarantee no PII leaks?',
        a: 'On entering publish mode, PII fields are masked (dot-dash) and workflow name is hidden. Server-side validation rejects any template carrying PII patterns. Defense in depth.',
      },
      {
        q: 'If templates scale from 1K to 100K, what breaks first?',
        a: 'Template discovery — list rendering and search become the bottleneck. Mitigation: virtualization on the client, server-side indexing + ranking on UCS.',
      },
      {
        q: 'How do you version templates as workflows evolve?',
        a: 'Templates store the workflow definition schema version. On import, mismatch triggers a migration path or a compatibility warning. Avoids silent breakage when workflow engine evolves.',
      },
    ],
    landmines: [
      'Do NOT call this "a UI to share templates" — it is a contribution platform.',
      'Do NOT describe components ("drawer", "cards") before architecture (plugin-agnostic contract).',
    ],
  },

  {
    id: 'change-orders',
    tier: 1,
    year: '2024 — 2025',
    company: 'Intuit · QuickBooks Online Projects',
    title: 'Change Orders — Scalable UI + Dynamic Sync Pipelines',
    role: 'Frontend Architect & Engineer',
    tags: ['Financial Workflows', 'State Machines', 'Reporting', 'Auditability'],
    oneLine:
      'First-class way to track scope changes to a project estimate without rewriting history — accepted change orders roll up into KPIs and reports in real time with full audit traceability.',
    headline: {
      users: '50K+ businesses',
      reduction: '80% fewer manual edits',
      surface: 'KPIs + 6 reports + visual tracker',
      contract: 'Original estimate immutable',
    },
    narrative: `I led the engineering for Change Orders in QuickBooks Online Projects — essentially a first-class way to track scope changes to a project estimate without rewriting history. Before this, users had to edit or recreate estimates, which broke audit trail and caused reporting inconsistencies.

The key requirement was: keep the original estimate intact, represent changes as separate transactions, and once accepted, have those changes roll up into project estimated cost/income everywhere — project KPIs, reports, and estimates vs actuals — while preserving full audit traceability.

I built a scalable Change Order UI that handled creation, editing, statuses, attachments, and linking to the underlying project estimate. But the harder part was the dynamic sync pipeline: when a change order is accepted or declined, the system updates rollups and reporting in near real time, so users immediately see accurate KPIs and financial totals.`,
    problem: [
      'No native "change order" concept — users edited estimates directly, breaking audit history.',
      'Reporting inconsistencies across project KPIs, Estimates vs Actuals, Work in Progress.',
      'Construction + professional services workflows specifically needed scope-change tracking.',
      'Customer signoff flow required separation of original estimate from subsequent changes.',
    ],
    architecture: [
      {
        name: 'Core Domain Model',
        detail:
          'A Change Order is a separate estimate-like transaction linked to a Project Estimate. Only accepted change orders contribute to totals. Original estimate remains immutable for audit.',
      },
      {
        name: 'Creation Constraints',
        detail:
          'CO can only originate from a pending / accepted / converted Project Cost Estimate. Not allowed on basic estimates. Disabled for any other PCE status.',
      },
      {
        name: 'Field Rules',
        detail:
          'For existing line items: only qty editable. For new line items: all fields editable. Markup, rates, taxable, billable inherited from PCE for existing lines.',
      },
      {
        name: 'Status State Machine',
        detail:
          'Pending → Accepted / Declined. Accepted = contributes to totals + shows as non-editable section on PCE. Pending = shows on PCE grayed, does not contribute. Declined = excluded from PCE entirely. Estimate decline cascades to obsolete CO warnings.',
      },
      {
        name: 'Sticky Summary Bar',
        detail:
          'Live: total change in estimated cost, total change in estimated income, previous estimated profit margin, new estimated profit margin (assuming this CO is accepted). Updates per line item edit.',
      },
      {
        name: 'Dynamic Rollup Pipeline',
        detail:
          'On status transition, recompute and propagate: project estimated cost/income, profit margin, Estimates vs Actuals visual tracker, KPIs, 6 reports (Estimates vs Actuals, EvsA by Project, Work in Progress, Committed Costs, Cost to Complete, Change Order Report). Status-based inclusion rules prevent double counting.',
      },
      {
        name: 'Tax & Discount Interactions',
        detail:
          'CO sales tax always calculated using the linked PCE date. Discounts in CO merge to PCE discount when accepted (percent → dollar). Override removed and recalculated on accepted-CO merge. Reverted on decline.',
      },
      {
        name: 'Invoicing Boundaries',
        detail:
          'Invoicing is from the estimate (which includes accepted COs), not from the CO directly. Progress invoicing reflects updated estimate amount and remaining. CREATE INVOICE disabled on CO form.',
      },
      {
        name: 'Audit Traceability',
        detail:
          'Every edit logged in Audit Log under Change Order section. Restore Version supported. Status changes logged as separate line items in the Change Order Report.',
      },
    ],
    impact: [
      '80% reduction in manual estimate edits.',
      'Improved financial accuracy for 50K+ businesses.',
      'Full audit traceability across CO lifecycle.',
      'Reporting consistency across 6 project reports.',
    ],
    killerAnswer:
      "The hardest part wasn't a screen — it was making the rollup correct. Pending, accepted, and declined COs have completely different inclusion rules across KPIs, reports, and the project tracker. We modeled this as a status state machine driving a sync pipeline, with explicit guards against double counting. The UI is the easy surface; the correctness of the underlying financial model is what made this real engineering.",
    grillQuestions: [
      {
        q: 'How do you prevent double counting with multiple accepted COs?',
        a: 'Status-based inclusion rules at the rollup layer. Each CO contributes exactly once on accepted. Recomputation is idempotent — re-running yields the same totals.',
      },
      {
        q: 'What triggers rollup recalculation?',
        a: 'Status transition events on CO. Reactive pipeline propagates to project totals, KPIs, reports, and visual tracker. Bounded recompute per project, not full table scan.',
      },
      {
        q: 'Accepted CO becomes declined after partial invoicing — what happens?',
        a: 'Warning surfaced to user about prior invoicing. On confirm, CO lines removed from PCE, EI/EC adjusted, invoice not modified. Audit log records both states. Invoice remains a historical document.',
      },
      {
        q: 'Why can\'t users edit original estimate line attributes through a CO?',
        a: 'Audit traceability. The original estimate must remain immutable. Edits = new line items or qty adjustments on existing lines via CO, never field rewrites on the original.',
      },
      {
        q: 'How did you guarantee KPIs and reports show the same numbers?',
        a: 'Single rollup pipeline drives both. KPIs and reports read from the same materialized rollup, not from independent calculations. Eliminates skew.',
      },
      {
        q: 'What\'s the nastiest edge case?',
        a: 'Accepted CO + override-applied tax on PCE + partial progress invoicing + subsequent CO decline. Order of operations determines whether tax is recalculated or invoice retains stale tax. We pinned the rule: invoice is historical, future estimate reflects current rule.',
      },
    ],
    landmines: [
      'Do NOT call this "a UI" — it is a financial state machine with sync pipelines.',
      'Do NOT claim "real-time everywhere" — be precise: near real-time, bounded recompute.',
    ],
  },

  {
    id: 'project-budgets',
    tier: 1,
    year: '2025',
    company: 'Intuit · QuickBooks Online IES',
    title: 'Project Budgets — Decoupling Internal Cost from Customer Estimates',
    role: 'Frontend Architect',
    tags: ['Source-of-Truth Migration', 'Financial Systems', 'Reporting', 'Migration UX'],
    oneLine:
      'New source of truth for estimated cost — separated from customer-facing Project Estimates — with safe migration, reporting source switch, and full backward compatibility.',
    headline: {
      adoption: '27% of project users',
      businesses: '37K+ businesses',
      change: 'Cost SoT moved from PCE → PB',
      grid: 'DataGrid · 3500+ rows · 23 cols',
    },
    narrative: `Before Project Budgets, QuickBooks used Project Estimates as the source of truth for both estimated cost and income. That broke the mental model for mid-market businesses, especially construction and professional services, where internal cost breakdowns are far more granular than customer-facing quotes.

I helped design and launch Project Budgets to decouple these two concerns: Budgets became the source of truth for estimated cost, while Project Estimates remained the source of truth for estimated income.

The hardest part wasn't the UI — it was ensuring this change didn't break reporting, migrations, upgrade paths, or downstream workflows like Change Orders and Invoicing. I worked on the frontend architecture for budget creation, editing, import, and audit visibility, while coordinating closely with reporting and backend teams to safely switch the estimated-cost data source across 8+ critical reports.`,
    problem: [
      'PE acted as both customer-facing quote AND internal cost breakdown — wrong mental model for MM.',
      'Construction tracks 200+ cost codes (AIA billing); customers want short quotes — irreconcilable in one form.',
      'Reports pulled estimated cost from PE — wrong source for accounting accuracy.',
      '8+ existing reports, custom reports, memorized reports all depended on PE-as-cost-source.',
      'Migration scope: existing IES users, Advanced upgraders, Desktop migrators, NTTFs — all different flows.',
    ],
    architecture: [
      {
        name: 'Source-of-Truth Separation',
        detail:
          'PE → estimated income only. PB → estimated cost only. PE and PB exist independently. Multiple PEs per project, exactly one PB per project. Reports switched to PB as cost source.',
      },
      {
        name: 'DataGrid at Scale',
        detail:
          'Up to 3500 rows, 23 columns, virtual scroll, <200ms edit latency target. Grouping, milestones, dimensions, classes, locations, custom fields. Closer to an FP&A tool than a form.',
      },
      {
        name: 'Budget State Machine',
        detail:
          'Draft → Published → Version N. Draft = not in reports. Published = original baseline for reporting. Versions = subsequent edits, with diff vs original surfaced in reports.',
      },
      {
        name: 'Audit Log Reuse for Versioning',
        detail:
          'Reused existing audit log platform for budget versioning. Each edit creates a version; user can view or restore. Cost diff (Original / Diff / Total) reflected as 3 new columns across 5 cost reports.',
      },
      {
        name: 'Migration Pipeline',
        detail:
          'Two-step async flow: accept all pending PEs and COs → migrate cost columns from PCE to PB. Triggered by user opt-in (existing IES) or auto (upgraders, NTTFs, DTM). Failure isolation: error in step 1 logged; error in step 2 rolls back to old mode.',
      },
      {
        name: 'Async AI Import',
        detail:
          'Spreadsheet upload exceeding 4s SLA — async with task-based progress, notifications, page-level messaging, and resumability. Up to 300 lines supported in V2.',
      },
      {
        name: 'Dual-Mode Reporting',
        detail:
          'During rollout, both modes coexist: PB-users see new reports (cost from PB), non-PB-users see old reports (cost from PE). Feature flag + variability options. Cord cut once 100% on PB.',
      },
      {
        name: 'Multicurrency Guardrail',
        detail:
          'MC initially blocked (only 0.38% of PCE users use it). Warning on MC toggle with data-loss callout. Phase 2 added MC support after migration pipeline matured.',
      },
      {
        name: 'Downgrade Strategy',
        detail:
          'IES → Advanced reverse migration: synthetic PE created carrying budget costs, original PEs unchanged. Reports unbroken. White-glove for edge cases.',
      },
    ],
    impact: [
      '27% of project users adopted Project Budgets.',
      'Improved financial accuracy for ~37K businesses.',
      'Cleaner mental model matching how project managers actually think about cost vs price.',
      'Closed competitor gaps vs NetSuite, Procore, Knowify on key budgeting features.',
      'Established async migration UX pattern reused across the platform.',
    ],
    killerAnswer:
      "The hardest part was changing the cost source of truth without breaking trust. Budgets touched reports, estimates, change orders, migrations, and upgrades. The frontend had to make that transition explicit, safe, and reversible for users, while enforcing strict invariants so financial data stayed correct.",
    grillQuestions: [
      {
        q: 'Why decouple budgets from estimates?',
        a: 'They serve different audiences with different granularity. Internal accounting needs 200+ cost codes; customer quotes need 10 line items. Forcing both into one form broke the mental model and caused reporting drift.',
      },
      {
        q: 'Why one budget per project but multiple PEs?',
        a: 'One internal source of truth for cost. Multiple customer-facing quotes are normal (negotiation iterations). The constraint matches the domain.',
      },
      {
        q: 'How do PB and CO interact?',
        a: 'COs no longer carry cost columns (cost lives in PB). CO updates estimate (income). Budget revisions are tracked via the budget versioning system, not via COs.',
      },
      {
        q: 'What was the riskiest migration scenario?',
        a: 'Existing IES users with pending PEs + COs + memorized custom reports. Migration auto-accepts pending PEs/COs (data preserved, reports may shift). Mitigated with in-product communication, CSM outreach, and rollback to old mode on step-2 failure.',
      },
      {
        q: 'Why is this not just a frontend feature?',
        a: 'It changed the cost source of truth across 8+ reports, the audit/versioning model, migration pipelines for 5 cohorts (existing IES, Advanced upgraders, Desktop migrators, NTTFs, Plus upgraders), and downstream interactions with Change Orders, Invoicing, and Verticalization. The DataGrid alone is one of the most complex grids in the product.',
      },
      {
        q: 'How did you keep the DataGrid performant at 3500 rows?',
        a: 'Virtual scroll, debounced cell edits, memoized row rendering, batched state updates. Cell edit SLA <200ms enforced as a perf budget.',
      },
      {
        q: 'What breaks if adoption goes 27% → 70%?',
        a: 'AI import queue + DataGrid perf on very large budgets. Mitigation: async import scaling, partition-based grid rendering, server-side aggregation for milestone rollups.',
      },
    ],
    landmines: [
      'Do NOT say "I built a budget UI" — you separated source-of-truth across the financial reporting layer.',
      'Do NOT skip the migration story — HMs probe migration risk on financial features.',
    ],
  },

  {
    id: 'consolidated-email',
    tier: 2,
    year: '2022 — 2023',
    company: 'Intuit · QuickBooks Workflows',
    title: 'Consolidated Email UI Experience',
    role: 'Frontend Engineer',
    tags: ['UX Systems', 'Preference Management', 'Backward Compatibility', 'Compliance'],
    oneLine:
      'Configurable email delivery letting users pick single-summary or per-transaction reminders — solving email fatigue while preserving legal compliance and backward compatibility.',
    headline: {
      reduction: '65% fewer emails',
      csat: '+40% satisfaction',
      modes: 'Per-txn · Consolidated',
      constraint: 'Legacy React, class components',
    },
    narrative: `In QuickBooks workflows, reminder notifications were sent per transaction, which caused severe email fatigue for customers managing high volumes. We introduced consolidated reminder emails, but initially it was a forced experience that didn't respect user preference and had legal/branding gaps.

I designed and delivered a new consolidated email UI experience that let users explicitly choose between per-transaction emails and a single summary email. This required introducing a toggle-based preference system while ensuring existing workflows, templates, and downstream email delivery logic remained backward compatible.

I also reworked the consolidated email content to meet updated legal and branding requirements, coordinating closely with design and legal constraints.`,
    problem: [
      'High-volume reminder workflows generated dozens of emails per customer — fatigue + unsubscribes.',
      'Initial consolidated rollout was forced, not user-choice — wrong product mental model.',
      'Consolidated email content had legal + branding gaps blocking production rollout.',
      'Codebase used class-based React (no hooks support yet) — refactor risk on shared components.',
    ],
    architecture: [
      {
        name: 'Toggle as Behavior Switch',
        detail:
          'The toggle is a user preference that controls which email generation path runs downstream — not just UI state. Persisted, respected per workflow, default chosen for backward compatibility with existing users.',
      },
      {
        name: 'Shared Component Refactor',
        detail:
          'Refactored shared email components to support both modes via props rather than duplicating logic. Avoided branching-logic explosion. Toggle component itself made reusable for future preference rows.',
      },
      {
        name: 'Freeform Email + CC/BCC',
        detail:
          'Preserved freeform email composition with CC/BCC support across both modes. Mode switch did not lose user-entered content.',
      },
      {
        name: 'Compliance Content Rebuild',
        detail:
          'Reworked consolidated email HTML/CSS for branding + legal accuracy. Email content treated as production-grade — review gate before merge.',
      },
      {
        name: 'Mock API + Test Strategy',
        detail:
          'Backend not ready during frontend dev. Built mock API for unit + integration tests, decoupling FE delivery from BE readiness. Documented failures in a shared QA doc.',
      },
    ],
    impact: [
      '65% reduction in email volume.',
      '~40% increase in customer satisfaction.',
      'Backward-compatible rollout — zero disruption to existing reminder workflows.',
      'Established preference-toggle pattern reused across workflow UI.',
    ],
    killerAnswer:
      "The hardest part was introducing user choice without breaking existing behavior. Changing notification delivery is risky because users rely on it. We had to preserve backward compatibility, meet legal requirements, and still reduce email volume — all through a UI that looked simple but controlled complex downstream behavior.",
    grillQuestions: [
      {
        q: 'How did you ensure the toggle didn\'t break existing workflows?',
        a: 'Default preserved old per-transaction behavior. Toggle changes were opt-in. Shared components refactored with mode-aware props, not new code paths. Existing tests continued to pass.',
      },
      {
        q: 'Why give users a choice instead of forcing consolidated?',
        a: 'Some users with low-volume workflows prefer per-transaction emails — they\'re easier to forward, file, or respond to individually. Forcing consolidation would reduce satisfaction for that cohort. Choice respects both mental models.',
      },
      {
        q: 'What if a third email mode is added later?',
        a: 'The toggle is currently binary, but the underlying mode prop is a string enum. Adding a third mode = extending the enum and adding the corresponding generation path. Shared components already pivot on mode prop.',
      },
      {
        q: 'How did the toggle state persist?',
        a: 'Workflow-level preference stored server-side, retrieved on workflow load, applied to email generation at send time. Not a session-only flag.',
      },
    ],
    landmines: [
      'Do NOT call this "a toggle and some HTML" — it is preference management controlling downstream behavior.',
      'Do NOT skip the legacy React constraint — working in class components without hooks demonstrates real-codebase competence.',
    ],
  },

  {
    id: 'implicit-ads',
    tier: 3,
    year: '2021',
    company: 'NIT Trichy · Final Year Project',
    title: 'Implicit Ads Detector — Multi-modal Deep Learning',
    role: 'Researcher / Engineer',
    tags: ['ML', 'Deep Learning', 'CNN', 'Multi-modal'],
    oneLine:
      'Multi-modal pipeline detecting embedded promotional content in YouTube videos — where ads don\'t look like ads.',
    headline: {
      accuracy: '~85% accuracy',
      recall: 'High recall on ad-class',
      stack: 'TensorFlow · CNN · Python',
      domain: 'Video segmentation',
    },
    narrative: `This project focused on detecting implicit advertisements in YouTube videos — cases where promotional content is embedded naturally inside the video rather than shown as explicit ad breaks. Existing approaches work well for TV ads or explicit segments, but fail when the tone, visuals, and pacing are similar to the main content.

I designed a multi-modal pipeline that splits videos into semantically meaningful segments using audio sentence boundaries, then classifies each segment using visual features from frames and contextual/audio cues.

On the visual side, I used CNN-based feature extraction to capture logos, product imagery, and branding patterns. On the audio/context side, I leveraged speech-derived signals and contextual cues like calls-to-action and brand mentions.`,
    problem: [
      'Audio-only classifiers fail for implicit ads — tone is similar to main content.',
      'Frame-difference fails — implicit ads don\'t change scenes.',
      'Whole-video binary classification is useless — ads are embedded segments, not full videos.',
      'Key insight: implicit ads are defined by intent, not by format.',
    ],
    architecture: [
      {
        name: 'Semantic Segmentation',
        detail:
          'Split video using audio sentence boundaries — semantically meaningful segments, not fixed time windows. Each segment becomes a classification unit.',
      },
      {
        name: 'Visual Features (CNN)',
        detail:
          'CNN feature extraction over sampled frames — logos, product shots, branding-heavy frames. Trained on labeled segment data.',
      },
      {
        name: 'Audio/Context Signals',
        detail:
          'Speech-derived features: brand names, urgency, call-to-action phrasing, emotion/excitement cues. Background music patterns.',
      },
      {
        name: 'Multi-modal Fusion',
        detail:
          'Visual + audio + contextual signals fused before final classification. No single modality is sufficient for implicit ads.',
      },
    ],
    impact: [
      '~85% accuracy with improved recall on the ad class.',
      'Designed for near real-time inference — suitable for moderation pipelines.',
      'Demonstrated that segment-level classification beats whole-video classification for embedded content.',
    ],
    killerAnswer:
      "The hardest part was that implicit ads don't look like ads. There's no clean visual boundary or audio spike. The only reliable signal is intent, which forced us to segment videos semantically and combine weak signals across vision, audio, and context instead of relying on any single modality.",
    grillQuestions: [
      {
        q: 'Why segment-level instead of whole-video classification?',
        a: 'Whole-video labels lose locality — a 10-minute video with one 30-second ad segment looks like a non-ad. Segment-level enables boundary detection, which is the actual product use case (skip the ad, not the video).',
      },
      {
        q: 'Biggest sources of false positives?',
        a: 'Genuine product reviews and educational content with brand names. Mitigation: weight contextual signals (urgency, CTA phrasing) higher than pure brand-mention frequency.',
      },
      {
        q: 'Why recall over accuracy?',
        a: 'In moderation use cases, missing an ad segment is worse than occasionally flagging non-ad content. False positives are cheap to review; false negatives violate platform policy.',
      },
      {
        q: 'Productionize at YouTube scale — what changes?',
        a: 'Offline batch inference per upload, not per view. GPU-backed feature extraction. Distillation to a smaller model for live serving. Continuous retraining as ad styles evolve.',
      },
    ],
    landmines: [
      'Do NOT pitch this as a GenAI project — it predates and is unrelated to LLMs.',
      'Do NOT overclaim productionization — it was a research/academic project.',
      'Position as analytical depth, not core strength.',
    ],
  },
];

const TIER_LABELS = {
  1: 'Signature',
  2: 'Strong support',
  3: 'Selective use',
};

/* ============================================================================
 * DEEP DIVES — STAFF-LEVEL DEPTH
 * ============================================================================
 * For each project: the layered chains, decision tradeoffs, algorithms,
 * war stories, edge cases, and retrospective lessons that surface when
 * interviewers go 3-4 levels deep. Use as Q→A→but-why→A→what-if→A material.
 * ========================================================================== */

const DEEP_DIVES = {
  'traffic-replay': {
    framing:
      'This is the project most likely to be probed at staff level because it touches every hard problem at once: distributed systems, security, data parity, observability, blast radius, performance. Be ready for chains, not isolated questions.',
    decisions: [
      {
        q: 'Where to capture traffic — in-process middleware, sidecar, or service-mesh mirror?',
        options: [
          'In-process middleware: lowest overhead, full request context.',
          'Sidecar with GoReplay: zero application coupling, independent lifecycle.',
          'Service-mesh (Envoy) mirror: leverages existing mesh, no new component.',
        ],
        chosen: 'Sidecar with GoReplay.',
        why: 'The monolith was 1.8M LOC with no mesh and limited willingness to change application code for non-functional concerns. Sidecar gave a separate failure domain, independent rollout, and zero risk of latency regressions in critical paths.',
        tradeoff: 'Extra ~10% CPU/memory per pod and a network hop. Accepted because the alternative (in-process) couples capture lifecycle to release lifecycle, and Envoy mirror was not available in the production cluster.',
      },
      {
        q: 'Why GoReplay specifically over tcpreplay, custom packet capture, or Envoy tap?',
        options: [
          'tcpreplay (L4): replays packets, not requests — loses HTTP semantics.',
          'Custom packet capture: full control, but reinvents a mature tool.',
          'GoReplay: HTTP-aware, mature, configurable filters, low overhead.',
        ],
        chosen: 'GoReplay.',
        why: 'HTTP-aware capture lets us filter by endpoint, partition by transaction ID, and replay against a different host trivially. Maturity reduced operational risk for a production-adjacent component.',
        tradeoff: 'Requires TLS termination inside the pod to capture plaintext. We accepted the Nginx-sandwich complexity for HTTP-level fidelity.',
      },
      {
        q: 'TLS handling — terminate at LB, terminate at sidecar, or capture encrypted?',
        options: [
          'Terminate at load balancer: simple, but plaintext crosses internal network.',
          'Sandwich inside pod (Nginx1 → GoReplay → Nginx2 → app): plaintext never leaves the pod.',
          'Capture encrypted + offline decryption: highest security, lowest fidelity, no real-time validation.',
        ],
        chosen: 'In-pod Nginx sandwich.',
        why: 'Plaintext is contained within the pod boundary. GoReplay sees decrypted HTTP for accurate parsing. The second Nginx re-encrypts (optional in some envs) before the app, preserving the contract that the app receives the same traffic shape.',
        tradeoff: 'Two Nginx instances per pod, more config surface. Accepted because security + fidelity were both first-class.',
      },
      {
        q: 'Bus partitioning — by tenant_id, by timestamp, or by transaction_id?',
        options: [
          'tenant_id: groups all tenant traffic together, but loses request/response co-location.',
          'timestamp: distributes evenly, but breaks ordering for related events.',
          'transaction_id: guarantees request and response land on the same partition in order.',
        ],
        chosen: 'transaction_id as partition key.',
        why: 'A validator consumer must always see request followed by its response. Using transaction_id guarantees this without coordination logic on the consumer side. Workflows that span multiple requests are correlated upstream and propagate the same transaction_id, preserving locality.',
        tradeoff: 'Requires upstream services to generate consistent transaction IDs. We standardized on a header (X-Transaction-Id) and added middleware to generate one if absent.',
      },
      {
        q: 'Downstream write handling — allow real writes, idempotent retries, or mock everything?',
        options: [
          'Allow real writes: true e2e validation, but doubles downstream traffic and requires idempotent downstreams.',
          'Idempotent retries: relies on every downstream being idempotent — none of them are guaranteed to be.',
          'Mock at Envoy + Wiremock: zero blast radius, sacrifices true e2e behavior.',
        ],
        chosen: 'Mock at Envoy + Wiremock.',
        why: 'Downstreams could not commit to idempotency, and doubling their traffic would violate their SLAs. Mocking bounds blast radius to zero — the parallel server can never touch external state — and we still get response/data/perf parity for the upstream surface.',
        tradeoff: 'Cannot validate the true downstream side-effect chain. We accepted this because the alternative (corrupting downstream production state) is unacceptable. True e2e is validated separately in non-prod.',
      },
      {
        q: 'Data validation algorithm — full diff, sampled diff, or workflow-scoped graph traversal?',
        options: [
          'Full-table diff: correct but O(table size); infeasible at TB scale.',
          'Sampled diff: misses low-frequency mismatches.',
          'Workflow-scoped BFS over FK graph, bounded by tenant + time window.',
        ],
        chosen: 'Workflow-scoped BFS.',
        why: 'A write workflow touches a known, bounded set of tables. Per-workflow config encodes the impacted tables; BFS traverses from tenant_id + parent_record_id within a bounded time window. Cost is O(impacted rows), not O(table).',
        tradeoff: 'Requires accurate workflow→tables mapping config. Drift in this config = silent validation gaps. Mitigated by config review on every new workflow and a periodic table-coverage audit.',
      },
      {
        q: 'Replay rate — sync 1×, async 1×, or async with variable speed (0.5×/2×/3×)?',
        options: [
          'Sync 1×: easiest correctness reasoning, but couples validator perf to prod.',
          'Async 1×: decouples, but cannot stress test.',
          'Async variable: decouples + enables stability testing under peak.',
        ],
        chosen: 'Async with variable speed.',
        why: 'Critical for the Oracle Exit and Hibernate Upgrade initiatives — needed to validate behavior at 3× peak before FY peak hit production. Decoupling capture from replay rate lets the validator catch up or run faster independently.',
        tradeoff: 'Validation lag — mismatches surface seconds-to-minutes after the request. Acceptable for non-real-time validation.',
      },
    ],
    algorithms: [
      {
        name: 'Response normalization',
        description:
          'Before comparison, both responses pass through a normalizer: skip variable headers (X-Request-Id, Date, Set-Cookie), normalize JSON (sort object keys, treat arrays representing sets as unordered), apply numeric tolerance (1e-6 for floats), and ignore fields registered in the per-workflow ignore list (IDs, timestamps, generated tokens).',
        complexity: 'O(response size) per comparison.',
        why: 'Without this, ~30% of comparisons were false positives in the early prototype. Normalization is the difference between a usable tool and a noise generator.',
      },
      {
        name: 'BFS data validation',
        description:
          'For a given write workflow: (1) lookup impacted tables from config, (2) start BFS from tenant_id + parent_record_id, (3) traverse FK edges in both DBs, (4) collect rows within bounded time window (request_timestamp ± Δ), (5) diff resulting row sets with normalization (ignore IDs, timestamps, audit columns).',
        complexity: 'O(impacted rows × avg row size) per workflow execution.',
        why: 'Full-table diff is infeasible at TB scale and full-row diff is noisy. Scoping by tenant + parent_record + time window gives bounded, deterministic, semantically meaningful comparison.',
      },
      {
        name: 'Performance bucketing (TP90/TP95/TP99)',
        description:
          'Per workflow, response times tracked in a sliding window. Percentiles computed using t-digest for efficient streaming aggregation. Anomalies surfaced via z-score on a rolling baseline (last N hours).',
        complexity: 'O(log N) insert into t-digest, O(1) percentile query.',
        why: 'Naive percentile (sort and pick) is O(N log N) per query and infeasible at our request volume. t-digest gives accurate tail percentiles at low memory cost.',
      },
    ],
    numbers: [
      { metric: 'Sidecar overhead', value: '~10% CPU & memory', note: 'Measured under peak production load. Capture + forwarding both async to keep request path latency unchanged.' },
      { metric: 'Total requests replayed', value: '300M+', note: 'Across the lifetime of the framework, peak day ~3M.' },
      { metric: 'Load multiplier supported', value: '0.5× / 2× / 3×', note: 'Used for stress testing before FY peak.' },
      { metric: 'Functional issues caught', value: '20+', note: 'Before customer impact, primarily during Oracle Exit.' },
      { metric: 'Performance issues caught', value: '30+', note: 'TP90/95/99 regressions surfaced per workflow.' },
      { metric: 'Manual regression hours saved', value: '1000+', note: 'Org-wide across initiatives.' },
      { metric: 'Hibernate upgrade hours saved', value: '200+', note: 'Single initiative; framework was primary validation tool.' },
      { metric: 'Smooth releases enabled', value: '70+', note: 'Oracle Exit initiative, zero P0/P1.' },
    ],
    warStories: [
      {
        scenario: 'Validator CPU saturation at 3× replay',
        whatHappened:
          'During the first 3× load test, validator pods OOM-ed and CPU saturated within minutes. Replay backlog exploded; comparisons stalled.',
        howResolved:
          'Two fixes in sequence: (1) horizontally scaled consumers from 2 to 8 pods, partitioned by transaction_id hash; (2) optimized the JSON diff hot path — switched from a recursive object walk to a streaming structural diff. CPU dropped ~60% per pod.',
        lesson:
          'Assume the validator is the bottleneck before the bus or storage. The bus is built for throughput; bespoke validator code is where naive implementations bite.',
      },
      {
        scenario: '30% false positive flood on first prototype',
        whatHappened:
          'Initial response comparison flagged ~30% of replays as mismatched. Investigation showed timestamps, generated IDs, and X-Request-Id headers differing by design.',
        howResolved:
          'Built a per-workflow field-ignore registry. Added semantic JSON diff (sort keys, set semantics for unordered arrays, numeric tolerance). Surfaced still-failing mismatches in Splunk dashboards with categorization (ignored / acknowledged / real). False positive rate dropped to <2%.',
        lesson:
          'Normalization is a first-class feature. Without it the tool is unusable — noise drowns signal.',
      },
      {
        scenario: 'Stale cloned database during long replay window',
        whatHappened:
          'During a multi-hour replay run, the cloned DB (refreshed weekly) drifted from production state. Data validation flagged drift mismatches as failures.',
        howResolved:
          'Bounded the data comparison time window strictly to the request timestamp ± Δ. Made FK traversal time-window-aware. Surfaced drift outside the window separately as informational, not failure.',
        lesson:
          'Data parity is time-sensitive, not absolute. The framework must understand that production moves forward during validation.',
      },
      {
        scenario: 'Outbox events re-published from parallel server',
        whatHappened:
          'In an early version, the parallel server processed write workflows and triggered outbox inserts. Those inserts got CDC-published to consumers, causing duplicate downstream events.',
        howResolved:
          'Added outbox-write mocking to the Wiremock config on the parallel server. Outbox table writes intercepted and dropped. Verified via consumer-side dedup metrics.',
        lesson:
          'Any side effect — direct write, event, notification — must be mocked. "Downstream calls" is too narrow a definition.',
      },
      {
        scenario: 'Encryption key rotation mid-replay',
        whatHappened:
          'IDPS key rotated while replay middleware had in-flight messages encrypted with the old key. Validator started failing to decrypt.',
        howResolved:
          'Added graceful fallback: try current key, then previous key, then skip with alert. Updated key rotation runbook to include validator restart timing.',
        lesson:
          'Stateful crypto + async pipelines need explicit key-version handling. Don\'t assume rotation is instantaneous.',
      },
    ],
    edgeCases: [
      { case: 'Long-running requests (>30s)', handling: 'Transaction_id partition still guarantees pairing. Validator has a configurable timeout per workflow; on timeout, marked as inconclusive, not mismatch.' },
      { case: 'Out-of-order responses in same partition', handling: 'Bus guarantees ordering per partition. If misordering still observed (rare bus issue), correlation via transaction_id covers it — pairing logic does not depend on adjacency.' },
      { case: 'Workflow version mismatch (newer code in parallel)', handling: 'Expected when validating refactors. Surfaced as warning, not error. Per-workflow config has an "allow-divergence" flag for known-divergent fields.' },
      { case: 'Tenant in-flight migration', handling: 'Tenants undergoing data migrations are excluded from data validation via a tenant block list. Functional + performance validation continues.' },
      { case: 'Replay validator pod crash mid-batch', handling: 'Messages remain on bus, reprocessed on consumer restart. At-least-once delivery + idempotent validation (re-running produces same result).' },
    ],
    whatIWouldChange:
      'Three things. (1) Multi-tenant middleware from day one — we duplicated infra per team and paid ~30% extra cost retrospectively. (2) A diff visualization layer with categorized common mismatches and auto-suggested ignore-registry entries — onboarding new workflows took longer than it should have. (3) Streaming capture instead of full request body persistence — storage costs scaled poorly. Worth it for the wins, but expensive.',
    chains: [
      {
        title: 'The TLS / capture-layer chain',
        steps: [
          { q: 'Why sidecar, not in-process?', a: 'Zero coupling to app lifecycle, independent rollout, separate failure domain.' },
          { q: 'How do you handle HTTPS?', a: 'Nginx terminates TLS inside the pod, GoReplay captures plaintext, Nginx re-encrypts to the app.' },
          { q: 'Why not capture encrypted and decrypt offline?', a: 'Loses real-time validation. We accepted in-pod plaintext because the pod is the security boundary anyway.' },
          { q: 'What\'s the actual overhead?', a: '~10% CPU and memory under peak. Async forwarding keeps request latency unchanged.' },
          { q: 'How did you measure it?', a: 'A/B comparison: cluster with sidecar vs without, identical traffic, p95 and p99 latency tracked. Resource via Prometheus.' },
        ],
      },
      {
        title: 'The data-parity correctness chain',
        steps: [
          { q: 'How do you compare data across two DBs?', a: 'BFS over FK relationships from tenant_id + parent_record, scoped by time window, with field normalization.' },
          { q: 'How do you know your ignore-list isn\'t hiding real bugs?', a: 'Ignored fields are reviewed per workflow. Anything not on the list flags. Periodic audit compares the list against schema changes.' },
          { q: 'What about eventual consistency between the two DBs?', a: 'Time-window bound. Compare within request_timestamp ± Δ. Drift outside the window is reported separately as informational.' },
          { q: 'What if the cloned DB has stale data?', a: 'Weekly refresh; bounded comparison window keeps stale-vs-prod drift outside scope of failure-class mismatches.' },
          { q: 'Can you prove a clean validation run is actually clean?', a: 'Sampling-based audit: a subset of "clean" workflows manually inspected. False-negative rate held below 1%.' },
        ],
      },
      {
        title: 'The blast-radius chain',
        steps: [
          { q: 'What happens if the replay system goes down?', a: 'Nothing customer-facing. Production traffic unaffected, validation coverage drops temporarily.' },
          { q: 'What if a replay corrupts downstream?', a: 'Cannot happen by design. All downstream writes are mocked at Envoy + Wiremock. Reads pass through.' },
          { q: 'What\'s the worst-case failure?', a: 'Missing a regression. The framework is passive — it can fail to catch, never cause.' },
          { q: 'Could the parallel server be misconfigured to write to prod?', a: 'In theory yes. Config is gated by deployment review + a startup check that asserts mock mode. Two-person review on infra changes.' },
        ],
      },
    ],
  },
  'mysql-postgres': {
    framing:
      'Migrations are evaluated on three axes: correctness, rollback safety, and operational discipline. Be ready for each.',
    decisions: [
      {
        q: 'Direct migration vs staged via MySQL 8?',
        options: [
          'Staged (5.7 → 8.0 → Postgres): incremental risk, familiar intermediate.',
          'Direct (5.7 → Postgres): single effort, immediate Postgres benefits.',
        ],
        chosen: 'Direct.',
        why: 'Staged means two cutovers, two parity efforts, MySQL 8 licensing interim, dual-system overhead, and delayed Postgres benefits. Decision matrix scored Direct higher on cost, time-to-value, complexity, and disruption.',
        tradeoff: 'Larger one-time risk surface. Bought down with three parity layers (DB, traffic replay, data lake) and rollback cluster ready at all times.',
      },
      {
        q: 'Aurora Postgres vs RDS Postgres vs Aurora Serverless v2?',
        options: [
          'RDS Postgres: compatible, manual scaling, slower failover.',
          'Aurora Serverless v2: auto-scaling, variable cost.',
          'Aurora Postgres provisioned: highest performance, predictable cost.',
        ],
        chosen: 'Aurora Postgres provisioned.',
        why: 'Team knew Aurora from MySQL Aurora — shared storage, fast clones, backtrack. Enterprise-grade for mission-critical workloads. Predictable cost at sustained load.',
        tradeoff: 'Manual compute scaling. Acceptable because workload is predictable.',
      },
      {
        q: 'Three-cluster topology — overkill or necessary?',
        options: [
          'Two clusters (A live, B target, no rollback): simpler but no fast rollback.',
          'Three clusters (A → B → C) with reverse DMS ready.',
        ],
        chosen: 'Three clusters.',
        why: 'Blast radius of failed cutover on $270B/year platform is unacceptable. Cluster C with reverse DMS gives tested, ready-to-execute rollback in minutes, not days.',
        tradeoff: 'Extra infra cost during cutover. Decommissioned post-bake. Worth the optionality.',
      },
      {
        q: 'Collation handling — query-level LOWER() vs DB-level ICU collation?',
        options: [
          'Query-level LOWER(): touches every HQL query.',
          'Application-level normalization: business logic owns it.',
          'DB-level ICU non-deterministic collation matching MySQL utf8_general_ci.',
        ],
        chosen: 'DB-level ICU collation.',
        why: 'Zero query changes, indexes still work, native comparison perf. Matches MySQL semantics exactly without auditing every WHERE clause. Single migration applies; rollback trivial.',
        tradeoff: 'Non-deterministic collation slight perf overhead vs deterministic. Acceptable alternative was hundreds of query changes.',
      },
      {
        q: 'Outbox handling — replicate via DMS, or set up Postgres outbox independently?',
        options: [
          'Replicate outbox via DMS: simple, but events re-publish to consumers.',
          'Independent Postgres outbox with temp Kafka topics during parity, switch at cutover.',
        ],
        chosen: 'Independent outbox with temp topics.',
        why: 'Replicating outbox would cause CDC consumers to see duplicate events during parity — broken ordering, broken idempotency. Temp topics isolated parallel-server events. Cutover: drain MySQL outbox, stop forward DMS, switch to original topics.',
        tradeoff: 'Temp topic infra during parity. Required Outbox + UIP team coordination.',
      },
      {
        q: 'Why one-shot cutover vs incremental migration?',
        options: [
          'Incremental: per-table or per-tenant, dual-write in application.',
          'One-shot: drain, cutover, validate, done.',
        ],
        chosen: 'One-shot.',
        why: 'MySQL and Postgres are fundamentally incompatible — dual-write requires app-level translation = permanent tech debt and perf cost. Schema differences (engine, charset, partition, sequences) make per-table impractical. One-shot also gives clean rollback: revert config, restart.',
        tradeoff: '2-3 hour downtime. Mitigated by lowest-traffic scheduling, exhaustive cutover rehearsals, pre-signed-off readiness checklists.',
      },
    ],
    algorithms: [
      {
        name: 'Sequence sync post-load',
        description: 'After DMS bulk load, every Postgres BIGSERIAL must be synced to MAX(id). Script iterates sequences and runs setval(seq, COALESCE(MAX(id), 1)). Verified by audit query.',
        complexity: 'O(N tables).',
        why: 'Without this, first insert post-cutover collides with existing ID — silent corruption.',
      },
      {
        name: 'Workflow-scoped data parity (DeepChecks)',
        description: 'Per high-traffic workflow: scheduled diff between source/target — row count, column-level checksum sample, spot-row diff. Field normalization. Bounded by tenant + time window for in-flight writes.',
        complexity: 'O(sampled rows) per check, parallelizable.',
        why: 'Full-row, full-table diff at 32TB is infeasible. Sampling + checksum gives statistical confidence at tractable cost.',
      },
      {
        name: 'BFS over FK graph for impacted-data verification',
        description: 'Per write workflow: traverse FK graph from tenant_id + parent_record. Spot-check DMS preserved relational integrity.',
        complexity: 'O(impacted rows) per workflow.',
        why: 'DMS can replicate rows without preserving relational integrity in edge cases. BFS catches FK orphans.',
      },
    ],
    numbers: [
      { metric: 'Flyway migrations converted', value: '684+', note: 'V20170216 to V20250821. AUTO_INCREMENT → BIGSERIAL, UNSIGNED → CHECK, ENGINE/CHARSET stripped.' },
      { metric: 'Tables migrated', value: '100+', note: 'Plus indexes, FK constraints, sequences.' },
      { metric: 'Total data size', value: '32 TB + 5 TB audit', note: 'Largest unsharded migration in South Asia Pacific per AWS SME.' },
      { metric: 'Environments', value: '8+', note: 'qal, e2e, prf, stg, prod + regional. Each with config drift requiring per-env validation.' },
      { metric: 'JSON parsing code reduction', value: '~60%', note: 'jsonb operators (->>, @>) replaced custom JSON_EXTRACT wrappers.' },
      { metric: 'P0/P1 issues post-cutover', value: '0', note: 'Three parity layers + rehearsed rollback.' },
      { metric: 'Cutover window', value: '2-3 hours', note: 'Lowest-traffic weekend. Code freeze + outbox drain + DMS switch + app config + post-checks.' },
      { metric: 'Stored procedures rewritten', value: '5+', note: 'PL/pgSQL: outbox partition mgmt, heartbeat, data seeding.' },
    ],
    warStories: [
      {
        scenario: 'CHAR(15) silent join failure',
        whatHappened: 'During parity, HQL JOINs returned different result sets in Postgres. CHAR(15) padding: MySQL ignores trailing spaces in comparison, Postgres does not. \'abc\' = \'abc \' is true in MySQL, false in Postgres.',
        howResolved: 'Migration converted all CHAR(15) → VARCHAR(255). Java entities already use String, no code change. Re-ran parity, JOINs matched.',
        lesson: 'Fixed-length string semantics are a silent foot-gun. VARCHAR by default.',
      },
      {
        scenario: 'AUTO_INCREMENT vs sequence gaps',
        whatHappened: 'Post-DMS-load, first INSERT in non-prod failed with duplicate key. Sequence at 1, MAX(id) ~10M.',
        howResolved: 'Ran setval() for every sequence post-load. Added to runbook as mandatory step.',
        lesson: 'Bulk-load + sequence handoff is a known foot-gun. Bake into runbook, do not rely on memory.',
      },
      {
        scenario: 'JSON column custom type',
        whatHappened: 'MySQL stored JSON as native; Postgres needed jsonb. Hibernate did not handle conversion automatically.',
        howResolved: 'Built PostgreSQLJsonType implementing Hibernate UserType. @TypeDef on entities. Round-trip serialization tested. No MySQL-specific JSON functions in queries, so query layer was clean.',
        lesson: 'For non-trivial type mapping, build a Hibernate UserType. Generic ORM behavior is a coin flip on edge types.',
      },
      {
        scenario: 'Transaction isolation surprise',
        whatHappened: 'Idempotency check in payment flow relied on REPEATABLE READ (MySQL default). Postgres defaults to READ COMMITTED, occasionally missing duplicates under concurrent load.',
        howResolved: 'Audited all @Transactional methods (95 locations). Explicit @Transactional(isolation = Isolation.REPEATABLE_READ) on critical paths: idempotency, concurrent series updates, name uniqueness. Concurrent test suite added.',
        lesson: 'Isolation level defaults differ across engines. Migration is the time to make isolation explicit.',
      },
      {
        scenario: 'Outbox during cutover — duplicate event risk',
        whatHappened: 'Plan was to stop forward DMS and switch app. But MySQL outbox still had unpublished events. If we stopped, they would never publish; if we let them publish, consumers would see them after Postgres published, causing ordering issues.',
        howResolved: 'Added explicit "drain MySQL outbox" step between code freeze and DMS stop. Outbox CDC catches up, consumers process, then DMS stops, then Postgres takes over publishing to original topics.',
        lesson: 'CDC pipelines have inertia. Cutover sequence must account for in-flight events, not just in-flight transactions.',
      },
    ],
    edgeCases: [
      { case: 'DMS lag spike during cutover', handling: 'Runbook explicit DMS lag check before proceeding. If lag > threshold, abort and retry. Lag monitor alerts during cutover.' },
      { case: 'Reverse replication direction switch', handling: 'Pre-cutover, reverse DMS staged not active. At cutover, forward DMS stops, reverse DMS starts. Validated in rehearsals.' },
      { case: 'Schema drift across environments', handling: 'Pre-migration audit: dump and diff every env. Drift reconciled in MySQL before migration. Otherwise env-specific paths multiply.' },
      { case: 'NULLS ordering difference (FIRST vs LAST)', handling: 'Audit found most ORDER BY on non-nullable id columns — no impact. Nullable date columns got explicit NULLS LAST in HQL.' },
      { case: 'Postgres sequence cache and ID gaps', handling: 'Postgres pre-allocates 20 IDs by default; gaps appear on crash/rollback. No business logic assumes consecutive IDs — verified by code audit.' },
      { case: 'In-flight tenant transactions at cutover', handling: 'Code freeze + readiness checklist. No active long-running txns. App drained before DMS stop.' },
    ],
    whatIWouldChange:
      '(1) Earlier schema drift audit — discovered non-standard env customizations late. (2) Better DMS lag observability — had it, but alerting thresholds were tuned during cutover, not before. (3) Rehearse rollback in production-equivalent staging twice — did once, second would have surfaced a timing assumption.',
    chains: [
      {
        title: 'The direct-migration justification chain',
        steps: [
          { q: 'Why direct migration?', a: 'Single effort, immediate benefits, no MySQL 8 interim cost, no dual-system overhead.' },
          { q: 'What if Postgres 15 has a regression you don\'t catch?', a: 'Three parity layers de-risk. Rollback cluster ready, tested. Rollback target: minutes.' },
          { q: 'Have you actually tested the rollback?', a: 'Yes, non-prod cutover rehearsals end-to-end including outbox drain, DMS direction switch, app restart.' },
          { q: 'What\'s your rollback trigger?', a: 'Multiple: deepchecks mismatch above threshold, DMS lag spike, P0 customer symptoms, replication health failure.' },
          { q: 'What if you discover the issue 12 hours post-cutover?', a: 'Reverse DMS keeps syncing. Rollback up to the point reverse replication is healthy. Beyond: PITR from backup + manual reconciliation.' },
        ],
      },
      {
        title: 'The data-correctness chain',
        steps: [
          { q: 'How do you know 100M rows match?', a: 'Three layers: DB parity (count + checksum + spot-diff), app parity (traffic replay), pipeline parity (batch ingestion).' },
          { q: 'What if deepchecks shows 0.01% drift?', a: 'Investigate. Most likely non-deterministic field for ignore list. If real, block cutover.' },
          { q: 'How do you handle a tenant in active write at cutover?', a: 'Code freeze, app drained, outbox drained. No active writes at cutover start.' },
          { q: 'What about read-only consumers reading stale Postgres post-cutover?', a: 'Forward DMS stopped at cutover. Postgres is source of truth. Consumers see Postgres-only state.' },
        ],
      },
      {
        title: 'The downstream impact chain',
        steps: [
          { q: 'What about CDC consumers downstream of MySQL?', a: 'Two CDC integrations: outbox (denormalized events) and batch ingestion (normalized to data lake). Parallel pipelines for Postgres validated during parity.' },
          { q: 'How do consumers know which DB to listen to?', a: 'During parity, parallel pipelines publish to temp topics. At cutover, MySQL outbox drained, Postgres outbox starts publishing to original topics. Consumers see no topic change.' },
          { q: 'What if a consumer caches MySQL-specific entity IDs?', a: 'IDs preserved — DMS keeps PKs exactly. Verified in parity.' },
        ],
      },
    ],
  },
  'change-orders': {
    framing:
      'Financial features get probed hardest on correctness and edge cases. Status transitions, rollup invariants, and audit traceability are the three pillars they will hammer.',
    decisions: [
      {
        q: 'Change Order as separate transaction vs estimate edit?',
        options: [
          'Edit estimate in place: simplest, breaks audit trail.',
          'Versioned estimate: complex versioning on a financial entity.',
          'Separate CO linked to estimate: preserves immutability, clean audit.',
        ],
        chosen: 'Separate CO linked to estimate.',
        why: 'Audit traceability is non-negotiable for financial docs. Original estimate must remain immutable. Customer signoff applies to a specific state — that state must be preserved verbatim.',
        tradeoff: 'More complex rollup (estimate = original + accepted COs). Extra UI surface. Worth it for audit + signoff.',
      },
      {
        q: 'Allow CO to edit any line attribute, or only qty on existing lines?',
        options: [
          'Full edit: max flexibility, breaks "what changed" audit.',
          'Qty-only on existing + full edit on new: maintains link to original.',
        ],
        chosen: 'Qty-only on existing + full edit on new.',
        why: 'A CO is "what changed about scope/quantity," not "rewrite the estimate." If user needs to change rate or description, they create a new estimate. Keeps narrative clear: existing got more/less, new items added.',
        tradeoff: 'Users sometimes want to edit other attributes. Documented workaround: new estimate.',
      },
      {
        q: 'Rollup calculation — independent per surface, or single pipeline?',
        options: [
          'Each report calculates its own rollup: simpler per-surface.',
          'Single rollup pipeline feeding all surfaces: more upfront work, no drift.',
        ],
        chosen: 'Single rollup pipeline.',
        why: 'Independent paths drift over time. Bug discovered in pre-prod E vs A report had a sibling bug in WIP report — same root cause. Single pipeline = single source of truth = single bug surface.',
        tradeoff: 'Higher upfront coordination cost. Massive payoff in correctness.',
      },
      {
        q: 'Status-based inclusion rules — implicit or explicit?',
        options: [
          'Implicit: "if accepted, include" buried in helpers.',
          'Explicit: per-status inclusion rules documented and tested.',
        ],
        chosen: 'Explicit.',
        why: 'Pending shows on PCE but does not contribute. Accepted contributes. Declined excluded. Rules must be testable and inspectable, not "if status === \'ACCEPTED\'" buried in a helper.',
        tradeoff: 'More upfront docs. Pays back first time a sibling team asks "what about declined COs in this new report?"',
      },
      {
        q: 'CO + PCE relationship — bidirectional or one-way?',
        options: [
          'One-way (CO knows PCE): simple, but PCE cannot show CO sections.',
          'Bidirectional: PCE shows accepted COs as sections, CO references PCE.',
        ],
        chosen: 'Bidirectional.',
        why: 'PCE displays accepted COs as appended sections (auditor-friendly). CO references parent PCE (creation context, validation). One-way forces redundant queries.',
        tradeoff: 'Two referential paths to keep consistent. Wrapped in transaction at accept/decline.',
      },
      {
        q: 'Invoicing — allow from CO directly or only from PCE?',
        options: [
          'Allow from CO: matches user mental model, creates two invoice paths.',
          'Only from PCE (aggregates accepted COs): single invoice path.',
        ],
        chosen: 'Only from PCE.',
        why: 'Single invoice path = no double-billing risk. PCE total already reflects accepted COs. CO is for scope tracking, not separate billing.',
        tradeoff: 'Users initially confused. Mitigated by disabling Create Invoice CTA on CO + KB.',
      },
      {
        q: 'Tax handling — recalculate on CO accept, or preserve PCE tax?',
        options: [
          'Preserve PCE tax: simplest, understates tax on accepted CO scope.',
          'Recalculate on CO accept: correct, invalidates user override.',
        ],
        chosen: 'Recalculate on accept, remove PCE override.',
        why: 'Tax must reflect updated scope to comply with sales tax rules. Overrides represent a decision that becomes stale when scope changes. Documented: accepting a CO removes any PCE tax override.',
        tradeoff: 'Lost user override. Surfaced in CO accept warning. Power-user complaint, accepted as correctness call.',
      },
    ],
    algorithms: [
      {
        name: 'Rollup recomputation pipeline',
        description: 'On CO status transition: (1) fetch parent PCE, (2) fetch accepted COs, (3) sum line-level cost and income, (4) recompute discount/tax/shipping per merge rules, (5) recompute margin, (6) emit rollup event. Idempotent.',
        complexity: 'O(accepted COs × lines per CO).',
        why: 'Status changes are the only triggers. Polling wasteful. Idempotency lets us re-run on suspicion of drift without side effects.',
      },
      {
        name: 'Status state machine with invariants',
        description: 'States: Pending → Accepted, Pending → Declined, Accepted → Declined (warning if partially invoiced). Invariants: no Declined → Pending. Pending → Accepted requires signoff (Phase 2). Transitions emit audit entries.',
        complexity: 'O(1) per transition.',
        why: 'Financial state must be deterministic. State machine encodes legal transitions; everything else rejected at service layer.',
      },
      {
        name: 'Discount % → $ merge calculation',
        description: 'PCE has 10% discount. CO has no discount in Phase 1. On accept, CO lines added; discount remains 10% on new total. If PCE discount was $, just combine. If %, recompute against new pre-discount total.',
        complexity: 'O(1) per merge.',
        why: 'Discount semantics differ between % and $. Merge rules documented and unit-tested for every combination.',
      },
    ],
    numbers: [
      { metric: 'Manual estimate edit reduction', value: '80%', note: 'Pre vs post-launch in tenants with active project workflows.' },
      { metric: 'Businesses impacted', value: '50K+', note: 'Across QBO Alpha rollout in US/CA/AU/UK (TXP-dependent).' },
      { metric: 'Reports with new CO columns', value: '6', note: 'E vs A, E vs A by Project, WIP, Committed Costs, Cost to Complete, CO Report.' },
      { metric: 'Status transitions modeled', value: '3 + 1 special', note: 'Pending→Accepted, Pending→Declined, Accepted→Declined-after-invoicing.' },
      { metric: 'Audit log integration', value: 'Per-edit + restore', note: 'Every edit logged under CO. Restore Version supported.' },
    ],
    warStories: [
      {
        scenario: 'Double counting in pre-prod',
        whatHappened: 'Pre-launch testing: 2 accepted COs on a PCE, some KPIs counted one twice. Two independent calculation paths — KPI service vs report service — diverged on a recent change.',
        howResolved: 'Consolidated to a single rollup pipeline. KPI and report services subscribe to the materialized rollup. Drift impossible by design.',
        lesson: 'When two surfaces calculate the same metric independently, they will drift. Single pipeline is the only sustainable answer.',
      },
      {
        scenario: 'Partial-invoiced CO decline',
        whatHappened: 'User accepted a CO, partially invoiced it, declined it. Expected behavior undefined. Some users wanted invoice unchanged, others wanted it voided.',
        howResolved: 'Documented rule: invoice is point-in-time, never retroactively modified. Decline removes CO lines from PCE going forward, invoice stays. Warning on decline so user knows invoice will be stranded.',
        lesson: 'Financial documents are point-in-time records. Designing for "retroactive correctness" creates more confusion than it solves.',
      },
      {
        scenario: 'Tax override conflict',
        whatHappened: 'User set tax override on PCE (custom contract rate). On CO accept, rollup recomputed tax — override was lost.',
        howResolved: 'Explicit warning on CO accept: "Accepting will recalculate sales tax. Your custom override will be removed." Documented in KB. User chooses.',
        lesson: 'Financial overrides represent intent that must be re-affirmed on context change. Silent loss is unacceptable.',
      },
      {
        scenario: 'Estimate decline cascading to COs',
        whatHappened: 'User declined a PCE that had 2 accepted COs. Question: should COs follow to Declined, or stay Accepted but become "obsolete"?',
        howResolved: 'Decision: COs preserve their state for audit history. PCE decline shows warning ("These COs become obsolete"). If PCE re-accepted later, COs become valid again without manual restate.',
        lesson: 'Cascading state changes destroy audit history. Preserve state, communicate context.',
      },
    ],
    edgeCases: [
      { case: 'Multiple pending COs on same PCE', handling: 'All visible on PCE as grayed sections. None counted in totals. User accepts/declines each individually. No count restriction.' },
      { case: 'PCE has no accepted CO but has pending — invoice', handling: 'Invoice draws from PCE total (excludes pending). Pending surfaced for awareness but not billed.' },
      { case: 'Tax-exempt customer with CO', handling: 'Exemption respected. CO lines inherit taxable flag from PCE. Tax recalculated against exemption status.' },
      { case: 'Multi-currency PCE + CO', handling: 'CO must match PCE currency. Phase-2 multi-currency support extends this.' },
      { case: 'Discount % → $ rounding edge', handling: 'Banker\'s rounding (round-half-to-even) for $ conversion. Documented in tax/discount merge spec.' },
      { case: 'CO with negative line items', handling: 'Phase 1: total cannot be negative (lines can be, total cannot). Phase 2: full negative for refund-style COs.' },
    ],
    whatIWouldChange:
      '(1) Build rollup pipeline first, UI second. We built in parallel; integration ate two weeks. (2) Versioning of accepted CO state deeper than current restore — full point-in-time recreation. (3) Surface tax override warning earlier in CO creation flow, not just on accept — would have saved several escalations.',
    chains: [
      {
        title: 'The rollup-correctness chain',
        steps: [
          { q: 'How do you guarantee KPIs and reports show the same number?', a: 'Single rollup pipeline feeds both. Read from materialized rollup, not independent calculations.' },
          { q: 'What triggers the rollup?', a: 'CO status transitions: Pending→Accepted, Accepted→Declined, etc. Pipeline is idempotent.' },
          { q: 'What if the pipeline lags?', a: 'KPI/report shows last-good rollup. Lag monitored; alert fires above threshold. Bounded recompute means worst-case lag is seconds.' },
          { q: 'How do you prevent double-counting with 3 accepted COs?', a: 'Pipeline sums each CO\'s lines exactly once. Idempotency means re-running gives same answer. Unit test covers N-CO cases.' },
        ],
      },
      {
        title: 'The status-transition chain',
        steps: [
          { q: 'What happens when accepted CO is declined?', a: 'CO lines removed from PCE rollup. Totals recompute. Tax/discount recompute. Audit log records transition.' },
          { q: 'What if the CO was partially invoiced?', a: 'Warning shown. On confirm, CO lines removed from PCE, but invoice unchanged. Invoice is historical.' },
          { q: 'Can a declined CO be re-accepted?', a: 'Phase 1: no — decline is sticky. User creates new CO if scope returns. Phase 2 considers reversal.' },
          { q: 'How is this audited?', a: 'Every transition logged: timestamp, user, prior state, new state. Restore Version in UI.' },
        ],
      },
    ],
  },
  'project-budgets': {
    framing:
      'Probed on two axes: (1) source-of-truth migration without breaking reports/migrations/downgrades, and (2) DataGrid perf at scale. Be ready for both.',
    decisions: [
      {
        q: 'Why decouple Project Budgets from Project Estimates entirely?',
        options: [
          'Keep PE as combined cost + income source: matches today, breaks mental model for MM.',
          'Split: PB = cost source, PE = income source.',
        ],
        chosen: 'Split.',
        why: 'Construction businesses track 200+ cost codes internally but quote customers at 10 line items. Forcing both into one form breaks mental model and causes report drift. PE = customer-facing quote (income). PB = internal accounting (cost). Different audiences, different granularity.',
        tradeoff: 'Two entities to maintain, migration complexity for existing users. Worth it for the financial model correctness.',
      },
      {
        q: 'One budget per project, or multiple?',
        options: [
          'Multiple budgets per project: max flexibility, ambiguous source of truth.',
          'One budget per project: clear source of truth, matches FP&A model.',
        ],
        chosen: 'One per project.',
        why: 'Single internal source of cost truth. Reports unambiguous. Mental model: "the project budget" not "a budget among many." Multiple PEs per project is fine (negotiation iterations), but cost source must be singular.',
        tradeoff: 'Power users pushed back. Solved via budget versioning (audit log) in V2, not multiple budgets.',
      },
      {
        q: 'DataGrid — build custom or use existing FP&A component?',
        options: [
          'Build custom: full control, time cost.',
          'Reuse FP&A DataGrid: faster, extend for project-specific columns (milestones, dimensions).',
        ],
        chosen: 'Reuse + extend.',
        why: 'FP&A DataGrid already supports virtual scroll, cell editing, large row counts (P&L/B/S budgets). Reusing aligned UX across budget types and avoided building a 3500-row perf-tuned grid from scratch.',
        tradeoff: 'Some friction with FP&A team on extension points. Coordination cost worthwhile.',
      },
      {
        q: 'Migration trigger — auto vs opt-in?',
        options: [
          'Auto-migrate everyone: fastest, no choice, risk of surprise.',
          'Opt-in + auto-migrate after cutoff.',
          'Cohort-specific: NTTF/DTM auto, upgraders auto, existing IES opt-in.',
        ],
        chosen: 'Cohort-specific.',
        why: 'NTTFs/DTM have no historical cost — auto safe. Upgraders sign contract covering migration — auto-acceptable. Existing IES have history + memorized reports — opt-in respects workflow, with CSM outreach + cutoff for eventual auto.',
        tradeoff: 'Three migration paths. Necessary because cohorts have meaningfully different starting states.',
      },
      {
        q: 'Reporting source switch — instant or dual-mode?',
        options: [
          'Instant cutover: clean, breaks reports for non-PB users.',
          'Dual-mode: PB users see new (cost from PB), non-PB users see old (cost from PE).',
        ],
        chosen: 'Dual-mode during rollout.',
        why: 'Reports must keep working for users not on PB yet. Memorized + custom reports (1444+) carry user expectations. Dual-mode lets us migrate incrementally without breaking existing views.',
        tradeoff: 'Two report-generation paths during rollout. Cord-cut once 100% on PB.',
      },
      {
        q: 'AI import — sync or async?',
        options: [
          'Sync: simplest UX, exceeds 4s SLA at 100+ lines.',
          'Async with task tracking: progress indicator, resumable, notification on completion.',
        ],
        chosen: 'Async.',
        why: 'Imports of 100-300 lines take 45-50s. Sync would timeout or block UX. Async lets user navigate away.',
        tradeoff: 'More UX surface (in-progress modal, notifications, task list integration).',
      },
      {
        q: 'Budget versioning — separate system or reuse audit log?',
        options: [
          'Separate versioning: dedicated history, cleaner data model.',
          'Reuse audit log: leverages existing platform, less code.',
        ],
        chosen: 'Reuse audit log.',
        why: 'Audit log already supports version compare, restore, drill-down. Building parallel system would duplicate and create reconciliation headaches. Budget state (Draft/Locked/Version N) overlays cleanly.',
        tradeoff: 'Audit log designed for ad-hoc edit history, not formal versioning. Some UX work to surface "versions" as first-class.',
      },
    ],
    algorithms: [
      {
        name: 'Virtual scroll with row windowing',
        description: 'Only DOM-render rows in viewport + N-row buffer. Scroll position calculates window. Row heights memoized. Edit state hoisted out of row components to survive unmount/remount.',
        complexity: 'O(viewport size) DOM, O(N) memory for data only.',
        why: 'At 3500 × 23, naive render = 80K+ DOM nodes, browser locks. Virtual scroll keeps DOM bounded to ~50 rows regardless of total.',
      },
      {
        name: 'Debounced cell edit + batched state update',
        description: 'Cell edits debounced 200ms before propagating. Multiple cells batched. React.memo on row components prevents re-render of untouched rows.',
        complexity: 'O(changed rows) per update.',
        why: 'Naive update on every keystroke = full grid re-render per char. Unusable. Debounce + memo keeps perf snappy at all sizes.',
      },
      {
        name: 'AI import fuzzy P/S matching',
        description: 'For each row: tokenize description, fuzzy-match against catalog (Levenshtein + token overlap), score above threshold → suggest, below → "Create new" default. User confirms each row.',
        complexity: 'O(import rows × catalog size). Async, off main thread.',
        why: 'Construction P/S catalogs are large; naming varies. Fuzzy suggests, human confirms. Auto-accept = silent miscategorization.',
      },
      {
        name: 'Migration pipeline — async with step-level rollback',
        description: 'Two-step: (1) accept all pending PEs/COs, (2) migrate cost columns PCE → PB. Step 1 fail → log, surface to user. Step 2 fail → rollback to old mode. Idempotent: re-running picks up from last successful.',
        complexity: 'O(PEs + COs + lines) per tenant.',
        why: 'Long-running for large tenants. Async respects UX. Step-level rollback isolates failure. Idempotency allows retry without dirty state.',
      },
    ],
    numbers: [
      { metric: 'Adoption rate', value: '27%', note: 'Active IES project users (31% × 86% budgeting users).' },
      { metric: 'Businesses impacted', value: '~37K', note: 'Active IES with project workflows.' },
      { metric: 'DataGrid scale', value: '3500 × 23', note: 'Performance target supported in V2.' },
      { metric: 'Cell edit SLA', value: '<200ms', note: 'Enforced perf budget. Measured.' },
      { metric: 'Reports affected', value: '8+', note: 'E vs A, E vs A by Project, WIP, Committed Costs, Cost to Complete, Estimate & Progress Invoicing, Transaction List, CO Report.' },
      { metric: 'Memorized reports impacted', value: '1444+', note: 'Across 6 reports. Required dual-mode + report-level migration messaging.' },
      { metric: 'Flyway migrations', value: 'Per cohort', note: 'NTTF, DTM (Fresh + Importer), Upgrader (Plus/Advanced w/ or w/o PE), Existing IES (w/ or w/o PE, MC).' },
      { metric: 'AI import lines supported', value: '300 in V2', note: 'Up from 100 in V1. Async enabled the increase.' },
    ],
    warStories: [
      {
        scenario: 'DataGrid perf collapse past 1500 rows',
        whatHappened: 'Initial implementation rendered all rows on mount. At 1500, scroll froze; at 3000, browser crashed. Construction users routinely have 2000+ line budgets.',
        howResolved: 'Switched to virtual scroll with windowing. Memoized row components. Lifted edit state. Cell edit SLA dropped from 1.2s → <200ms at 3500.',
        lesson: 'Always perf-test at upper bound of expected scale. Construction has long tails average tests miss.',
      },
      {
        scenario: 'Custom report migration ambiguity',
        whatHappened: 'Tenants had custom reports with "Estimated Cost" column from PCE. After migration, PE no longer carried cost. Column went blank silently.',
        howResolved: 'Report-level message on affected: "Estimated Cost data moved to Project Budgets." Disabled future creation with PE-based cost columns. Users prompted to switch source.',
        lesson: 'Long tail of memorized/custom reports needs explicit handling, not silent breakage.',
      },
      {
        scenario: 'AI import false matches',
        whatHappened: 'Fuzzy P/S matching suggested wrong items for similar names. "Consulting" matched "Consultation Fee" at 90% — different income account.',
        howResolved: 'Lowered confidence threshold. "Create new" as default for ambiguous. Forced user confirmation. Financial accuracy > automation convenience.',
        lesson: 'AI matching needs human-in-the-loop for financial data. False positives = miscategorized revenue = audit headache.',
      },
      {
        scenario: 'Multicurrency block edge case',
        whatHappened: 'User toggled MC mid-budget-creation. Migration assumed MC off; warning fired but user proceeded. Data partially migrated, partially in old form.',
        howResolved: 'Hard block on MC toggle when active budget exists (Phase 1). Warning insufficient — block required. Phase 2 added proper MC support.',
        lesson: 'For financial features with conflicting modes, warning is insufficient when destructive. Block until safe.',
      },
      {
        scenario: 'Migration step 2 failure mid-tenant',
        whatHappened: 'Tenant\'s step-2 hit unexpected schema variant — non-standard custom field config. Migration stalled.',
        howResolved: 'Async pipeline detected failure, rolled back to old mode, alerted PD. Manual reconciliation via CSM. Subsequent migration after schema variant handled.',
        lesson: 'Async pipelines need step-level rollback + alerting. A tenant cannot be left half-migrated.',
      },
    ],
    edgeCases: [
      { case: 'Project with no PE but has PB', handling: 'Reports show estimated cost (from PB), income blank. PE can be added later — independence by design.' },
      { case: 'PB deleted while reports active', handling: 'Reports show blank Estimated Cost. PE/EI unchanged. Soft delete + warning on delete.' },
      { case: 'Multiple PEs on same project, one PB', handling: 'PB unchanged. Reports aggregate income across PEs, cost from single PB. By design (1:N for income, 1:1 for cost).' },
      { case: 'Construction cost codes with hierarchy', handling: 'P/S hierarchy preserved in budget structure. "101 Painting" → "101.1 Floor", "101.2 Ceiling". Reports respect hierarchy for drill-down.' },
      { case: 'Budget revision changing line counts', handling: 'V2 versioning: Original/Diff/Total columns in reports. Diff can be negative (line removed). Reports reconstruct any version from audit log.' },
      { case: 'Downgrade from IES → Advanced', handling: 'Synthetic PE created carrying PB cost data; existing PEs unchanged. Reports unbroken. White-glove for edge cases.' },
    ],
    whatIWouldChange:
      '(1) Migration pipeline observability from day one. (2) Test custom/memorized reports earlier — discovered the long-tail late. (3) Build AI matching as confidence-banded UX from the start instead of single-threshold tuned later. (4) Multicurrency in V1 — blocking 0.38% felt right but created Phase-2 catch-up cost.',
    chains: [
      {
        title: 'The source-of-truth migration chain',
        steps: [
          { q: 'Why decouple cost from income?', a: 'Different audiences, different granularity. Construction: 200+ cost codes internally, 10 to customer. PE conflates these.' },
          { q: 'How do reports know which source to use?', a: 'Dual-mode during rollout: PB users see new, non-PB users see old. Feature flag drives the choice.' },
          { q: 'What happens to memorized reports?', a: '1444+ memorized across 6 reports. Migration shows report-level message. Custom reports with PE-cost columns get inline warning.' },
          { q: 'When is dual-mode retired?', a: 'After 100% migration. In-product migration + CSM outreach + auto-migrate after cutoff.' },
          { q: 'What if a tenant cannot migrate?', a: 'Step 2 failure rolls back to old mode. PD alerted. Manual reconciliation. No half-migrated state.' },
        ],
      },
      {
        title: 'The DataGrid scale chain',
        steps: [
          { q: 'How do you handle 3500 rows?', a: 'Virtual scroll with windowing — only ~50 rows in DOM. Row components memoized. Edit state hoisted.' },
          { q: 'What\'s your cell edit SLA?', a: '<200ms. Enforced as perf budget. Debounced + batched updates keep us inside.' },
          { q: 'What breaks first at 10× scale?', a: 'Server-side aggregation for milestone rollups. Currently client; would move to server with materialized rollup.' },
          { q: 'How did you measure cell edit latency?', a: 'Perf instrumentation: mark before edit, mark after re-render. Aggregated p50/p95/p99. Alerts on regression.' },
        ],
      },
      {
        title: 'The cohort migration chain',
        steps: [
          { q: 'Why three migration paths?', a: 'Cohorts have different starting states. NTTF: no history. Upgraders: contract-signed migration. Existing IES: history + memorized reports + workflow expectations.' },
          { q: 'What about Desktop migrators?', a: 'Two sub-cohorts: Fresh Start (auto-new experience) and Importer (PCE cost migrated to PB during migration).' },
          { q: 'How do you handle a tenant that opts in then changes mind?', a: 'One-way after cutoff. Pre-cutoff: white-glove rollback for exceptional cases. Documented and gated.' },
          { q: 'What\'s the cutoff strategy?', a: 'In-product nudges + CSM outreach ~3 months. Auto-migrate at cutoff. Sunset old after 100% on PB.' },
        ],
      },
    ],
  },
  'cms-migration': {
    framing:
      'Probed on distributed-systems instinct: timeout handling, idempotency, reconciliation, and the gap between "API returned" and "system state changed."',
    decisions: [
      {
        q: 'API vs event-based for project ↔ sub-customer sync?',
        options: [
          'Event-driven: eventual consistency, decoupled.',
          'API-based (sync CMS call from Projects): strong consistency for user action, more coupling.',
        ],
        chosen: 'API-based.',
        why: 'User-facing create/update needs strong consistency. Event-driven leaves observable windows where Project exists without sub-customer — users would see project but not be able to invoice it. API gives clear outcome per action.',
        tradeoff: 'Timeout ambiguity. Solved via idempotency + correlation-id reconciliation, not by accepting eventual consistency.',
      },
      {
        q: 'On CMS timeout — rollback project, retry, or reconcile?',
        options: [
          'Rollback project: clean state, lose user action when CMS may have succeeded.',
          'Retry blindly: may cause duplicates.',
          'Reconcile: query CMS by correlation, then decide.',
        ],
        chosen: 'Reconcile.',
        why: 'Treating timeout as failure throws away successful work. Reconciliation via correlation-id determines actual CMS state, then finalizes project (CMS succeeded) or retries idempotently (CMS failed).',
        tradeoff: 'More code surface — reconciliation logic, correlation tracking, eventual-consistency window. Worth it to preserve user intent.',
      },
      {
        q: 'Downstream eventual consistency — fight it or accept it?',
        options: [
          'Synchronous propagation everywhere: impossible at scale of 350+ downstream consumers.',
          'Accept eventual consistency for downstreams (QBTime, STS, ETS, FTS).',
        ],
        chosen: 'Accept eventual consistency for downstreams.',
        why: 'Project ↔ CMS must be strongly consistent (user action). Downstream projections are eventually consistent by design. Trying to make everything sync breaks scalability.',
        tradeoff: 'Users may briefly see "no transactions" right after converting sub-customer to project. Mitigated with UX guidance to refresh + consumer lag monitoring.',
      },
    ],
    algorithms: [
      {
        name: 'Idempotent CMS API on project key',
        description: 'Every CMS create/update carries projectId (or client-generated idempotency token). CMS deduplicates: if sub-customer for projectId exists, return existing rather than creating duplicate.',
        complexity: 'O(1) dedup lookup.',
        why: 'Without idempotency, retries on timeout create duplicate sub-customers. With it, retries are safe.',
      },
      {
        name: 'Correlation-id reconciliation',
        description: 'On timeout: (1) short backoff, (2) query CMS by correlation-id, (3a) if exists → finalize project, (3b) if not → retry idempotent call. Persistent reconciliation queue for sustained timeouts.',
        complexity: 'O(1) per reconciliation, async.',
        why: 'Treats timeout as "unknown" not "failure." Preserves user intent across transient infra issues.',
      },
    ],
    numbers: [
      { metric: 'Sync failure reduction', value: '~95%', note: 'Pre-migration drift detection vs post-migration cross-service consistency monitor.' },
      { metric: 'Removed legacy paths', value: 'Monolith sync + v4 fallback event', note: 'Both replaced by single CMS API with idempotency.' },
      { metric: 'Affected downstreams', value: 'CERES, Audit, QBTime, STS, ETS, FTS', note: 'Plus 350+ DL consumers via batch ingestion.' },
    ],
    warStories: [
      {
        scenario: 'Timeout ambiguity in production',
        whatHappened: 'CMS create timed out. Project was rolled back. But CMS had actually succeeded — a sub-customer existed without a project pointing at it.',
        howResolved: 'Built the reconciliation flow: on timeout, query CMS by correlation-id before rolling back. Backfilled orphaned sub-customers in one-time job.',
        lesson: 'In distributed systems, "no response" is not the same as "no action taken." Always reconcile before destructive cleanup.',
      },
      {
        scenario: 'Parent move with partial state corruption',
        whatHappened: 'User moved project to a new parent customer. CMS updated; Projects API timed out. Reports referencing old parent got stale.',
        howResolved: 'FMEA flagged pre-launch. Compensation: query CMS state, surface mismatch alert, manual reconciliation tooling for affected reports.',
        lesson: 'Cross-service updates with structural impact need explicit FMEA, not just retry logic.',
      },
    ],
    edgeCases: [
      { case: 'Sub-customer convert + immediate transaction lookup', handling: 'Downstream consumer lag means transactions may not show immediately. UX guidance: refresh. Lag monitored.' },
      { case: 'CMS API down for extended period', handling: 'Project create/update fails fast. User sees explicit error. Once CMS recovers, queue drains.' },
      { case: 'Idempotent retry from different application server', handling: 'Idempotency key is projectId, not server. Any server retrying produces same call. CMS dedupes.' },
    ],
    whatIWouldChange:
      'Build the FMEA before implementation, not alongside. Caught parent-move ambiguity late. Better observability on reconciliation queue — dashboard from day one rather than Splunk query.',
    chains: [
      {
        title: 'The timeout-ambiguity chain',
        steps: [
          { q: 'CMS times out. What does your code do?', a: 'Wait, query CMS by correlation-id. If sub-customer exists, finalize project. If not, retry idempotent.' },
          { q: 'What if reconciliation also times out?', a: 'Persistent reconciliation queue. Backoff + retry. Alert if queue grows.' },
          { q: 'How do you prevent duplicate sub-customers across retries?', a: 'CMS API is idempotent on projectId. Same projectId → same sub-customer.' },
          { q: 'What proves "95% fewer failures"?', a: 'Pre: drift detector ran daily, counted mismatches. Post: cross-service consistency monitor, real-time. 95% reduction comparing daily averages.' },
        ],
      },
    ],
  },
  'au-launch': {
    framing:
      'Probed on cross-team execution, risk surfacing, and what you owned vs participated in. They want to see leadership without authority.',
    decisions: [
      {
        q: 'Why launch with no marketing?',
        options: [
          'Full marketing launch: max influx, max risk if anything breaks.',
          'Soft launch (no active marketing): smaller initial cohort, lower support pressure, time to validate.',
        ],
        chosen: 'Soft launch.',
        why: 'AU is a new market with established competitors (Xero, MYOB). First impression matters. Soft launch lets us validate stability under real AU traffic before scaling marketing. Marketing follows confidence.',
        tradeoff: 'Slower initial adoption. Acceptable because botched launch risk in competitive market > slower ramp.',
      },
      {
        q: 'Which features were gating for GA?',
        options: [
          'All Advanced features: max parity, latest delivery.',
          'Core features + safe upgrade/downgrade + analytics: pragmatic GA.',
        ],
        chosen: 'Core + upgrade safety + analytics.',
        why: 'Upgrade/downgrade safety non-negotiable. Analytics correctness critical for mid-market (target segment). Other features can follow post-GA. Gating on what matters.',
        tradeoff: 'Some feature gaps at GA. Documented in known-issues. Roadmap visible to early adopters.',
      },
    ],
    algorithms: [
      {
        name: 'Cross-team readiness gating',
        description: 'Each dependent team owns a feature gate. Pre-Oct-27 cutoff: all green or descoped. Daily readiness sync. Issue triage with severity tiers. No GA until P0/P1 gates green.',
        complexity: 'O(features × teams) coordination surface.',
        why: 'Mis-sequenced enablement = silent data corruption or upgrade lock. Explicit gating prevents "works on my machine" surprises.',
      },
      {
        name: 'Analytics correctness validation',
        description: 'Pre-GA: run analytics pipelines against AU-shaped test data. Spot-check key metrics for sensible values. Compare against expected ranges from US/UK/CA (adjusted for AU patterns).',
        complexity: 'Per-pipeline validation, bounded by AU test data size.',
        why: 'Analytics drift in new market is invisible until it hurts. Validation catches schema/value drift before customers see wrong dashboards.',
      },
    ],
    numbers: [
      { metric: 'Dependent teams', value: '10+', note: 'Analytics, workflows, upgrade/downgrade, accountant flows, currency, locale, prod offers, experts.' },
      { metric: 'AU subscriber base', value: '~250K', note: 'Pre-launch QBO subscriber count. Strong upgrade opportunity to Advanced.' },
      { metric: 'Launch date', value: 'December 4', note: 'GA with no active marketing.' },
      { metric: 'Pre-prod cutoff', value: 'October 27', note: 'All feature gates green or descoped by this date.' },
    ],
    warStories: [
      {
        scenario: 'Late-breaking locale bug',
        whatHappened: 'Pre-prod testing surfaced AU-specific currency formatting bug — showed USD symbol instead of AUD in specific edge path.',
        howResolved: 'Owning team identified within 2 days, fix backported, re-validated. Gating worked: surfaced pre-GA.',
        lesson: 'Locale bugs are silent until validated against locale-specific data. Test data shape matters more than volume.',
      },
      {
        scenario: 'Upgrade flow soft-blocker miss',
        whatHappened: 'Specific upgrade path (Plus → Advanced AU) hit unexpected soft blocker due to legacy AU config. Surfaced during accountant-flow testing.',
        howResolved: 'Team patched the soft-blocker condition. Re-tested upgrade path. Added to upgrade smoke test suite.',
        lesson: 'Upgrade matrices have long tails. Every cohort path needs explicit test coverage; matrix is part of gating.',
      },
    ],
    edgeCases: [
      { case: 'AU-only feature dependency timing', handling: 'Sequenced after global-feature enablement. If global delayed, AU launch path adjusted. Explicit dependency graph.' },
      { case: 'Mid-market customer with existing third-party tools', handling: 'Migration path documented. Not gating for GA — migration support is post-GA work. Disclosed.' },
    ],
    whatIWouldChange:
      'Earlier locale test data setup. We had AU companies in pre-prod, but scenario diversity was thin until late. Next time: build AU test data set in parallel with feature work, not after.',
    chains: [
      {
        title: 'The cross-team execution chain',
        steps: [
          { q: 'How did you sequence 10+ teams?', a: 'Per-feature dependency graph + per-team readiness gate. Daily sync. P0/P1 triaged within 24h.' },
          { q: 'What was the riskiest path?', a: 'Upgrade/downgrade. Soft blockers in legacy AU configs could lock customers or corrupt data. Gated hardest.' },
          { q: 'What would have caused rollback?', a: 'Analytics drift on a key metric. Validated pre-GA precisely to avoid.' },
          { q: 'What did you personally drive?', a: 'Sequencing + readiness gates for Projects/IES slice. Personally validated upgrade/downgrade and analytics correctness. Escalation owner for cross-team blockers.' },
        ],
      },
    ],
  },
  'template-sharing': {
    framing:
      'Probed on platform thinking, not just frontend execution. They will push on extensibility, safety (PII), and multi-service orchestration.',
    decisions: [
      {
        q: 'Workflow-specific template feature or cross-plugin platform?',
        options: [
          'Workflow-only: faster ship, must rebuild for next plugin.',
          'Plugin-agnostic platform: more upfront design, reusable for reports/spreadsheets.',
        ],
        chosen: 'Plugin-agnostic platform.',
        why: 'Templates are a category, not a feature. Same publishing/discovery/contribution flow applies to workflows, reports, spreadsheet sync. Building once for many beats rebuilding per plugin.',
        tradeoff: 'Higher upfront design cost. Pays back the first time a sibling team uses the framework.',
      },
      {
        q: 'PII handling — client-side scrub, server-side scrub, or both?',
        options: [
          'Client-side only: surface to user, no server enforcement.',
          'Server-side only: hides masked data until server-side reject.',
          'Both (defense in depth).',
        ],
        chosen: 'Both.',
        why: 'Client-side mask gives immediate visual feedback. Server-side validation enforces correctness. Either alone leaves a gap.',
        tradeoff: 'Duplicate logic. Acceptable because financial templates demand zero leak tolerance.',
      },
      {
        q: 'Publish flow — multi-service orchestration: client or server?',
        options: [
          'Client orchestrates (WAS then UCS): simpler, fragile to partial failure.',
          'Server orchestrates: transactional semantics, more backend coordination.',
        ],
        chosen: 'Client orchestrates with strict ordering and UI rollback.',
        why: 'Time-to-ship favored client orchestration. WAS persist is durable step; UCS publish references WAS entity. Failure at UCS surfaces as retryable; client UI reflects partial state cleanly.',
        tradeoff: 'Less robust than server-side transaction. Documented and monitored. Future migration to server orchestration possible.',
      },
    ],
    algorithms: [
      {
        name: 'Multi-step publish orchestration',
        description: 'Sequence: (1) enter publish mode → mask PII, hide workflow-specific UI, (2) collect template metadata, (3) call WAS to persist workflow definition, (4) on WAS success → call UCS to publish template metadata, (5) on UCS success → navigate to My Workflows + reset UI. Failure rolls back UI to safe state.',
        complexity: 'O(1) sequential steps.',
        why: 'Sequential dependency: UCS references WAS workflow. UCS-first would create orphans. Strict order + UI rollback keeps state coherent.',
      },
      {
        name: 'PII masking with regex + field-list',
        description: 'On entering publish mode: scan workflow definition for known PII fields (name, address, email) + regex (SSN, account numbers). Mask with dot-dash. Server-side validator rejects PII patterns.',
        complexity: 'O(fields × patterns) per scan.',
        why: 'Templates leak data when published carelessly. Client mask + server validation = defense in depth.',
      },
    ],
    numbers: [
      { metric: 'Users publishing templates', value: '1K+', note: 'Across QBO Advanced + Accountant tenants.' },
      { metric: 'Setup time reduction', value: '~60%', note: 'Measured on tenants using shared templates vs creating from scratch.' },
      { metric: 'Plugin extensibility', value: 'Plugin-agnostic platform', note: 'Future plugins extend via Template Handler contract.' },
    ],
    warStories: [
      {
        scenario: 'PII leak in early prototype',
        whatHappened: 'Early review: published template still carried customer name in description field. Client mask missed it.',
        howResolved: 'Expanded field-list. Added server-side regex validation as last-line defense. Re-scanned existing published and re-masked detected PII.',
        lesson: 'PII detection must be exhaustive and tested adversarially. One miss = trust gone.',
      },
      {
        scenario: 'WAS success + UCS failure leaving orphan',
        whatHappened: 'WAS persisted workflow definition, UCS publish failed (transient infra). Orphan workflow definition in WAS, no template in UCS.',
        howResolved: 'Surfaced retry CTA to user. On retry, UCS call repeated with same WAS reference. No duplicate workflow created. Orphan cleanup job for sustained failures.',
        lesson: 'Cross-service orchestration needs explicit retry semantics, not silent retries. User must understand state.',
      },
    ],
    edgeCases: [
      { case: 'User closes browser mid-publish', handling: 'WAS may have succeeded, UCS may not. Orphan cleanup sweeps WAS workflows without UCS references after threshold. User can re-publish — idempotent on workflow key.' },
      { case: 'Template imported on incompatible workflow engine version', handling: 'Template carries schema version. Import validates. Mismatch shows compatibility warning + migration path.' },
      { case: 'Publish to "community" vs "my companies" vs "my clients"', handling: 'Share-with scope captured at publish time. UCS enforces visibility on discovery. Community templates public; my-companies/my-clients scoped.' },
    ],
    whatIWouldChange:
      '(1) Server-side orchestration from day one — client-side was faster but more fragile. (2) Template versioning earlier — V1 didn\'t version; first workflow engine update caused compatibility issues. (3) PII scan as a standalone service, not embedded in publish flow — reusable for other surfaces.',
    chains: [
      {
        title: 'The platform-extensibility chain',
        steps: [
          { q: 'How does this extend to reports?', a: 'Template Handler is plugin-agnostic. Reports plugin implements same metadata contract. Discovery + publishing UX reused.' },
          { q: 'What if reports need different metadata fields?', a: 'Contract has core fields + plugin-specific extension map. Reports adds its fields without changing core.' },
          { q: 'How do you prevent the platform from becoming workflow-specific?', a: 'Code review discipline. Workflow-specific stays in workflow plugin. Platform has own test suite running without workflow context.' },
        ],
      },
      {
        title: 'The PII safety chain',
        steps: [
          { q: 'How do you prevent PII leaks?', a: 'Client mask (dot-dash) + server-side validator. Both required.' },
          { q: 'What if a new PII field is added?', a: 'Field-list maintained centrally. New fields added before they ship. Server validator falls back to regex for known patterns.' },
          { q: 'What if a user types a customer name into a description?', a: 'Regex catches common patterns. For free-text, additional review prompt on publish. Not perfect — documented and monitored.' },
        ],
      },
    ],
  },
  'consolidated-email': {
    framing:
      'Probed on preference management, backward compatibility, and the gap between "UI toggle" and "behavior change throughout the system."',
    decisions: [
      {
        q: 'Force consolidated emails or give users a choice?',
        options: [
          'Force consolidated: simpler, ignores low-volume users.',
          'Give users a choice with sensible default.',
        ],
        chosen: 'Give users a choice.',
        why: 'Low-volume users with 2-3 reminders/week prefer per-transaction (forwardable, filable). High-volume users with 100+ need consolidation. One-size-fits-all loses one cohort.',
        tradeoff: 'Two code paths. Mitigated by mode-aware shared components, not duplicated logic.',
      },
      {
        q: 'Default mode — preserve old behavior or default to new?',
        options: [
          'Default to consolidated (new): faster adoption, surprises existing users.',
          'Default to per-transaction (old): preserves expectations, slower adoption.',
        ],
        chosen: 'Default to per-transaction (preserve old).',
        why: 'Existing users built workflows around per-transaction. Changing default silently = trust erosion. Surface the toggle prominently; let users opt-in.',
        tradeoff: 'Slower adoption metric. Acceptable: backward compatibility > adoption pace for trust-sensitive features.',
      },
      {
        q: 'Refactor shared components vs duplicate logic?',
        options: [
          'Duplicate: faster, code rot guaranteed.',
          'Refactor shared components with mode-aware props.',
        ],
        chosen: 'Refactor.',
        why: 'Class-based React (no hooks) makes refactoring risky but not impossible. Mode-aware props prevent two divergent codebases. Pays back the first time a third email mode is considered.',
        tradeoff: 'Refactor work carries regression risk. Mitigated by mock-API testing and unit coverage.',
      },
    ],
    algorithms: [
      {
        name: 'Mode-aware shared component',
        description: 'Email composition accepts mode prop ("per-transaction" | "consolidated"). Internal logic branches: content template, recipient list, CTA wording. Shared CC/BCC, freeform body, attachment handling.',
        complexity: 'O(1) mode check per render.',
        why: 'Two delivery modes share 80% of UX. Mode-aware prop keeps 80% common + 20% specialized. Adding third mode = extend enum + add branch.',
      },
      {
        name: 'Preference resolution at send time',
        description: 'User preference stored at workflow level, fetched on execution. Email generator dispatches to per-txn or consolidated path based on resolved preference. Preference change applies to future workflows, not in-flight.',
        complexity: 'O(1) preference lookup.',
        why: 'Mid-workflow mode changes would cause inconsistent delivery. Preference resolved at execution time, not toggle time, keeps each workflow self-consistent.',
      },
    ],
    numbers: [
      { metric: 'Email volume reduction', value: '65%', note: 'Measured pre vs post-launch in tenants with high-volume reminder workflows.' },
      { metric: 'CSAT increase', value: '~40%', note: 'Survey-based, post-launch cohort.' },
      { metric: 'Backward compatibility', value: '100%', note: 'No existing workflows broken; default preserves old behavior.' },
    ],
    warStories: [
      {
        scenario: 'Class-based React refactor scare',
        whatHappened: 'Codebase had no hooks. Initial refactor of shared email components broke a sibling feature (CC/BCC) in unrelated workflow.',
        howResolved: 'Reverted, narrowed refactor scope, added mock-API integration tests for sibling feature, re-applied. Lesson: refactor blast radius is larger than appears in legacy.',
        lesson: 'In legacy React (or any legacy codebase), shared components have unwritten contracts. Test the contracts before changing implementation.',
      },
      {
        scenario: 'Legal content gate before merge',
        whatHappened: 'Consolidated email template needed legal sign-off (branding + compliance). Initial template missed a required disclaimer. Caught in legal review.',
        howResolved: 'Disclaimer added. Legal-review checkpoint established as part of email-template merge.',
        lesson: 'Customer-facing communication is a legal artifact. Build review into merge, not as afterthought.',
      },
    ],
    edgeCases: [
      { case: 'User toggles mode mid-workflow', handling: 'Preference resolved at workflow execution. Mid-toggle does not affect in-flight reminders. Applies to next run.' },
      { case: 'Mixed-mode workflows in one tenant', handling: 'Mode is per-workflow, not per-tenant. User can have some consolidated, others per-transaction. UI surfaces toggle per workflow.' },
      { case: 'CC/BCC on consolidated email', handling: 'Preserved across both modes. CC/BCC composition is shared, not mode-specific.' },
    ],
    whatIWouldChange:
      '(1) Hooks migration first, then refactor. Class-based refactor was twice the work. (2) Mode as string enum from day one to enable future modes (weekly digest, on-failure-only). (3) Email template versioning — legal updates should be diffable.',
    chains: [
      {
        title: 'The backward-compatibility chain',
        steps: [
          { q: 'How did you ensure the toggle didn\'t break existing workflows?', a: 'Default preserved old behavior. Toggle opt-in. Shared components mode-aware via props, not new code paths. Existing tests passed unchanged.' },
          { q: 'What if a user hand-customized their reminder template?', a: 'Templates preserved per workflow. Mode toggle doesn\'t overwrite customization. Customizations apply within resolved mode.' },
          { q: 'What\'s the upgrade path for a third mode?', a: 'Mode enum extends. Shared components add a branch. Default unchanged.' },
        ],
      },
    ],
  },
  'implicit-ads': {
    framing:
      'A research/academic project. Useful for analytical depth, not core strength. Keep answers honest and tight.',
    decisions: [
      {
        q: 'Whole-video vs segment-level classification?',
        options: [
          'Whole-video binary classifier: useless for actual product use.',
          'Fixed-time-window segmentation: arbitrary boundaries, splits semantic units.',
          'Audio-sentence-boundary segmentation: semantically meaningful units.',
        ],
        chosen: 'Audio-sentence-boundary segmentation.',
        why: 'Implicit ads are embedded segments inside otherwise-normal content. Whole-video loses locality. Fixed windows split sentences mid-thought. Audio sentence boundaries align with semantic units.',
        tradeoff: 'Requires audio-quality input. Failure on videos with continuous music or unclear speech. Acceptable for use case.',
      },
      {
        q: 'Single-modality (vision) or multi-modal?',
        options: [
          'Vision-only: fails when ads look visually like main content.',
          'Audio-only: fails when ads sound like main content.',
          'Multi-modal fusion.',
        ],
        chosen: 'Multi-modal.',
        why: 'Implicit ads are defined by intent, not any single modality. Visual signals (logos, products), audio signals (brand mentions, CTA urgency), contextual signals (promotional phrasing) all weakly indicate ad intent. Fusion stronger than any single.',
        tradeoff: 'Higher inference cost. Acceptable for offline batch use case.',
      },
    ],
    algorithms: [
      {
        name: 'Audio sentence-boundary segmentation',
        description: 'Extract audio, run voice activity detection + pause analysis to find sentence boundaries. Each segment ≈ one semantic unit.',
        complexity: 'O(video duration).',
        why: 'Semantic units are the right classification granularity for embedded content.',
      },
      {
        name: 'CNN visual feature extraction',
        description: 'Sample frames per segment, extract features via pre-trained CNN. Logo presence, product imagery patterns, branding-heavy frames.',
        complexity: 'O(frames × CNN forward pass).',
        why: 'Hand-engineering visual features for implicit ads is brittle. Pre-trained CNN gives transferable representation.',
      },
      {
        name: 'Multi-modal fusion before final classification',
        description: 'Visual features (CNN) + audio features (MFCC, prosody) + contextual features (CTA phrasing, brand mentions from transcripts) concatenated and fed to final classifier.',
        complexity: 'O(feature dim) per segment.',
        why: 'Late fusion is simpler than early fusion and lets each modality\'s feature extractor be tuned independently.',
      },
    ],
    numbers: [
      { metric: 'Accuracy', value: '~85%', note: 'On the labeled test set.' },
      { metric: 'Recall (ad class)', value: 'High', note: 'Prioritized over precision — false negatives hurt moderation more than false positives.' },
      { metric: 'Inference latency', value: 'Near real-time', note: 'For offline batch; not optimized for live streaming.' },
    ],
    warStories: [
      {
        scenario: 'False positives on product reviews',
        whatHappened: 'Initial model flagged genuine product reviews as ads. Brand mentions + visual products scored high without promotional intent.',
        howResolved: 'Weighted contextual signals (CTA phrasing, urgency) higher. Product review pattern (extended discussion, neutral tone) became negative evidence.',
        lesson: 'Intent is the signal, not brand presence. Feature engineering must reflect intent, not just keywords.',
      },
    ],
    edgeCases: [
      { case: 'Videos with continuous background music', handling: 'Audio sentence-boundary detection degrades. Fallback to fixed-time-window with reduced confidence.' },
      { case: 'Multi-language content', handling: 'Out of scope V1 — English only. Multi-language would need localized brand dictionaries and language-specific CTA patterns.' },
    ],
    whatIWouldChange:
      'Build confidence-banded output (high/medium/low) instead of binary — fits moderation workflows better. Add human-in-the-loop review for medium-confidence. Use transformer for cross-modal fusion instead of late concatenation.',
    chains: [
      {
        title: 'The segmentation chain',
        steps: [
          { q: 'Why segment-level not whole-video?', a: 'Whole-video loses locality. A 10-min video with 30-sec ad looks like non-ad. Segment level enables boundary detection.' },
          { q: 'Why audio-sentence boundaries not fixed windows?', a: 'Fixed windows split sentences. Sentence boundaries align with semantic units, giving more coherent classification context.' },
          { q: 'What if audio is unclear?', a: 'Fallback to fixed-time windows with lower confidence weighting. Documented limitation.' },
        ],
      },
    ],
  },
};

/* ============================================================================
 * STYLES
 * ============================================================================
 * Editorial/refined dark theme. Serif display (Fraunces) + monospace accent
 * (JetBrains Mono). Heavy use of CSS variables. Minimal AI-slop.
 * ========================================================================== */

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap');

  :root {
    --ink: #0a0a0a;
    --paper: #f4f1ea;
    --paper-2: #ebe6dc;
    --ink-soft: #1a1a1a;
    --ink-mid: #3a3a3a;
    --ink-faded: #6b6b6b;
    --rule: #d6d0c4;
    --accent: #c9461b;
    --accent-soft: #e8a071;
    --tier-1: #c9461b;
    --tier-2: #8a6d3b;
    --tier-3: #6b6b6b;
    --display: 'Fraunces', Georgia, serif;
    --mono: 'JetBrains Mono', 'SF Mono', monospace;
    --body: 'Inter', -apple-system, sans-serif;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body, .pf-root {
    background: var(--paper);
    color: var(--ink);
    font-family: var(--body);
    font-weight: 400;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  .pf-grain {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    opacity: 0.4;
    mix-blend-mode: multiply;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.08 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  .pf-shell {
    position: relative;
    z-index: 2;
    max-width: 1280px;
    margin: 0 auto;
    padding: 56px 48px 120px;
  }

  /* ---------- header ---------- */
  .pf-header {
    border-bottom: 1px solid var(--rule);
    padding-bottom: 32px;
    margin-bottom: 56px;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 32px;
    align-items: end;
  }

  .pf-eyebrow {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--ink-faded);
    margin-bottom: 16px;
  }

  .pf-title {
    font-family: var(--display);
    font-weight: 400;
    font-size: clamp(48px, 7vw, 92px);
    line-height: 0.95;
    letter-spacing: -0.025em;
    color: var(--ink);
    font-variation-settings: 'opsz' 144;
  }

  .pf-title em {
    font-style: italic;
    color: var(--accent);
    font-weight: 300;
  }

  .pf-subtitle {
    font-family: var(--display);
    font-weight: 300;
    font-style: italic;
    font-size: 18px;
    color: var(--ink-mid);
    max-width: 380px;
    line-height: 1.4;
    text-align: right;
  }

  /* ---------- meta strip ---------- */
  .pf-meta {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0;
    border-top: 1px solid var(--rule);
    border-bottom: 1px solid var(--rule);
    margin-bottom: 72px;
  }

  .pf-meta-cell {
    padding: 24px 24px;
    border-right: 1px solid var(--rule);
  }
  .pf-meta-cell:last-child { border-right: none; }

  .pf-meta-label {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--ink-faded);
    margin-bottom: 8px;
  }

  .pf-meta-value {
    font-family: var(--display);
    font-size: 28px;
    font-weight: 500;
    letter-spacing: -0.01em;
    color: var(--ink);
    line-height: 1;
  }

  /* ---------- filter bar ---------- */
  .pf-filters {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 48px;
  }

  .pf-filter {
    font-family: var(--mono);
    font-size: 12px;
    letter-spacing: 0.05em;
    padding: 8px 14px;
    border: 1px solid var(--rule);
    background: transparent;
    color: var(--ink-mid);
    cursor: pointer;
    transition: all 0.15s ease;
    border-radius: 0;
  }
  .pf-filter:hover { border-color: var(--ink); color: var(--ink); }
  .pf-filter.active {
    background: var(--ink);
    color: var(--paper);
    border-color: var(--ink);
  }

  /* ---------- project card ---------- */
  .pf-project {
    border-top: 1px solid var(--rule);
    padding: 56px 0;
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: 56px;
  }

  .pf-project:first-of-type { border-top: none; padding-top: 0; }

  .pf-side {
    position: sticky;
    top: 24px;
    align-self: start;
  }

  .pf-side-row {
    margin-bottom: 24px;
  }

  .pf-side-label {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--ink-faded);
    margin-bottom: 6px;
  }

  .pf-side-value {
    font-family: var(--body);
    font-size: 13px;
    color: var(--ink);
    line-height: 1.5;
  }

  .pf-tier {
    display: inline-block;
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    padding: 4px 10px;
    color: var(--paper);
    margin-bottom: 16px;
  }
  .pf-tier[data-tier='1'] { background: var(--tier-1); }
  .pf-tier[data-tier='2'] { background: var(--tier-2); }
  .pf-tier[data-tier='3'] { background: var(--tier-3); }

  .pf-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .pf-tag {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--ink-mid);
    padding: 3px 8px;
    border: 1px solid var(--rule);
  }

  /* ---------- project body ---------- */
  .pf-body { min-width: 0; }

  .pf-pid {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.15em;
    color: var(--ink-faded);
    margin-bottom: 8px;
  }

  .pf-pname {
    font-family: var(--display);
    font-weight: 500;
    font-size: clamp(32px, 4vw, 48px);
    line-height: 1.05;
    letter-spacing: -0.02em;
    margin-bottom: 16px;
    color: var(--ink);
  }

  .pf-oneline {
    font-family: var(--display);
    font-style: italic;
    font-weight: 300;
    font-size: 20px;
    line-height: 1.4;
    color: var(--ink-mid);
    margin-bottom: 36px;
    max-width: 70ch;
    border-left: 2px solid var(--accent);
    padding-left: 16px;
  }

  /* headline strip */
  .pf-headline {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1px;
    background: var(--rule);
    border: 1px solid var(--rule);
    margin-bottom: 40px;
  }

  .pf-headline-cell {
    background: var(--paper);
    padding: 16px 18px;
  }

  .pf-headline-label {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--ink-faded);
    margin-bottom: 4px;
  }

  .pf-headline-value {
    font-family: var(--display);
    font-weight: 500;
    font-size: 17px;
    color: var(--ink);
    line-height: 1.2;
  }

  /* sections */
  .pf-section { margin-bottom: 36px; }

  .pf-section-head {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 16px;
    cursor: pointer;
    user-select: none;
  }

  .pf-section-num {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--accent);
    letter-spacing: 0.1em;
  }

  .pf-section-title {
    font-family: var(--display);
    font-weight: 500;
    font-size: 18px;
    letter-spacing: -0.01em;
    color: var(--ink);
    flex: 1;
  }

  .pf-section-toggle {
    font-family: var(--mono);
    font-size: 14px;
    color: var(--ink-faded);
    width: 20px;
    text-align: center;
  }

  .pf-prose {
    font-size: 15px;
    line-height: 1.7;
    color: var(--ink-soft);
    max-width: 72ch;
  }

  .pf-prose p { margin-bottom: 14px; }
  .pf-prose p:last-child { margin-bottom: 0; }

  .pf-list {
    list-style: none;
    counter-reset: pf-list;
  }
  .pf-list li {
    counter-increment: pf-list;
    position: relative;
    padding-left: 32px;
    margin-bottom: 12px;
    font-size: 14.5px;
    line-height: 1.6;
    color: var(--ink-soft);
  }
  .pf-list li::before {
    content: counter(pf-list, decimal-leading-zero);
    position: absolute;
    left: 0;
    top: 2px;
    font-family: var(--mono);
    font-size: 10px;
    color: var(--ink-faded);
    letter-spacing: 0.05em;
  }

  /* architecture cards */
  .pf-arch {
    display: grid;
    gap: 12px;
  }

  .pf-arch-item {
    border-left: 2px solid var(--rule);
    padding: 4px 0 4px 20px;
    transition: border-color 0.15s ease;
  }
  .pf-arch-item:hover { border-left-color: var(--accent); }

  .pf-arch-name {
    font-family: var(--display);
    font-weight: 600;
    font-size: 14px;
    color: var(--ink);
    margin-bottom: 4px;
    letter-spacing: -0.005em;
  }

  .pf-arch-detail {
    font-size: 13.5px;
    line-height: 1.55;
    color: var(--ink-mid);
  }

  /* impact callouts */
  .pf-impact {
    background: var(--paper-2);
    padding: 24px 28px;
    border-left: 3px solid var(--accent);
  }
  .pf-impact .pf-list li {
    margin-bottom: 8px;
    font-size: 14px;
  }
  .pf-impact .pf-list li::before { color: var(--accent); }

  /* killer answer */
  .pf-killer {
    background: var(--ink);
    color: var(--paper);
    padding: 28px 32px;
    position: relative;
  }
  .pf-killer::before {
    content: '"';
    position: absolute;
    top: 12px;
    left: 16px;
    font-family: var(--display);
    font-size: 80px;
    line-height: 1;
    color: var(--accent);
    opacity: 0.5;
  }
  .pf-killer-label {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--accent-soft);
    margin-bottom: 12px;
    margin-left: 40px;
  }
  .pf-killer-text {
    font-family: var(--display);
    font-style: italic;
    font-weight: 300;
    font-size: 17px;
    line-height: 1.55;
    margin-left: 40px;
    color: var(--paper);
  }

  /* grill */
  .pf-grill {
    border-top: 1px solid var(--rule);
    padding-top: 16px;
  }
  .pf-grill-item {
    border-bottom: 1px solid var(--rule);
    padding: 14px 0;
  }
  .pf-grill-q {
    font-family: var(--display);
    font-weight: 500;
    font-size: 14px;
    color: var(--ink);
    margin-bottom: 6px;
    display: flex;
    gap: 8px;
  }
  .pf-grill-q::before {
    content: 'Q.';
    color: var(--accent);
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .pf-grill-a {
    font-size: 13.5px;
    line-height: 1.6;
    color: var(--ink-mid);
    padding-left: 22px;
  }

  /* landmines */
  .pf-landmines {
    background: #fef3ed;
    border: 1px solid var(--accent-soft);
    padding: 20px 24px;
  }
  .pf-landmines .pf-section-title { color: var(--accent); }
  .pf-landmines ul {
    list-style: none;
    margin-top: 8px;
  }
  .pf-landmines li {
    font-size: 13.5px;
    color: var(--ink-soft);
    padding: 6px 0 6px 24px;
    position: relative;
    line-height: 1.5;
  }
  .pf-landmines li::before {
    content: '✕';
    position: absolute;
    left: 0;
    color: var(--accent);
    font-weight: 600;
  }

  .pf-collapsed { display: none; }

  /* footer */
  .pf-footer {
    margin-top: 96px;
    padding-top: 32px;
    border-top: 1px solid var(--rule);
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-faded);
  }

  /* ============================== TABS ============================== */
  .pf-tabs {
    display: flex;
    gap: 0;
    border-bottom: 2px solid var(--ink);
    margin: 40px 0 48px;
    position: relative;
  }
  .pf-tab {
    background: transparent;
    border: none;
    padding: 18px 28px 16px;
    font-family: var(--serif);
    font-size: 22px;
    font-weight: 500;
    color: var(--ink-faded);
    cursor: pointer;
    position: relative;
    transition: color 0.2s ease;
    letter-spacing: -0.01em;
  }
  .pf-tab em {
    font-style: italic;
    font-weight: 400;
  }
  .pf-tab:hover {
    color: var(--ink);
  }
  .pf-tab.active {
    color: var(--ink);
  }
  .pf-tab.active::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -2px;
    height: 4px;
    background: var(--ink);
  }
  .pf-tab-badge {
    display: inline-block;
    margin-left: 10px;
    padding: 2px 8px;
    background: var(--accent-subtle);
    color: var(--accent);
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    border-radius: 3px;
    vertical-align: middle;
  }

  /* ============================== DEEP DIVE ============================== */
  .pf-dd-shell {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 56px;
    margin-top: 8px;
  }
  .pf-dd-side {
    position: sticky;
    top: 32px;
    height: fit-content;
    padding-right: 24px;
    border-right: 1px solid var(--rule);
  }
  .pf-dd-side-label {
    font-family: var(--mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--ink-faded);
    margin-bottom: 16px;
  }
  .pf-dd-side-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .pf-dd-side-item {
    background: transparent;
    border: none;
    border-left: 2px solid transparent;
    padding: 10px 14px 10px 14px;
    text-align: left;
    font-family: var(--serif);
    font-size: 15px;
    color: var(--ink-soft);
    cursor: pointer;
    transition: all 0.15s ease;
    line-height: 1.35;
  }
  .pf-dd-side-item:hover {
    color: var(--ink);
    background: var(--paper-warm);
  }
  .pf-dd-side-item.active {
    color: var(--ink);
    background: var(--paper-warm);
    border-left-color: var(--accent);
    font-weight: 500;
  }
  .pf-dd-side-tier {
    display: inline-block;
    width: 18px;
    font-family: var(--mono);
    font-size: 10px;
    color: var(--accent);
    margin-right: 8px;
    font-weight: 600;
  }

  .pf-dd-main {
    min-width: 0;
  }
  .pf-dd-header {
    margin-bottom: 40px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--rule);
  }
  .pf-dd-eyebrow {
    font-family: var(--mono);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--ink-faded);
    margin-bottom: 12px;
  }
  .pf-dd-title {
    font-family: var(--serif);
    font-size: 42px;
    font-weight: 500;
    line-height: 1.05;
    letter-spacing: -0.02em;
    margin: 0 0 18px;
    color: var(--ink);
  }
  .pf-dd-framing {
    font-family: var(--serif);
    font-size: 17px;
    line-height: 1.55;
    color: var(--ink-soft);
    font-style: italic;
    font-weight: 400;
    border-left: 3px solid var(--accent);
    padding: 8px 0 8px 20px;
    margin-top: 18px;
  }

  .pf-dd-section {
    margin-bottom: 52px;
  }
  .pf-dd-section-head {
    display: flex;
    align-items: baseline;
    gap: 16px;
    margin-bottom: 24px;
    padding-bottom: 12px;
    border-bottom: 1px dashed var(--rule);
  }
  .pf-dd-section-num {
    font-family: var(--mono);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--accent);
    font-weight: 600;
  }
  .pf-dd-section-title {
    font-family: var(--serif);
    font-size: 24px;
    font-weight: 500;
    color: var(--ink);
    margin: 0;
    letter-spacing: -0.01em;
  }
  .pf-dd-section-title em {
    font-style: italic;
    font-weight: 400;
  }

  /* Decisions */
  .pf-dd-decisions {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  .pf-dd-decision {
    padding: 24px 26px;
    background: var(--paper-warm);
    border: 1px solid var(--rule);
    border-radius: 4px;
  }
  .pf-dd-decision-q {
    font-family: var(--serif);
    font-size: 18px;
    font-weight: 500;
    color: var(--ink);
    margin-bottom: 16px;
    line-height: 1.35;
    letter-spacing: -0.005em;
  }
  .pf-dd-options {
    margin: 0 0 18px;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--rule);
    border-bottom: 1px solid var(--rule);
  }
  .pf-dd-option {
    padding: 10px 0 10px 24px;
    position: relative;
    font-size: 14px;
    line-height: 1.5;
    color: var(--ink-soft);
    border-bottom: 1px dotted var(--rule);
  }
  .pf-dd-option:last-child { border-bottom: none; }
  .pf-dd-option::before {
    content: '○';
    position: absolute;
    left: 4px;
    color: var(--ink-faded);
    font-size: 10px;
    top: 14px;
  }
  .pf-dd-decision-row {
    display: grid;
    grid-template-columns: 110px 1fr;
    gap: 14px;
    padding: 8px 0;
    align-items: baseline;
    border-bottom: 1px dotted var(--rule);
  }
  .pf-dd-decision-row:last-child { border-bottom: none; }
  .pf-dd-decision-label {
    font-family: var(--mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--ink-faded);
    font-weight: 600;
  }
  .pf-dd-decision-label.chosen { color: var(--accent); }
  .pf-dd-decision-value {
    font-family: var(--serif);
    font-size: 14px;
    line-height: 1.55;
    color: var(--ink);
  }
  .pf-dd-decision-value.chosen {
    font-weight: 500;
    color: var(--accent);
  }
  .pf-dd-decision-value.tradeoff { color: var(--ink-soft); font-style: italic; }

  /* Algorithms */
  .pf-dd-algos {
    display: flex;
    flex-direction: column;
    gap: 22px;
  }
  .pf-dd-algo {
    padding: 20px 22px;
    border-left: 3px solid var(--accent);
    background: var(--paper-warm);
  }
  .pf-dd-algo-name {
    font-family: var(--mono);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 10px;
  }
  .pf-dd-algo-desc {
    font-family: var(--serif);
    font-size: 14px;
    line-height: 1.6;
    color: var(--ink);
    margin-bottom: 12px;
  }
  .pf-dd-algo-meta {
    display: grid;
    grid-template-columns: 100px 1fr;
    gap: 12px;
    font-size: 13px;
    line-height: 1.55;
    padding-top: 10px;
    border-top: 1px dashed var(--rule);
  }
  .pf-dd-algo-meta-label {
    font-family: var(--mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--ink-faded);
    padding-top: 2px;
  }
  .pf-dd-algo-meta-value {
    color: var(--ink-soft);
  }

  /* Numbers */
  .pf-dd-numbers {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1px;
    background: var(--rule);
    border: 1px solid var(--rule);
  }
  .pf-dd-number {
    background: var(--paper);
    padding: 18px 20px;
  }
  .pf-dd-number-metric {
    font-family: var(--mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--ink-faded);
    margin-bottom: 8px;
    font-weight: 600;
  }
  .pf-dd-number-value {
    font-family: var(--serif);
    font-size: 26px;
    font-weight: 500;
    color: var(--ink);
    letter-spacing: -0.01em;
    margin-bottom: 6px;
    line-height: 1.1;
  }
  .pf-dd-number-note {
    font-family: var(--serif);
    font-size: 12px;
    line-height: 1.5;
    color: var(--ink-soft);
    font-style: italic;
  }

  /* War stories */
  .pf-dd-stories {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
  .pf-dd-story {
    padding-left: 24px;
    border-left: 2px solid var(--rule);
    position: relative;
  }
  .pf-dd-story::before {
    content: '✖';
    position: absolute;
    left: -10px;
    top: 0;
    width: 18px;
    height: 18px;
    background: var(--paper);
    color: var(--accent);
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .pf-dd-story-scenario {
    font-family: var(--serif);
    font-size: 18px;
    font-weight: 500;
    color: var(--ink);
    margin-bottom: 14px;
    letter-spacing: -0.005em;
    line-height: 1.3;
  }
  .pf-dd-story-row {
    display: grid;
    grid-template-columns: 130px 1fr;
    gap: 14px;
    padding: 10px 0;
    border-bottom: 1px dotted var(--rule);
    align-items: baseline;
  }
  .pf-dd-story-row:last-child { border-bottom: none; }
  .pf-dd-story-label {
    font-family: var(--mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--ink-faded);
    font-weight: 600;
  }
  .pf-dd-story-label.lesson { color: var(--accent); }
  .pf-dd-story-value {
    font-family: var(--serif);
    font-size: 14px;
    line-height: 1.6;
    color: var(--ink);
  }
  .pf-dd-story-value.lesson {
    font-style: italic;
    color: var(--accent);
  }

  /* Edge cases */
  .pf-dd-edges {
    display: flex;
    flex-direction: column;
    gap: 0;
    border-top: 1px solid var(--rule);
    border-bottom: 1px solid var(--rule);
  }
  .pf-dd-edge {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) 2fr;
    gap: 24px;
    padding: 16px 0;
    border-bottom: 1px dotted var(--rule);
    align-items: baseline;
  }
  .pf-dd-edge:last-child { border-bottom: none; }
  .pf-dd-edge-case {
    font-family: var(--serif);
    font-size: 14px;
    font-weight: 500;
    color: var(--ink);
    line-height: 1.4;
  }
  .pf-dd-edge-handling {
    font-family: var(--serif);
    font-size: 14px;
    line-height: 1.6;
    color: var(--ink-soft);
  }

  /* Would-change retrospective */
  .pf-dd-retro {
    padding: 24px 28px;
    background: var(--paper-warm);
    border: 1px solid var(--rule);
    border-left: 3px solid var(--accent);
    font-family: var(--serif);
    font-size: 15px;
    line-height: 1.65;
    color: var(--ink);
    font-style: italic;
  }

  /* Chains */
  .pf-dd-chains {
    display: flex;
    flex-direction: column;
    gap: 36px;
  }
  .pf-dd-chain {
    padding: 24px 28px;
    background: var(--ink);
    color: var(--paper);
    border-radius: 4px;
  }
  .pf-dd-chain-title {
    font-family: var(--mono);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--accent);
    margin-bottom: 22px;
    font-weight: 600;
  }
  .pf-dd-chain-steps {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .pf-dd-chain-step {
    display: flex;
    gap: 18px;
    padding: 14px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .pf-dd-chain-step:last-child { border-bottom: none; }
  .pf-dd-chain-num {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--accent);
    color: var(--ink);
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 2px;
  }
  .pf-dd-chain-qa {
    flex: 1;
  }
  .pf-dd-chain-q {
    font-family: var(--serif);
    font-size: 15px;
    font-weight: 500;
    color: var(--paper);
    margin-bottom: 8px;
    line-height: 1.4;
    letter-spacing: -0.005em;
  }
  .pf-dd-chain-a {
    font-family: var(--serif);
    font-size: 14px;
    line-height: 1.6;
    color: rgba(248, 244, 235, 0.78);
    padding-left: 14px;
    border-left: 2px solid var(--accent);
  }

  /* responsive */
  @media (max-width: 900px) {
    .pf-shell { padding: 32px 24px 80px; }
    .pf-header { grid-template-columns: 1fr; gap: 16px; }
    .pf-subtitle { text-align: left; }
    .pf-meta { grid-template-columns: repeat(2, 1fr); }
    .pf-meta-cell { border-right: none; border-bottom: 1px solid var(--rule); }
    .pf-meta-cell:nth-child(odd) { border-right: 1px solid var(--rule); }
    .pf-project { grid-template-columns: 1fr; gap: 24px; }
    .pf-side { position: static; }
    .pf-dd-shell { grid-template-columns: 1fr; gap: 32px; }
    .pf-dd-side { position: static; border-right: none; border-bottom: 1px solid var(--rule); padding-right: 0; padding-bottom: 24px; }
    .pf-dd-side-list { flex-direction: row; flex-wrap: wrap; gap: 6px; }
    .pf-dd-side-item { border-left: none; border-bottom: 2px solid transparent; padding: 8px 12px; font-size: 13px; }
    .pf-dd-side-item.active { border-left-color: transparent; border-bottom-color: var(--accent); }
    .pf-dd-title { font-size: 32px; }
    .pf-dd-numbers { grid-template-columns: 1fr; }
    .pf-dd-decision-row, .pf-dd-story-row { grid-template-columns: 1fr; gap: 4px; }
    .pf-dd-edge { grid-template-columns: 1fr; gap: 6px; }
    .pf-dd-algo-meta { grid-template-columns: 1fr; gap: 4px; }
    .pf-tab { padding: 14px 16px 12px; font-size: 18px; }
  }
`;

/* ============================================================================
 * COMPONENTS
 * ========================================================================== */

const Section = ({ num, title, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="pf-section">
      <div className="pf-section-head" onClick={() => setOpen(!open)}>
        <span className="pf-section-num">{num}</span>
        <h3 className="pf-section-title">{title}</h3>
        <span className="pf-section-toggle">{open ? '−' : '+'}</span>
      </div>
      {open && <div>{children}</div>}
    </div>
  );
};

const Project = ({ project, index }) => {
  const idx = String(index + 1).padStart(2, '0');
  return (
    <article className="pf-project">
      <aside className="pf-side">
        <span className="pf-tier" data-tier={project.tier}>
          {TIER_LABELS[project.tier]}
        </span>

        <div className="pf-side-row">
          <div className="pf-side-label">Year</div>
          <div className="pf-side-value">{project.year}</div>
        </div>
        <div className="pf-side-row">
          <div className="pf-side-label">Context</div>
          <div className="pf-side-value">{project.company}</div>
        </div>
        <div className="pf-side-row">
          <div className="pf-side-label">Role</div>
          <div className="pf-side-value">{project.role}</div>
        </div>
        <div className="pf-side-row">
          <div className="pf-side-label">Domains</div>
          <div className="pf-tags">
            {project.tags.map((t) => (
              <span key={t} className="pf-tag">{t}</span>
            ))}
          </div>
        </div>
      </aside>

      <div className="pf-body">
        <div className="pf-pid">Project · {idx}</div>
        <h2 className="pf-pname">{project.title}</h2>
        <p className="pf-oneline">{project.oneLine}</p>

        <div className="pf-headline">
          {Object.entries(project.headline).map(([k, v]) => (
            <div key={k} className="pf-headline-cell">
              <div className="pf-headline-label">{k}</div>
              <div className="pf-headline-value">{v}</div>
            </div>
          ))}
        </div>

        <Section num="§ 01" title="Narrative — the 90-second story">
          <div className="pf-prose">
            {project.narrative.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </Section>

        <Section num="§ 02" title="Problem">
          <ol className="pf-list">
            {project.problem.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ol>
        </Section>

        <Section num="§ 03" title="Architecture & technical depth" defaultOpen={false}>
          <div className="pf-arch">
            {project.architecture.map((a, i) => (
              <div key={i} className="pf-arch-item">
                <div className="pf-arch-name">{a.name}</div>
                <div className="pf-arch-detail">{a.detail}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section num="§ 04" title="Impact">
          <div className="pf-impact">
            <ol className="pf-list">
              {project.impact.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ol>
          </div>
        </Section>

        <Section num="§ 05" title="The killer answer">
          <div className="pf-killer">
            <div className="pf-killer-label">When asked: what was the hardest part?</div>
            <div className="pf-killer-text">{project.killerAnswer}</div>
          </div>
        </Section>

        <Section num="§ 06" title="Grill questions & answers" defaultOpen={false}>
          <div className="pf-grill">
            {project.grillQuestions.map((g, i) => (
              <div key={i} className="pf-grill-item">
                <div className="pf-grill-q">{g.q}</div>
                <div className="pf-grill-a">{g.a}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section num="§ 07" title="Positioning landmines">
          <div className="pf-landmines">
            <ul>
              {project.landmines.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          </div>
        </Section>
      </div>
    </article>
  );
};

/* ============================================================================
 * DEEP DIVE
 * ========================================================================== */

const DeepDive = ({ projects, selectedId, onSelect }) => {
  const dd = DEEP_DIVES[selectedId];
  const project = projects.find((p) => p.id === selectedId);

  if (!dd || !project) {
    return (
      <div style={{ padding: '40px 0', fontFamily: 'var(--serif)', color: 'var(--ink-soft)' }}>
        No deep dive available for this project yet.
      </div>
    );
  }

  return (
    <div className="pf-dd-shell">
      {/* Sidebar */}
      <aside className="pf-dd-side">
        <div className="pf-dd-side-label">Projects</div>
        <div className="pf-dd-side-list">
          {projects.map((p) => (
            <button
              key={p.id}
              className={`pf-dd-side-item ${p.id === selectedId ? 'active' : ''}`}
              onClick={() => onSelect(p.id)}
            >
              <span className="pf-dd-side-tier">T{p.tier}</span>
              {p.title}
            </button>
          ))}
        </div>
      </aside>

      {/* Main */}
      <div className="pf-dd-main">
        {/* Header */}
        <div className="pf-dd-header">
          <div className="pf-dd-eyebrow">
            {project.company} · {TIER_LABELS[project.tier]}
          </div>
          <h2 className="pf-dd-title">{project.title}</h2>
          <div className="pf-dd-framing">{dd.framing}</div>
        </div>

        {/* Decisions */}
        {dd.decisions && dd.decisions.length > 0 && (
          <section className="pf-dd-section">
            <div className="pf-dd-section-head">
              <span className="pf-dd-section-num">§ 01</span>
              <h3 className="pf-dd-section-title">
                Decisions <em>— with the tradeoff stated</em>
              </h3>
            </div>
            <div className="pf-dd-decisions">
              {dd.decisions.map((d, i) => (
                <div key={i} className="pf-dd-decision">
                  <div className="pf-dd-decision-q">{d.q}</div>
                  {d.options && d.options.length > 0 && (
                    <ul className="pf-dd-options">
                      {d.options.map((o, j) => (
                        <li key={j} className="pf-dd-option">{o}</li>
                      ))}
                    </ul>
                  )}
                  <div className="pf-dd-decision-row">
                    <div className="pf-dd-decision-label chosen">Chosen</div>
                    <div className="pf-dd-decision-value chosen">{d.chosen}</div>
                  </div>
                  <div className="pf-dd-decision-row">
                    <div className="pf-dd-decision-label">Why</div>
                    <div className="pf-dd-decision-value">{d.why}</div>
                  </div>
                  <div className="pf-dd-decision-row">
                    <div className="pf-dd-decision-label">Tradeoff</div>
                    <div className="pf-dd-decision-value tradeoff">{d.tradeoff}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Algorithms */}
        {dd.algorithms && dd.algorithms.length > 0 && (
          <section className="pf-dd-section">
            <div className="pf-dd-section-head">
              <span className="pf-dd-section-num">§ 02</span>
              <h3 className="pf-dd-section-title">
                Algorithms <em>& data structures</em>
              </h3>
            </div>
            <div className="pf-dd-algos">
              {dd.algorithms.map((a, i) => (
                <div key={i} className="pf-dd-algo">
                  <div className="pf-dd-algo-name">{a.name}</div>
                  <div className="pf-dd-algo-desc">{a.description}</div>
                  <div className="pf-dd-algo-meta">
                    <div className="pf-dd-algo-meta-label">Complexity</div>
                    <div className="pf-dd-algo-meta-value">{a.complexity}</div>
                    <div className="pf-dd-algo-meta-label">Why</div>
                    <div className="pf-dd-algo-meta-value">{a.why}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Numbers */}
        {dd.numbers && dd.numbers.length > 0 && (
          <section className="pf-dd-section">
            <div className="pf-dd-section-head">
              <span className="pf-dd-section-num">§ 03</span>
              <h3 className="pf-dd-section-title">
                Numbers <em>worth memorizing</em>
              </h3>
            </div>
            <div className="pf-dd-numbers">
              {dd.numbers.map((n, i) => (
                <div key={i} className="pf-dd-number">
                  <div className="pf-dd-number-metric">{n.metric}</div>
                  <div className="pf-dd-number-value">{n.value}</div>
                  <div className="pf-dd-number-note">{n.note}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Failure modes designed for */}
        {dd.warStories && dd.warStories.length > 0 && (
          <section className="pf-dd-section">
            <div className="pf-dd-section-head">
              <span className="pf-dd-section-num">§ 04</span>
              <h3 className="pf-dd-section-title">
                Failure modes <em>designed for</em>
              </h3>
            </div>
            <div className="pf-dd-stories">
              {dd.warStories.map((s, i) => (
                <div key={i} className="pf-dd-story">
                  <div className="pf-dd-story-scenario">{s.scenario}</div>
                  <div className="pf-dd-story-row">
                    <div className="pf-dd-story-label">Risk</div>
                    <div className="pf-dd-story-value">{s.whatHappened}</div>
                  </div>
                  <div className="pf-dd-story-row">
                    <div className="pf-dd-story-label">Designed mitigation</div>
                    <div className="pf-dd-story-value">{s.howResolved}</div>
                  </div>
                  <div className="pf-dd-story-row">
                    <div className="pf-dd-story-label lesson">Principle</div>
                    <div className="pf-dd-story-value lesson">{s.lesson}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Edge cases */}
        {dd.edgeCases && dd.edgeCases.length > 0 && (
          <section className="pf-dd-section">
            <div className="pf-dd-section-head">
              <span className="pf-dd-section-num">§ 05</span>
              <h3 className="pf-dd-section-title">
                Edge cases <em>& their handling</em>
              </h3>
            </div>
            <div className="pf-dd-edges">
              {dd.edgeCases.map((e, i) => (
                <div key={i} className="pf-dd-edge">
                  <div className="pf-dd-edge-case">{e.case}</div>
                  <div className="pf-dd-edge-handling">{e.handling}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* What I'd change */}
        {dd.whatIWouldChange && (
          <section className="pf-dd-section">
            <div className="pf-dd-section-head">
              <span className="pf-dd-section-num">§ 06</span>
              <h3 className="pf-dd-section-title">
                What I'd change <em>looking back</em>
              </h3>
            </div>
            <div className="pf-dd-retro">{dd.whatIWouldChange}</div>
          </section>
        )}

        {/* Interviewer chains */}
        {dd.chains && dd.chains.length > 0 && (
          <section className="pf-dd-section">
            <div className="pf-dd-section-head">
              <span className="pf-dd-section-num">§ 07</span>
              <h3 className="pf-dd-section-title">
                Interviewer chains <em>— Q → A → but-why → A</em>
              </h3>
            </div>
            <div className="pf-dd-chains">
              {dd.chains.map((c, i) => (
                <div key={i} className="pf-dd-chain">
                  <div className="pf-dd-chain-title">{c.title}</div>
                  <div className="pf-dd-chain-steps">
                    {c.steps.map((s, j) => (
                      <div key={j} className="pf-dd-chain-step">
                        <div className="pf-dd-chain-num">{j + 1}</div>
                        <div className="pf-dd-chain-qa">
                          <div className="pf-dd-chain-q">{s.q}</div>
                          <div className="pf-dd-chain-a">{s.a}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
 * ROOT
 * ========================================================================== */

const Projects = () => {
  const [view, setView] = useState('overview');
  const [filter, setFilter] = useState('all');
  const [selectedDeepDiveId, setSelectedDeepDiveId] = useState(PROJECTS[0].id);

  const filters = useMemo(() => {
    const tags = new Set();
    PROJECTS.forEach((p) => p.tags.forEach((t) => tags.add(t)));
    return ['all', 'signature', 'strong', 'selective', ...Array.from(tags)];
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return PROJECTS;
    if (filter === 'signature') return PROJECTS.filter((p) => p.tier === 1);
    if (filter === 'strong') return PROJECTS.filter((p) => p.tier === 2);
    if (filter === 'selective') return PROJECTS.filter((p) => p.tier === 3);
    return PROJECTS.filter((p) => p.tags.includes(filter));
  }, [filter]);

  const filterLabel = (f) => {
    if (f === 'all') return `All · ${PROJECTS.length}`;
    if (f === 'signature') return 'Signature';
    if (f === 'strong') return 'Strong';
    if (f === 'selective') return 'Selective';
    return f;
  };

  const deepDiveCount = Object.keys(DEEP_DIVES).length;

  return (
    <div className="pf-root">
      <style>{css}</style>
      <div className="pf-grain" />
      <div className="pf-shell">

        {/* HEADER */}
        <header className="pf-header">
          <div>
            <div className="pf-eyebrow">Engineering Dossier · v2026.01</div>
            <h1 className="pf-title">
              The work,<br />
              <em>in detail.</em>
            </h1>
          </div>
          <p className="pf-subtitle">
            A complete record of projects shipped — with the narratives,
            tradeoffs, impact, and the questions that broke prior candidates.
          </p>
        </header>

        {/* META */}
        <div className="pf-meta">
          <div className="pf-meta-cell">
            <div className="pf-meta-label">Projects</div>
            <div className="pf-meta-value">{PROJECTS.length}</div>
          </div>
          <div className="pf-meta-cell">
            <div className="pf-meta-label">Signature work</div>
            <div className="pf-meta-value">
              {PROJECTS.filter((p) => p.tier === 1).length}
            </div>
          </div>
          <div className="pf-meta-cell">
            <div className="pf-meta-label">Years</div>
            <div className="pf-meta-value">2021—2026</div>
          </div>
          <div className="pf-meta-cell">
            <div className="pf-meta-label">Positioning</div>
            <div className="pf-meta-value" style={{ fontSize: 17, fontStyle: 'italic', fontWeight: 400 }}>
              Product-minded systems engineer
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="pf-tabs">
          <button
            className={`pf-tab ${view === 'overview' ? 'active' : ''}`}
            onClick={() => setView('overview')}
          >
            Overview
          </button>
          <button
            className={`pf-tab ${view === 'deep-dive' ? 'active' : ''}`}
            onClick={() => setView('deep-dive')}
          >
            Deep <em>dive</em>
            <span className="pf-tab-badge">Staff-level</span>
          </button>
        </div>

        {view === 'overview' ? (
          <>
            {/* FILTERS */}
            <div className="pf-filters">
              {filters.map((f) => (
                <button
                  key={f}
                  className={`pf-filter ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {filterLabel(f)}
                </button>
              ))}
            </div>

            {/* PROJECTS */}
            <main>
              {filtered.map((p, i) => (
                <Project key={p.id} project={p} index={PROJECTS.indexOf(p)} />
              ))}
            </main>

            {/* FOOTER */}
            <footer className="pf-footer">
              <span>End of dossier</span>
              <span>{filtered.length} of {PROJECTS.length} shown</span>
            </footer>
          </>
        ) : (
          <>
            <DeepDive
              projects={PROJECTS}
              selectedId={selectedDeepDiveId}
              onSelect={setSelectedDeepDiveId}
            />
            <footer className="pf-footer" style={{ marginTop: 64 }}>
              <span>Deep dive · {deepDiveCount} projects</span>
              <span>Use when interviewer goes 3+ layers deep</span>
            </footer>
          </>
        )}

      </div>
    </div>
  );
};

export default Projects;
