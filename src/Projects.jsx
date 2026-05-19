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
      'The most-probed project at staff level. Architecture is well-documented internally; be ready for chains on capture/security/data-parity/blast-radius. All war-story content below is documented failure modes designed for, not incidents you should claim happened unless you remember them specifically.',
    decisions: [
      {
        q: 'Where to capture traffic — in-process middleware vs sidecar?',
        options: [
          'In-process middleware: lowest overhead, full request context.',
          'Sidecar container with GoReplay: zero application coupling, independent lifecycle.',
        ],
        chosen: 'Sidecar with GoReplay.',
        why: 'Zero application code changes. Independent rollout. Separate failure domain. Setup as a reusable Docker image with a few configurations across services. ~10% additional CPU/memory overhead measured in production.',
        tradeoff: 'Extra container resources and a network hop. Accepted because the alternative (in-process) couples capture lifecycle to release lifecycle.',
      },
      {
        q: 'TLS handling — terminate at LB or inside the pod?',
        options: [
          'Terminate at LB: simple, plaintext crosses internal network.',
          'In-pod Nginx sandwich: Nginx1 SSL-offloads, GoReplay captures plaintext, Nginx2 re-encrypts before app.',
        ],
        chosen: 'In-pod Nginx sandwich.',
        why: 'GoReplay is HTTP-aware and needs decrypted traffic. The sandwich keeps plaintext inside the pod, with Nginx1 doing SSL offload and Nginx2 (optional) re-encrypting before the application.',
        tradeoff: 'Two Nginx instances per pod and more config surface. Accepted because HTTP-level fidelity and in-pod security were both required.',
      },
      {
        q: 'Bus partitioning — what is the partition key?',
        options: [
          'tenant_id: groups by tenant but loses request/response co-location.',
          'transaction_id: guarantees request and response land on the same partition.',
        ],
        chosen: 'transaction_id as partition key.',
        why: 'Request and response for the same transaction must be paired by the validator. Same-partition placement makes pairing trivial without coordination logic on the consumer.',
        tradeoff: 'Requires consistent transaction_id propagation. Standardized as request metadata along with timestamp.',
      },
      {
        q: 'Downstream write handling — allow real writes or mock?',
        options: [
          'Allow real writes: true e2e validation, doubles downstream traffic.',
          'Envoy + Wiremock mock: zero blast radius, sacrifices true downstream e2e.',
        ],
        chosen: 'Envoy + Wiremock mock at sidecar.',
        why: 'Envoy proxies all outbound traffic from the parallel pod; based on configured rules it either allows, blocks, or reroutes downstream calls to Wiremock, which serves dynamic dummy responses. Blast radius is zero by construction — the parallel server cannot touch external state.',
        tradeoff: 'Cannot validate true downstream side-effect chains. Acceptable because corrupting downstream production is unacceptable; e2e validated separately in non-prod.',
      },
      {
        q: 'Data validation algorithm — full diff or workflow-scoped?',
        options: [
          'Full-table diff: correct but O(table size); infeasible at scale.',
          'Workflow-scoped BFS over FK graph, bounded by tenant + parent record + time window.',
        ],
        chosen: 'Workflow-scoped BFS.',
        why: 'Replay Validator Middleware maintains per-workflow config of impacted tables. Starting from tenant_id and parent_record_id, BFS traverses FK relationships within a bounded time window. Variable fields (Id, Timestamp, etc.) are intelligently ignored. Results logged to Splunk/ELK for analysis.',
        tradeoff: 'Requires accurate workflow→tables mapping config per write workflow.',
      },
      {
        q: 'Replay rate — fixed 1× or variable speed (0.5×/2×/3×)?',
        options: [
          'Sync 1×: easiest correctness, couples validator perf to prod.',
          'Async variable: decoupled, enables stability testing under peak.',
        ],
        chosen: 'Async with 0.5×/2×/3× replay support.',
        why: 'Replay Validator Middleware stores requests/responses for replay at variable speeds. Particularly useful for assessing system stability during peak traffic scenarios. Used during Hibernate upgrade and Oracle Exit to validate behavior before FY peak.',
        tradeoff: 'Validation lag — mismatches surface seconds to minutes after the request. Acceptable for non-real-time validation.',
      },
    ],
    algorithms: [
      {
        name: 'Workflow-scoped BFS over FK graph',
        description:
          'Per write workflow, lookup impacted tables from config. Starting at tenant_id and parent_record_id, traverse FK edges in both active and parallel DBs within a bounded time window. Compare resulting row sets with variable fields (Id, Timestamp) ignored.',
        complexity: 'O(impacted rows × avg row size) per workflow execution.',
        why: 'Full-table diff is infeasible at TB scale. Scoping by tenant + parent_record + time window gives bounded, semantically meaningful comparison.',
      },
      {
        name: 'Response normalization with variable-field ignore',
        description:
          'Before comparing active vs parallel responses, normalize: skip variable headers and fields (timestamps, generated IDs, transaction metadata). Per-workflow ignore config can be extended for known-divergent fields.',
        complexity: 'O(response size) per comparison.',
        why: 'Without normalization, every response would diff on timestamps and generated IDs. Normalization is required for the validator to produce signal instead of noise.',
      },
      {
        name: 'Correlation via transaction_id',
        description:
          'Request and response correlated through transaction_id propagated via request metadata. Both stored together on the same bus partition. Validator pairs them for response, data, and performance comparison.',
        complexity: 'O(1) pairing per transaction.',
        why: 'Without correlation, async pairing requires coordination logic. Same-partition placement eliminates the coordination problem.',
      },
    ],
    numbers: [
      { metric: 'Sidecar resource overhead', value: '~10% CPU & memory', note: 'Documented in setup specs. No service deterioration of production server.' },
      { metric: 'Traffic replicated', value: '1M+ requests/day', note: 'Supports HTTP, REST, GraphQL, SOAP, RPC. Extensible to non-HTTP.' },
      { metric: 'Replay speeds supported', value: '0.5× / 2× / 3×', note: 'Used for stress testing system stability before peak periods.' },
      { metric: 'Manual regression hours saved', value: '1000+', note: 'Org-wide across initiatives.' },
      { metric: 'Smooth Oracle Exit releases', value: '70+', note: '32 TB Oracle migration initiative; 0 P0/P1 issues.' },
      { metric: 'Hibernate upgrade hours saved', value: '200+', note: 'Hibernate 3.x → 5.x upgrade, validated using the framework before FY23 peak. 0 P0/P1.' },
      { metric: 'Sidecar listen port / forward port', value: '9443 → 8443', note: 'Sidecar intercepts inbound on 9443, forwards customer traffic to 8443.' },
    ],
    warStories: [
      {
        scenario: 'False positives from variable fields in responses',
        whatHappened:
          'Responses contain timestamps, generated IDs, and metadata that differ between active and parallel runs by design. Without normalization, every comparison would flag mismatch.',
        howResolved:
          'Validator intelligently ignores variable fields like Id, Timestamp, and similar. Per-workflow ignore config extensible for new known-divergent fields. Comparison results logged to Splunk/ELK with categorization.',
        lesson:
          'Normalization is a first-class feature in any comparison-based validator. The default mode must be to ignore known-noisy fields.',
      },
      {
        scenario: 'Downstream calls during replay',
        whatHappened:
          'Replaying write workflows would trigger real downstream calls (Notification service, payment processors, etc.) and double their traffic — violating their SLAs and corrupting their state.',
        howResolved:
          'Envoy sidecar in staging deployment pods captures all outbound traffic. Based on rules, allows / blocks / reroutes downstream calls to Wiremock, which returns dummy responses. Parallel server cannot reach external state.',
        lesson:
          'Any external side effect — call, write, event — must be mocked at the network boundary for blast radius to be zero by construction, not by convention.',
      },
      {
        scenario: 'TLS-encrypted traffic capture',
        whatHappened:
          'Production traffic is HTTPS; GoReplay needs HTTP-level visibility to capture endpoint, body, headers. Naive capture from outside the pod would either lose semantics (L4) or expose plaintext on the network.',
        howResolved:
          'Nginx1 inside the pod terminates TLS. GoReplay captures decrypted traffic. Nginx2 (optional) re-encrypts before forwarding to the application. Plaintext is contained within the pod boundary.',
        lesson:
          'Security boundaries should be physical (pod-level), not logical. In-pod TLS termination preserves both fidelity and isolation.',
      },
    ],
    edgeCases: [
      { case: 'Variable fields in responses (Id, Timestamp, etc.)', handling: 'Intelligently ignored by the validator. Per-workflow ignore-field config extensible.' },
      { case: 'Long-running workflows spanning multiple requests', handling: 'transaction_id propagates across requests, keeping all related events on the same partition.' },
      { case: 'Encrypted traffic at rest', handling: 'Request, response, and metadata encrypted before forwarding to the messaging system. Data secure at rest.' },
      { case: 'Active server performance impact', handling: 'Sidecar overhead held to ~10% CPU/memory. Capture and forwarding async to minimize impact on active request path.' },
      { case: 'Non-HTTP protocols', handling: 'Architecture extensible to non-HTTP per docs; current support covers HTTP/HTTPS with REST/GraphQL/SOAP/RPC.' },
    ],
    whatIWouldChange:
      'Anything here is your retrospective opinion, not from your docs. Sample candidates to consider (mark as your view): multi-tenant middleware to reduce per-team infra duplication; better self-serve onboarding to reduce time-to-value for new services; streaming capture to reduce storage costs. Verify before claiming.',
    chains: [
      {
        title: 'The capture-architecture chain',
        steps: [
          { q: 'Why sidecar instead of in-process middleware?', a: 'Zero coupling to app lifecycle, independent rollout, separate failure domain, no application code changes.' },
          { q: 'How do you handle HTTPS?', a: 'Nginx1 terminates TLS inside the pod, GoReplay captures plaintext, Nginx2 (optional) re-encrypts before the app receives it.' },
          { q: 'Why two Nginx instances?', a: 'GoReplay needs HTTP-level visibility, which requires plaintext. Sandwich keeps plaintext inside the pod boundary.' },
          { q: 'What is the actual production overhead?', a: '~10% CPU and memory documented in setup. No service deterioration observed.' },
          { q: 'How does the sidecar avoid impacting customer requests?', a: 'Sidecar listens on 9443, intercepts inbound, forwards customer traffic to 8443. Capture and forwarding are async so the request path is unblocked.' },
        ],
      },
      {
        title: 'The data-parity correctness chain',
        steps: [
          { q: 'How do you compare data across two databases at production scale?', a: 'BFS over FK relationships from tenant_id and parent_record_id, scoped by time window. Per-workflow config defines impacted tables. Variable fields ignored.' },
          { q: 'Why graph-based instead of full-table diff?', a: 'Full-table diff is O(table size). Workflow-scoped BFS is O(impacted rows) and semantically meaningful.' },
          { q: 'How do you handle non-deterministic fields?', a: 'Variable fields (Id, Timestamp, generated metadata) ignored by default. Ignore list extensible per workflow.' },
          { q: 'Where do results go?', a: 'Splunk/ELK with categorization. Deeper analysis via dashboards.' },
        ],
      },
      {
        title: 'The blast-radius chain',
        steps: [
          { q: 'What happens if the replay system goes down?', a: 'Nothing customer-facing. Production traffic continues unaffected; only validation coverage drops temporarily.' },
          { q: 'How do you guarantee zero impact to downstreams?', a: 'Envoy + Wiremock at the parallel pod boundary. All outbound calls captured; mocks return dummy responses. Parallel server cannot reach external state.' },
          { q: 'What is the worst-case failure of the framework itself?', a: 'Missing a regression. The framework is passive — it can fail to catch issues, never cause them.' },
          { q: 'How is the parallel server\'s mock config protected from misconfiguration?', a: 'Mock config is part of the sidecar setup, gated by deployment review. The parallel server has no path to production downstreams by design.' },
        ],
      },
    ],
  },
  'mysql-postgres': {
    framing:
      'Heavily documented internally with FMEAs and risk register. Interviewers will probe decision rationale, parity strategy, and rollback. All numbers and migration files referenced below are from your docs.',
    decisions: [
      {
        q: 'Direct migration vs staged via MySQL 8?',
        options: [
          'Staged (5.7 → 8.0 → Postgres): two cutovers, two parity efforts, MySQL 8 licensing interim.',
          'Direct (5.7 → Postgres): single effort, immediate Postgres benefits.',
        ],
        chosen: 'Direct.',
        why: 'Single effort eliminates a second migration and months of dual-operational complexity. Decision matrix evaluated cost, time-to-value, complexity, and business disruption. Three-cluster topology with reverse DMS provides rollback safety.',
        tradeoff: 'Larger one-time risk surface. Bigger feature gap, more extensive testing. Bought down with three parity layers (DB, traffic replay, data lake) and rollback cluster.',
      },
      {
        q: 'Aurora Postgres vs RDS Postgres vs Aurora Serverless v2?',
        options: [
          'RDS Postgres: standard, slower failover.',
          'Aurora Serverless v2: auto-scaling, variable cost.',
          'Aurora Postgres provisioned: highest performance, predictable cost.',
        ],
        chosen: 'Aurora Postgres provisioned.',
        why: 'Lowest-risk choice due to platform familiarity (team knew Aurora from MySQL Aurora) and predictable scale behavior. Driven by decision matrix.',
        tradeoff: 'Manual compute scaling vs Serverless auto-scale. Acceptable because workload is predictable.',
      },
      {
        q: 'Three-cluster topology — necessary?',
        options: [
          'Two clusters (A → B): no rollback.',
          'Three clusters (A → B → C): C is MySQL 5.7 rollback cluster replicating from B, with A as last-resort fallback.',
        ],
        chosen: 'Three clusters.',
        why: 'Cluster C is the rollback cluster for Postgres failure; replicates from Cluster B. Cluster A remains the last-resort rollback if B→A replication fails.',
        tradeoff: 'Extra infra during cutover. Decommissioned post-bake. Money traded for rollback optionality.',
      },
      {
        q: 'Collation for case-insensitive matching — query-level vs DB-level?',
        options: [
          'Query level: LOWER() in HQL, touches every query.',
          'Application level: normalize before querying.',
          'DB level: ICU non-deterministic collation matching MySQL utf8_general_ci.',
        ],
        chosen: 'DB-level ICU collation.',
        why: 'CREATE COLLATION case_insensitive (provider = icu, locale = \'und-u-ks-level2\', deterministic = false), applied via ALTER TABLE. Matches MySQL utf8_general_ci semantics with zero query changes.',
        tradeoff: 'Non-deterministic collation has slight perf overhead vs deterministic. Acceptable; alternative was auditing hundreds of queries.',
      },
      {
        q: 'AUTO_INCREMENT → BIGSERIAL handoff?',
        options: [
          'Let Hibernate handle: variable behavior.',
          'GenerationType.IDENTITY + use-new-id-generator-mappings: false + sequence sync post-load.',
        ],
        chosen: 'GenerationType.IDENTITY + setval() post-load.',
        why: 'Hibernate abstracts the engine difference. Post-DMS-load, run SELECT setval(\'<seq>\', COALESCE((SELECT MAX(id) FROM <table>), 1)) for every sequence to align with existing data.',
        tradeoff: 'Sequence sync step must be in the cutover runbook; missing it causes duplicate-key on first insert.',
      },
      {
        q: 'JSON column handling?',
        options: [
          'Native JSON type: differs MySQL vs Postgres in operators and Hibernate behavior.',
          'PostgreSQLJsonType custom Hibernate UserType for jsonb.',
        ],
        chosen: 'PostgreSQLJsonType implementing Hibernate UserType.',
        why: 'Entity annotated with @TypeDef(name="pgsql_json", typeClass=PostgreSQLJsonType.class). Handles serialization/deserialization consistently. No MySQL-specific JSON functions (JSON_EXTRACT etc.) found in queries, so query layer was clean.',
        tradeoff: 'Custom type code to maintain. Necessary because generic ORM behavior on JSON conversion is unpredictable.',
      },
      {
        q: 'Outbox during cutover?',
        options: [
          'Replicate outbox via DMS: simple, but events re-publish to consumers.',
          'Independent Postgres outbox with temp Kafka topics during parity, switch at cutover.',
        ],
        chosen: 'Independent outbox with temp topics.',
        why: 'Replicating outbox would cause CDC consumers to see duplicate events during parity. Temp topics isolate parallel-server events during validation. At cutover: drain MySQL outbox, stop forward DMS, switch outbox publishing to original topics.',
        tradeoff: 'Temp topic infrastructure during parity phase. Required coordination with Outbox + UIP teams.',
      },
      {
        q: 'One-shot cutover vs incremental migration?',
        options: [
          'Incremental: per-table/per-tenant, dual-write app translation = permanent tech debt.',
          'One-shot: drain, cutover, validate.',
        ],
        chosen: 'One-shot.',
        why: 'MySQL and Postgres are fundamentally incompatible — dual-write requires application-level translation, permanent perf cost. Schema differences (engine, charset, partition, sequences) make per-table migration impractical. 3-5 hour downtime worth eliminating weeks of dual-write complexity.',
        tradeoff: '3-5 hour cutover window. Mitigated by lowest-traffic scheduling, rehearsals, pre-signed readiness checklists.',
      },
    ],
    algorithms: [
      {
        name: 'Sequence sync post-load (setval)',
        description:
          'After DMS bulk load, iterate every Postgres BIGSERIAL sequence and run SELECT setval(\'<seq>\', COALESCE((SELECT MAX(id) FROM <table>), 1)). Verified by audit query.',
        complexity: 'O(N tables).',
        why: 'Without it, first insert post-cutover collides with existing ID — silent corruption. Required runbook step.',
      },
      {
        name: 'Three-layer parity validation',
        description:
          'Three independent layers run concurrently before cutover: (1) Deepchecks for DB parity (row count, checksum, spot-diff); (2) Traffic replay on parallel app stack to validate request/response and performance at production scale; (3) Batch ingestion parity to validate data lake pipeline. All three green = cutover precondition.',
        complexity: 'Parallel per-layer.',
        why: 'Each layer catches a different class of issue. DB drift won\'t catch HQL behavior differences (collation, isolation). Traffic replay won\'t catch downstream pipeline drift. Batch ingestion catches data lake schema/value drift.',
      },
      {
        name: 'Transaction isolation explicit annotation',
        description:
          'All 95 @Transactional methods audited. Explicit @Transactional(isolation = Isolation.REPEATABLE_READ) on critical paths: idempotency checks, concurrent series updates, name uniqueness. Concurrent test suite added.',
        complexity: 'One-time audit + ongoing.',
        why: 'Postgres defaults to READ COMMITTED; MySQL InnoDB defaults to REPEATABLE READ. Implicit isolation is engine-dependent. Explicit annotation makes isolation engine-agnostic.',
      },
    ],
    numbers: [
      { metric: 'Flyway migrations converted', value: '684+', note: 'V20170216 to V20250821. AUTO_INCREMENT → BIGSERIAL, UNSIGNED → CHECK, ENGINE/CHARSET stripped.' },
      { metric: 'Total data size', value: '32 TB + 5 TB audit', note: 'Per AWS SME, largest unsharded migration in South Asia Pacific. Phrase as "per AWS SME" not absolute.' },
      { metric: 'JSON parsing code reduction', value: '60%', note: 'Postgres jsonb operators replaced custom MySQL JSON_EXTRACT wrappers.' },
      { metric: 'Stored procedures rewritten', value: '3', note: 'PL/pgSQL: outbox partition management, heartbeat, data seeding.' },
      { metric: '@Transactional methods audited', value: '95 locations', note: 'For explicit isolation level annotation.' },
      { metric: 'P0/P1 issues post-cutover', value: '0', note: 'Achieved through three parity layers + rehearsed rollback.' },
      { metric: 'Cutover window', value: '3-5 hours', note: 'Lowest-traffic scheduling. Code freeze + outbox drain + DMS switch + app config + post-checks.' },
    ],
    warStories: [
      {
        scenario: 'CHAR(15) padding semantics difference',
        whatHappened:
          'MySQL CHAR pads with spaces and ignores trailing spaces in comparison; Postgres includes them. \'abc\' = \'abc \' is true in MySQL, false in Postgres. Identified in pre-migration audit as a risk to all HQL joins on CHAR(15) columns.',
        howResolved:
          'Migration V20251104210000__fix_char15_columns.sql converts all CHAR(15) → VARCHAR(255). Java entities already use String, no code change needed. Re-validated joins in parity.',
        lesson:
          'Fixed-length string semantics differ across engines. VARCHAR by default unless there is a specific reason for fixed-length.',
      },
      {
        scenario: 'Sequence vs AUTO_INCREMENT handoff',
        whatHappened:
          'Documented risk: post-DMS-load, Postgres sequences start at 1 while tables contain millions of rows. First INSERT would collide with existing IDs.',
        howResolved:
          'setval() applied to every sequence after bulk load. Added to cutover runbook as mandatory step. GenerationType.IDENTITY + use-new-id-generator-mappings: false on the Hibernate side abstracts the engine difference.',
        lesson:
          'Bulk-load + auto-increment handoff is a known foot-gun across engine migrations. Treat as a runbook step, not an assumption.',
      },
      {
        scenario: 'JSON type conversion',
        whatHappened:
          'MySQL stored JSON as native JSON type; Postgres needs jsonb. Hibernate does not handle this automatically. Risk: data corruption on read or write.',
        howResolved:
          'Built PostgreSQLJsonType implementing Hibernate UserType. Entity annotated with @TypeDef. Serialization tested round-trip. No MySQL-specific JSON functions found in queries (e.g., JSON_EXTRACT), so query layer was clean.',
        lesson:
          'For any non-trivial type mapping in ORM migrations, build a custom UserType. Generic ORM defaults are unpredictable on engine-specific types.',
      },
      {
        scenario: 'Transaction isolation default difference',
        whatHappened:
          'MySQL InnoDB defaults to REPEATABLE READ; Postgres defaults to READ COMMITTED. Idempotency checks and concurrent updates that relied on REPEATABLE READ semantics would silently behave differently.',
        howResolved:
          'Application team audited all 95 @Transactional methods. Explicit @Transactional(isolation = Isolation.REPEATABLE_READ) on critical operations: idempotency checks, concurrent series updates, name uniqueness. Concurrent test suite added.',
        lesson:
          'Isolation level defaults differ across engines. Engine migration is the right time to make isolation explicit, never implicit.',
      },
      {
        scenario: 'Outbox during cutover',
        whatHappened:
          'MySQL outbox could have unpublished events at cutover. Stopping forward DMS without draining would lose them; allowing them to publish while Postgres outbox also publishes would cause ordering issues and duplicates.',
        howResolved:
          'Cutover runbook includes explicit drain step: drain MySQL outbox, confirm CDC catches up, stop forward DMS, switch Postgres outbox to publish on original topics.',
        lesson:
          'CDC pipelines have inertia. Cutover sequencing must account for in-flight events, not just in-flight transactions.',
      },
    ],
    edgeCases: [
      { case: 'DMS lag during cutover', handling: 'Explicit lag check before proceeding. Abort and retry if lag > threshold. Lag monitor alerts during the entire cutover window.' },
      { case: 'Reverse replication for rollback', handling: 'Cluster C (MySQL 5.7) replicates from Cluster B (Postgres) post-cutover. Acts as rollback target if Postgres issues surface. Cluster A serves as last-resort fallback if B→A replication fails.' },
      { case: 'Schema drift across 8+ environments', handling: 'Pre-migration audit: dump and diff every environment. Drift reconciled in MySQL before migration. Otherwise per-env paths multiply.' },
      { case: 'Stored procedures (outbox partition mgmt, heartbeat, data seeding)', handling: '3 procedures rewritten in PL/pgSQL. Outbox partition strategy uses PostgreSQL functions (CREATE OR REPLACE FUNCTION add_partition...) to maintain time-based partitioning.' },
      { case: 'NULLS ordering difference (FIRST vs LAST)', handling: 'Audit found most ORDER BY on non-nullable id columns — no impact. Nullable columns got explicit NULLS LAST in HQL where needed.' },
      { case: 'In-flight tenant transactions at cutover', handling: 'Code freeze + readiness checklist. App layer drained before DMS stop. No active long-running transactions at cutover start.' },
    ],
    whatIWouldChange:
      'Retrospective opinion to verify before claiming. Possibilities: earlier schema drift audit across all 8+ envs (some non-standard customizations surfaced late); DMS lag alerting thresholds tuned pre-cutover instead of during; rehearse rollback in production-equivalent staging at least twice. Mark as your view, not source-documented.',
    chains: [
      {
        title: 'The direct-migration justification chain',
        steps: [
          { q: 'Why direct rather than staged via MySQL 8?', a: 'Single effort, immediate Postgres benefits, no MySQL 8 licensing interim, no dual-system operational overhead.' },
          { q: 'How did you justify the bigger one-time risk?', a: 'Three parity layers (DB, traffic replay, batch ingestion) plus three-cluster topology with reverse DMS for rollback. Rollback target measured in minutes.' },
          { q: 'What was your rollback trigger?', a: 'Deepchecks mismatch above threshold, DMS lag spike, P0 customer-facing symptoms, or replication health failure.' },
          { q: 'Have you tested the rollback?', a: 'Rehearsed in non-prod cutover dry runs end-to-end including outbox drain, DMS direction switch, app restart on MySQL.' },
        ],
      },
      {
        title: 'The data-correctness chain',
        steps: [
          { q: 'How do you know everything matches across 32 TB?', a: 'Three layers: DB parity (Deepchecks: row count, checksum, spot-diff), application parity (traffic replay validates request/response and perf), pipeline parity (batch ingestion to data lake validated separately).' },
          { q: 'What if Deepchecks shows small drift?', a: 'Investigate. Most likely non-deterministic field requiring ignore-list update. If real, block cutover until resolved.' },
          { q: 'How are in-flight transactions handled at cutover?', a: 'Code freeze before cutover, app drained, outbox drained. No active writes at cutover start.' },
        ],
      },
      {
        title: 'The schema-conversion chain',
        steps: [
          { q: 'CHAR(15) — what was the issue and fix?', a: 'MySQL ignores trailing spaces in CHAR comparison, Postgres does not. \'abc\' = \'abc \' is true in MySQL, false in Postgres. Fixed via migration V20251104210000__fix_char15_columns.sql converting CHAR(15) → VARCHAR(255).' },
          { q: 'How did you handle JSON columns?', a: 'PostgreSQLJsonType implementing Hibernate UserType with @TypeDef. Round-trip tested. No MySQL-specific JSON functions in HQL.' },
          { q: 'Case-insensitive matching?', a: 'CREATE COLLATION case_insensitive with ICU provider, locale und-u-ks-level2, deterministic = false. Applied via ALTER TABLE. Matches MySQL utf8_general_ci.' },
          { q: 'Transaction isolation?', a: '95 @Transactional methods audited. Explicit REPEATABLE_READ on idempotency checks, concurrent series updates, name uniqueness.' },
        ],
      },
    ],
  },
  'change-orders': {
    framing:
      'Financial feature with extensive PRD documentation. All decisions, rules, and edge cases below are from your PRD. The "failure modes designed for" section contains documented risks from your PRD that the design accounts for — NOT incidents you should claim happened unless you recall them.',
    decisions: [
      {
        q: 'Change Order as separate transaction vs estimate edit?',
        options: [
          'Edit estimate in place: breaks audit trail.',
          'Separate CO linked to estimate: preserves immutability, clean audit.',
        ],
        chosen: 'Separate CO linked to estimate.',
        why: 'Original estimate must remain immutable for audit + customer signoff. CO is "an additional line" that updates the overall estimate total only when accepted. Audit traceability is non-negotiable.',
        tradeoff: 'More complex rollup logic (estimate total = original + accepted COs). Worth it for audit + signoff guarantees.',
      },
      {
        q: 'Allow CO to edit any line attribute, or only qty on existing lines?',
        options: [
          'Full edit on existing lines: max flexibility, original estimate effectively rewritten.',
          'Qty-only on existing + full edit on new lines.',
        ],
        chosen: 'Qty-only on existing + full edit on new.',
        why: 'A CO is "an additional line" to the original estimate. Only editable field for existing P/S is qty. New P/S can be added with full attributes. If user needs to change other attributes on existing items, they must edit the original estimate or create a new one.',
        tradeoff: 'Documented constraint; some users may expect more flexibility. PRD explicit on this rule.',
      },
      {
        q: 'Status-based inclusion rules in totals?',
        options: [
          'Implicit: hidden in helpers.',
          'Explicit per-status: Pending shown but excluded from total, Accepted included, Rejected hidden.',
        ],
        chosen: 'Explicit per-status rules.',
        why: 'Pending CO shows on PCE with a Section header (no P/S lines) — visible but not counted. Accepted CO shows as a non-editable section with P/S details, included in updated estimate total. Rejected CO never shown.',
        tradeoff: 'More rules to document and test. Required for correct financial behavior.',
      },
      {
        q: 'Invoice from CO directly or only from PCE?',
        options: [
          'Allow from CO: two invoice paths.',
          'Only from PCE: single invoice path; PCE total reflects accepted COs.',
        ],
        chosen: 'Only from PCE. Create Invoice CTA disabled on CO form.',
        why: 'An invoice can only ever be created from an Estimate. The Estimate already includes accepted COs in its updated total. Single invoice path eliminates double-billing risk and ambiguity.',
        tradeoff: 'Users initially confused. PRD documents this explicitly; CTA disabled to prevent the action.',
      },
      {
        q: 'Sales tax recalculation on CO accept — preserve PCE override or recalculate?',
        options: [
          'Preserve PCE tax override.',
          'Recalculate on accept; remove PCE tax override.',
        ],
        chosen: 'Recalculate, remove override.',
        why: 'PRD rule: "Every time change order line items are added back to a project estimate, and that project estimate sales tax had an override, the override will be removed and the sales tax will calculate based on automatic sales tax calculation." Tax must reflect updated scope to comply with sales tax rules.',
        tradeoff: 'User tax override is lost. Documented behavior.',
      },
      {
        q: 'Discount on CO — support or defer?',
        options: [
          'Support in Phase 1: complex merge rules with PCE discount.',
          'Phase 1: no discount on CO. Phase 2: support.',
        ],
        chosen: 'No discount on CO in Phase 1.',
        why: 'When a CO without discount is added to a PCE with a % discount, the % continues to apply. Reduces Phase 1 complexity; Phase 2 adds support.',
        tradeoff: 'Limited Phase 1 functionality on discounts. Documented.',
      },
    ],
    algorithms: [
      {
        name: 'Status-based rollup with explicit inclusion rules',
        description:
          'CO total counted in PCE updated total only when status = Accepted. Pending: shown on PCE with Section header, no P/S items, no total impact. Rejected: never shown. On accept, CO lines added to PCE; on reject (from accepted), lines removed and PCE recalculates.',
        complexity: 'O(accepted COs × lines) per recomputation.',
        why: 'Independent calculation paths would drift. Single rollup logic feeding all surfaces (PCE display, reports, KPIs) prevents double-counting and inconsistency.',
      },
      {
        name: 'Discount % → $ merge rules on CO accept',
        description:
          'PCE % discount: stays as %, applies to new total including accepted CO lines. PCE $ discount: combine with CO discount if any. If CO subsequently rejected after merge, remove associated discount amount.',
        complexity: 'O(1) per merge.',
        why: 'Discount semantics differ between % and $ representations. Merge rules documented per combination.',
      },
      {
        name: 'Sales tax recalculation pipeline',
        description:
          'On CO accept: tax recalculated against linked PCE date and current rates. If PCE tax had an override, override removed. If tax rates changed between PCE creation and CO creation, PCE line items also recomputed at new rates during the merge. Tax exemption on linked customer is always respected.',
        complexity: 'O(line items) per recompute.',
        why: 'Tax compliance requires accurate calculation against current rates and updated scope. Override removal is the documented contract.',
      },
    ],
    numbers: [
      { metric: 'Manual estimate edit reduction', value: '80%', note: 'Per resume claim.' },
      { metric: 'Businesses impacted', value: '50K+', note: 'QBO Alpha rollout.' },
      { metric: 'Markets', value: 'US, Canada, AU, UK', note: 'Global readiness dependent on TXP availability; currently only works for US.' },
      { metric: 'Target segment', value: 'Mid-market', note: 'Focus on construction and professional services.' },
      { metric: 'Status values', value: '3 (Pending / Accepted / Rejected)', note: 'Plus inclusion rules per status.' },
      { metric: 'New reports', value: 'Change Order Report + columns in existing reports', note: 'CO by Project, CO by Status, CO by E vs A.' },
    ],
    warStories: [
      {
        scenario: 'Pending CO must show on PCE but not affect total',
        whatHappened:
          'Documented requirement: pending COs are visible to the user (so they know what is in flight) but cannot affect the PCE total (which only reflects accepted scope).',
        howResolved:
          'PCE renders pending COs with a Section header and no P/S line items. Updated estimate total excludes pending. Documented and tested per status.',
        lesson:
          'Visibility and totaling are independent concerns in financial UI. Make rules explicit per status.',
      },
      {
        scenario: 'Accepted CO subsequently rejected after partial invoicing',
        whatHappened:
          'Documented scenario: user accepts a CO, partially invoices it (since invoicing flows through PCE which now includes the accepted CO), then rejects the CO.',
        howResolved:
          'Per PRD: rejecting an accepted CO removes its lines from the PCE going forward. The invoice already issued remains historical and unchanged. PCE total recalculates without the rejected CO.',
        lesson:
          'Invoices are point-in-time financial documents. State changes on the source (estimate/CO) do not retroactively alter issued invoices.',
      },
      {
        scenario: 'PCE tax override invalidated by CO accept',
        whatHappened:
          'Documented behavior: if PCE has a tax override (custom rate due to specific contract), accepting a CO recalculates tax against current rates — removing the override.',
        howResolved:
          'PRD documents this as the contract: "the override will be removed and the sales tax will calculate based on automatic sales tax calculation." User-facing communication required to explain the rule.',
        lesson:
          'Tax rules must be deterministic and rule-driven. Overrides represent a moment-in-time decision that becomes stale when scope changes.',
      },
      {
        scenario: 'Discount % conversion on CO merge',
        whatHappened:
          'PRD: when CO with no discount is merged into PCE with % discount, the % continues to apply to the new total. When the combination involves a $ discount on either side, conversion rules apply: % → $ for combining; on rejection, remove the associated amount.',
        howResolved:
          'Merge rules documented per combination (%/%, %/$, $/%, $/$). On CO reject after merge, associated discount amount removed from PCE.',
        lesson:
          'Discount semantics differ between % and $ representations. Merge rules must cover every combination explicitly.',
      },
    ],
    edgeCases: [
      { case: 'Multiple pending COs on the same PCE', handling: 'All visible as grayed sections on PCE. None counted in updated total. User accepts/rejects each individually. No restriction on count.' },
      { case: 'No accepted, pending, or converted PCE exists', handling: 'CO cannot be created. User prompted to create a Project Estimate first.' },
      { case: 'Tax-exempt customer linked to project', handling: 'Tax exemption respected throughout. CO line items inherit taxable flag from PCE.' },
      { case: 'CO accepted then rejected after partial invoicing', handling: 'CO lines removed from PCE going forward. Issued invoice unchanged (historical). PCE total recalculates without the CO.' },
      { case: 'Tax rate changes between PCE and CO creation', handling: 'On CO accept merge, PCE line items recomputed at new tax rate. CO sales tax always calculated based on linked PCE date.' },
      { case: 'Shipping amount on CO', handling: 'Added back to PCE shipping field on accept. Removed if CO subsequently rejected.' },
      { case: 'Negative CO total in Phase 1', handling: 'Total of CO must be >= $0. Individual line items can be negative as long as total is non-negative. Phase 2: full negative support for refund-style COs.' },
    ],
    whatIWouldChange:
      'Retrospective opinion only. Examples to consider: building the rollup pipeline first then UI; deeper versioning for accepted CO state; surfacing tax override warning earlier in CO creation. Mark as your view, not source-documented.',
    chains: [
      {
        title: 'The CO lifecycle chain',
        steps: [
          { q: 'What happens when a CO is created?', a: 'Linked to a Pending, Accepted, or Converted PCE. Status starts as Pending. Shown on PCE as Section header without P/S lines. Not counted in updated estimate total.' },
          { q: 'On accept?', a: 'CO added to PCE as a non-editable section with P/S line item details. Total recalculates. Tax recalculates (removing any override). Discount and shipping merged per documented rules.' },
          { q: 'On reject from accepted?', a: 'CO lines removed from PCE going forward. PCE total recalculates. Associated discount, tax, shipping amounts removed.' },
          { q: 'What about issued invoices?', a: 'Invoices are point-in-time. They remain historical and unchanged regardless of subsequent CO state changes.' },
        ],
      },
      {
        title: 'The invoicing chain',
        steps: [
          { q: 'Can a user invoice directly from a CO?', a: 'No. Create Invoice CTA is disabled on CO form. Invoice can only be created from an Estimate.' },
          { q: 'Why?', a: 'PCE total already reflects accepted COs. Single invoice path eliminates double-billing risk.' },
          { q: 'What if the user has progress-invoiced and then accepts a CO?', a: 'The PCE total updates to include the CO. The next progress invoice shows the updated total minus what has been invoiced. The previously-issued invoice does not retroactively update.' },
          { q: 'Does the issued invoice get an updated total stamp?', a: 'No. Invoice is point-in-time. PRD: "the invoice I previously sent will have an incorrect estimate total on it as it won\'t include the newly accepted change order." That is the documented behavior.' },
        ],
      },
      {
        title: 'The tax & discount chain',
        steps: [
          { q: 'How is sales tax handled on accept?', a: 'Recalculated against linked PCE date and current rates. If PCE had a tax override, override is removed. If rates changed between PCE creation and CO, PCE line items also recomputed.' },
          { q: 'What about tax-exempt customers?', a: 'Exemption is always respected. CO line items inherit the taxable flag from PCE.' },
          { q: 'How are discounts merged?', a: 'Rules documented per combination. Most common in Phase 1: PCE has % discount, CO has none → % continues to apply to new total. On CO reject after merge, associated discount amount removed.' },
        ],
      },
    ],
  },
  'project-budgets': {
    framing:
      'Source-of-truth migration with documented constraint set (1444+ memorized reports, multiple cohorts, downgrade paths). All decisions and constraints below are from your PRD. Failure modes section reflects documented requirements, not historical incidents.',
    decisions: [
      {
        q: 'Decouple Project Budgets from Project Estimates entirely?',
        options: [
          'Keep PE as combined cost + income source: matches today, conflates audiences.',
          'Split: PB = cost source (internal accountant view), PE = income source (customer-facing quote).',
        ],
        chosen: 'Split.',
        why: 'Project managers need two views: internal accountant-facing (cost breakdown) and external customer-facing (estimates/quotes). PB is granular (cost-code level); PE is high-level. Up to 80% of users use spreadsheets for budgeting today; PB replaces that.',
        tradeoff: 'Two entities to maintain, migration complexity for existing users. Documented as necessary for the financial model.',
      },
      {
        q: 'One budget per project, or multiple?',
        options: [
          'Multiple budgets per project: max flexibility, ambiguous source of truth.',
          'One budget per project: clear source of truth.',
        ],
        chosen: 'One per project.',
        why: 'PRD: "Don\'t allow creation of multiple budgets against 1 project. Show an error message if the user attempts to do so." Single internal cost source. Multiple PEs allowed (negotiation iterations), but cost source must be singular.',
        tradeoff: 'Documented constraint; advanced users requesting versioning addressed via budget revisions, not multiple budgets.',
      },
      {
        q: 'PB and PE coexistence — independent or coupled?',
        options: [
          'Coupled: changes in one trigger the other.',
          'Independent: PE can exist without PB and vice versa. Updates are user-driven.',
        ],
        chosen: 'Independent (V1).',
        why: 'PRD: "PE can exist without PB and PB without PE. Their existence is not tied to the presence of each other. The decision to update PE / PB when the other is updated is taken by the user in V1."',
        tradeoff: 'User must manually keep them aligned. V2 considers automation.',
      },
      {
        q: 'DataGrid — build custom or extend FP&A component?',
        options: [
          'Build custom: full control, time cost.',
          'Reuse FP&A DataGrid: faster, already supports virtual scroll and cell editing.',
        ],
        chosen: 'Reuse + extend.',
        why: 'FP&A DataGrid already supports P&L and B/S budgets. Reusing aligns UX across budget types. Virtual scroll added to support 3500 lines with milestones (V2). Cell edit SLA target: <0.2s for 23 cols × 3500 lines.',
        tradeoff: 'Coordination with FP&A team for extension points. Worthwhile vs building from scratch.',
      },
      {
        q: 'AI-based spreadsheet import or manual mapping only?',
        options: [
          'Manual mapping: user maps every column.',
          'AI-based import with user confirmation per row.',
        ],
        chosen: 'AI import with user confirmation.',
        why: 'PRD documents AI-based spreadsheet import as a differentiator. Per-row confirmation keeps human-in-the-loop for financial accuracy.',
        tradeoff: 'AI matching can suggest wrong P/S items. User confirmation step required, not optional.',
      },
      {
        q: 'Migration paths — uniform or cohort-specific?',
        options: [
          'Uniform auto-migration for all.',
          'Cohort-specific: NTTFs, Desktop Migrators (Fresh + Importer), Advanced→IES Upgraders, Existing IES users.',
        ],
        chosen: 'Cohort-specific.',
        why: 'Documented cohorts have different starting states. NTTFs have no history. Desktop Migrators split into Fresh Start (no migration) and Importer (PCE cost migrated). Advanced→IES Upgraders sign contract covering migration. Existing IES users have history + memorized reports to consider.',
        tradeoff: 'Multiple migration paths to build and maintain. Necessary because cohorts have meaningfully different state.',
      },
    ],
    algorithms: [
      {
        name: 'DataGrid virtual scroll',
        description:
          'Replace paginated view with virtual scroll supporting up to 3500 lines for milestone-driven budgets in V2. Cell edit SLA target <0.2s for 23 columns × 3500 lines.',
        complexity: 'O(viewport) DOM render.',
        why: 'Milestone view requires all data of 1 milestone on the same page. Pagination breaks the experience. Virtual scroll keeps DOM bounded regardless of total row count.',
      },
      {
        name: 'Cohort-driven migration pipeline',
        description:
          'Two-step migration: (1) accept all pending PEs/COs, (2) migrate cost columns PCE → PB. Each cohort has documented entry criteria. On-demand migration for cohorts that need user opt-in.',
        complexity: 'O(PEs + COs + lines) per tenant.',
        why: 'Documented constraint: "Existing reports, memorized reports, custom reports must not break." Migration must be deterministic and reversible per cohort policy.',
      },
      {
        name: 'Dimension/Class/Location/Custom field migration per line item',
        description:
          'When user triggers migration, PCE line-item-level metadata (dimension, class, location, custom field values) migrates over to PB line by line. Header-level values apply uniformly to all PB lines.',
        complexity: 'O(line items × metadata fields).',
        why: 'PB must maintain feature parity with PE for filtering and reporting. Reports filter by dimension/class/location/custom field — PB must support all of them.',
      },
    ],
    numbers: [
      { metric: 'Adoption rate', value: '27%', note: '31% of active project users create PE × 86% of those include costs = 27% adoption of PB.' },
      { metric: 'Businesses impacted', value: '37K+', note: 'Active IES users with project workflows. 43% IES SAM, accounting for 11% of all IES users.' },
      { metric: 'DataGrid scale (V2)', value: '3500 rows × 23 cols', note: 'Performance target documented in V2 enhancements.' },
      { metric: 'Cell edit SLA', value: '<0.2s', note: 'Documented perf budget for DataGrid.' },
      { metric: 'Memorized reports impacted', value: '1444+', note: 'Across 8 affected reports.' },
      { metric: 'Spreadsheet baseline', value: '~80% of users', note: 'Use spreadsheets for project budgeting today. PB targets this workflow.' },
    ],
    warStories: [
      {
        scenario: 'Memorized + custom reports must not break',
        whatHappened:
          'Documented constraint: 1444+ memorized reports across 8 affected reports carry user expectations. Splitting cost source from PE to PB means cost columns on existing custom reports could go blank silently.',
        howResolved:
          'Per requirement: existing reports, memorized reports, and custom reports must not break. Cohort-driven migration with explicit handling for custom reports referencing PE-based cost columns.',
        lesson:
          'Long tail of memorized/custom reports must be planned for explicitly. Silent column-blank is not acceptable for financial reports.',
      },
      {
        scenario: 'Multiple PEs on one project, single PB constraint',
        whatHappened:
          'PRD allows multiple project estimates per project (negotiation iterations) but allows only one budget. Risk: ambiguity about which PE the budget aligns to.',
        howResolved:
          'PB is the singular internal cost source. PEs are customer-facing quotes; income aggregates across PEs. Cost flows from PB only. Documented as the financial model: 1 PB : N PEs.',
        lesson:
          'Source-of-truth correctness is non-negotiable for financial reporting. One PB per project keeps the model unambiguous.',
      },
      {
        scenario: 'AI-based spreadsheet import false matches',
        whatHappened:
          'Documented design risk: AI matching of imported spreadsheet rows to existing P/S catalog can suggest wrong items for similarly-named entries — different income accounts, different categorization.',
        howResolved:
          'AI import requires per-row user confirmation. "Create new" option always available. User cannot bypass confirmation. Financial accuracy prioritized over automation convenience.',
        lesson:
          'AI matching for financial data must be human-in-the-loop. Automation without confirmation = silent miscategorization = audit headaches.',
      },
      {
        scenario: 'Downgrade IES → Advanced preserving budget data',
        whatHappened:
          'Documented requirement: "Adv → IES migration and IES → Advanced reverse-migration experiences will be seamless as project budgets exist in both products."',
        howResolved:
          'Project budgets exist in both products. Migration path documented per cohort including reverse-migration for downgrades.',
        lesson:
          'Subscription downgrade paths must preserve user data, not delete it. Cross-product feature parity is the enabling design.',
      },
    ],
    edgeCases: [
      { case: 'Project with no PE but has PB', handling: 'Allowed by design. Reports show estimated cost from PB; income blank. PE can be added later.' },
      { case: 'PB deleted while reports exist', handling: 'Reports show blank Estimated Cost. PE/EI unchanged. Soft-delete with warning.' },
      { case: 'Multiple PEs on same project, one PB', handling: 'PB unchanged. Reports aggregate income across PEs; cost from single PB. Documented as 1 PB : N PEs.' },
      { case: 'Construction cost codes with hierarchy', handling: 'P/S hierarchy preserved in budget structure (e.g., 101 Painting → 101.1 Painting floor, 101.2 Painting ceiling). One level of grouping in MVP. Custom groupings (visual sections) supported.' },
      { case: 'Budget period changed', handling: 'Period editable post-creation. Does not modify project start/end dates (common because projects often run over schedule).' },
      { case: 'Dimension / Class / Location / Custom field migration', handling: 'Line-item-level values migrate line by line. Header-level values apply uniformly to all PB lines. All filterable in Estimate vs Actual and other reports.' },
      { case: 'Budget templates', handling: 'MVP: "duplicate" or "copy" only. Users copy existing budget and edit. Note: duplicate exists for P&L/B/S in Advanced; enabled only in IES for project budgets in MVP.' },
      { case: 'Budget comments', handling: 'Row-level comments supported (extension of existing P&L/B/S comment feature). Cell-level deferred. Manual tracking via comments until full versioning ships.' },
    ],
    whatIWouldChange:
      'Retrospective opinion only. Possibilities: build full budget versioning system earlier instead of relying on comments; build dual-mode reporting observability from day one; deeper AI confidence-banding for import. Verify before claiming as fact.',
    chains: [
      {
        title: 'The source-of-truth chain',
        steps: [
          { q: 'Why decouple PB from PE?', a: 'Two audiences: internal accountant (granular cost-code level) vs customer (high-level quote). PE conflated them. PB is the singular internal cost source; PE remains the income/quote document.' },
          { q: 'Why one PB per project but multiple PEs?', a: 'Cost source must be singular for unambiguous reporting. Income iterates through negotiation — multiple PEs reflect that. 1 PB : N PEs.' },
          { q: 'How do reports know to use PB or PE for cost?', a: 'PB is the source of truth for Estimated cost in all reports. PE no longer carries cost columns (your rate / your total removed in PE).' },
        ],
      },
      {
        title: 'The migration cohorts chain',
        steps: [
          { q: 'How many migration paths?', a: 'NTTFs, Desktop Migrators (Fresh Start + Importer), Advanced→IES Upgraders, Existing IES users.' },
          { q: 'Why cohort-specific?', a: 'Each cohort has different starting state. NTTFs no history. Importers bring PCE cost data. Upgraders signed contract covering migration. Existing IES have memorized reports + workflow expectations.' },
          { q: 'How are memorized reports protected?', a: 'Documented constraint: existing reports, memorized reports, custom reports must not break. 1444+ memorized reports across 8 affected reports are explicitly considered in migration planning.' },
          { q: 'Downgrade path?', a: 'IES → Advanced reverse-migration seamless because project budgets exist in both products.' },
        ],
      },
      {
        title: 'The DataGrid perf chain',
        steps: [
          { q: 'How does the budget UI handle 3500 lines?', a: 'V2 introduces virtual scroll replacing the paginated view to support milestones with all data on one page. Cell edit SLA target <0.2s for 23 columns × 3500 lines.' },
          { q: 'Why pagination didn\'t work?', a: 'Milestones require all data of one milestone on the same page. Pagination broke the user experience for that flow.' },
          { q: 'What FP&A component is reused?', a: 'The DataGrid used for P&L and B/S budgets. Reuse aligns UX across budget types.' },
        ],
      },
    ],
  },
  'cms-migration': {
    framing:
      'Distributed-systems project with documented FMEAs. Failure modes below are taken from your FMEA doc — they are scenarios designed for, not necessarily incidents that occurred. Frame as "scenarios our design accounts for" in interviews, not "things that happened."',
    decisions: [
      {
        q: 'API-based vs event-based for project ↔ CMS sub-customer sync?',
        options: [
          'API-based (sync): low effort, stronger consistency for user actions, medium FMEAs.',
          'Event-based: medium effort, fewer FMEAs, but eventual consistency for txn updates.',
        ],
        chosen: 'API-based (Approach #1).',
        why: 'Based on discussion with CMS team. User-facing create/update needs strong consistency. Approach #1 had lower effort, comparable closeness to target state, and acceptable FMEA profile.',
        tradeoff: 'Timeout-causes-inconsistency FMEAs require explicit handling. Reconciled via idempotency + retry/compensation paths.',
      },
      {
        q: 'On API timeout — retry blindly or reconcile?',
        options: [
          'Treat timeout as failure: rolls back project, loses successful CMS work.',
          'Treat timeout as "unknown": reconcile via follow-up reads + compensating actions.',
        ],
        chosen: 'Reconcile.',
        why: 'Your design: "We stopped treating timeout as failure. We treated it as \'unknown\', then reconciled via idempotency + follow-up reads + compensating actions." Every request carries correlation ID / transaction ID.',
        tradeoff: 'More code surface (reconciliation paths, correlation tracking). Necessary to preserve user intent across transient infra issues.',
      },
      {
        q: 'Legacy v4 fallback events — keep or remove?',
        options: [
          'Keep as fallback: defense in depth, dual paths.',
          'Remove: single authoritative sync path via CMS API.',
        ],
        chosen: 'Remove v4 fallback.',
        why: 'Per your prep guide: "you improved consistency by removing the legacy fallback event path and making a single authoritative sync path, plus observability + compensations to drive failure rate down." Two sync paths cause drift.',
        tradeoff: 'Lose dual-path redundancy. Replaced with idempotency + reconciliation for safety.',
      },
    ],
    algorithms: [
      {
        name: 'Correlation-id-based reconciliation',
        description:
          'Every CMS API request carries a correlation ID / transaction ID. On timeout: treat outcome as unknown. Follow-up read against CMS using the correlation ID determines actual state. If sub-customer exists → finalize project. If not → idempotent retry.',
        complexity: 'O(1) per reconciliation.',
        why: 'Distributed systems cannot distinguish "request lost" from "response lost." Correlation ID enables outcome determination after timeout.',
      },
      {
        name: 'Observability instrumentation (DWSM + consumer lag)',
        description:
          'End-to-end tracing enabled via DWSM. Consumer lag monitors for downstream consumers (QBTime, STS/ETS/FTS) so eventual-consistency delays surface as alerts, not silent staleness.',
        complexity: 'Standard instrumentation.',
        why: 'Without consumer lag monitoring, users hit stale projection views and the system surface looks broken. Lag monitors expose the eventual consistency window for operators to manage.',
      },
    ],
    numbers: [
      { metric: 'Sync failure reduction', value: '~95%', note: 'Achieved by removing legacy fallback event path + single authoritative sync path + observability + compensations.' },
      { metric: 'Removed legacy paths', value: 'Monolith APIs + v4 fallback event', note: 'Both replaced by single CMS API with idempotency.' },
      { metric: 'Affected downstreams', value: 'QBTime, STS, ETS, FTS, BKTS', note: 'Per-consumer lag monitors documented in FMEAs.' },
    ],
    warStories: [
      {
        scenario: 'FMEA: API to create sub-customer times out',
        whatHappened:
          'Documented failure scenario: API times out after sub-customer creation. User sees FCI that project creation failed. However sub-customer is created and appears in quickfills/sales forms. User could create txns with that project, but Project details would error. Project would not appear on Project List Page.',
        howResolved:
          'DWSM enabled for end-to-end flow tracing. Correlation ID enables post-timeout reconciliation. Idempotent CMS API ensures retries do not duplicate sub-customers.',
        lesson:
          'In distributed systems, "no response" is not "no action taken." Always reconcile before destructive cleanup.',
      },
      {
        scenario: 'FMEA: Update project to change sub-customer times out',
        whatHappened:
          'User updates project to change parent customer. CMS update API times out. User sees update-failed message. But sub-customer is updated with new parent customer. Reports for that customer get corrupted because sub-customer has moved.',
        howResolved:
          'DWSM tracing surfaces the discrepancy. Per your prep guide, this is documented as "the nastiest FMEA in your doc (reports corruption)." Compensation flow surfaces mismatch via alerts; manual reconciliation tooling addresses corrupted reports.',
        lesson:
          'Cross-service updates with structural impact (parent moves) need explicit FMEA. Retry logic alone is insufficient for hierarchy changes.',
      },
      {
        scenario: 'FMEA: User converts sub-customer to project, immediately opens project details',
        whatHappened:
          'Documented scenario: user converts sub-customer to project and quickly opens project details. Delay in Project create event consumption in QBTime → no time activities visible. Same for STS/ETS/FTS → no transactions visible.',
        howResolved:
          'Monitor consumer lag in QBTime, STS, ETS, BKTS with proper alerting. UX guidance: refresh page. DWSM trace end-to-end flow.',
        lesson:
          'Eventual consistency for downstream projections is acceptable, but the window must be observable and the user must be guided.',
      },
      {
        scenario: 'FMEA: Project activation/inactivation times out',
        whatHappened:
          'Documented: API to activate/inactivate sub-customer times out. User sees failure message. But sub-customer gets activated/inactivated. Quickfills + transactions show incorrect data.',
        howResolved:
          'DWSM tracing. Reconciliation via correlation ID determines actual state. Idempotency ensures retry safety.',
        lesson:
          'Boolean state toggles have the same timeout problem as creates/updates. Reconciliation must cover all state-mutation surfaces, not just creates.',
      },
    ],
    edgeCases: [
      { case: 'Idempotent retry from different application server', handling: 'Idempotency key is the projectId, not the calling server. Any server retrying produces the same call. CMS dedupes.' },
      { case: 'CMS API extended outage', handling: 'Project create/update fails fast with explicit error. Reconciliation queue drains once CMS recovers.' },
      { case: 'Reports corruption from parent-customer move timeout', handling: 'DWSM trace + compensation alert. Manual reconciliation tooling for affected reports. Documented as a high-severity FMEA.' },
      { case: 'Downstream consumer lag visible to user', handling: 'UX guidance: refresh page. Consumer lag monitors with alerting for operators.' },
    ],
    whatIWouldChange:
      'Retrospective opinion only. Possibilities: build the FMEA before the implementation, not alongside; reconciliation queue dashboard from day one. Mark as your view.',
    chains: [
      {
        title: 'The timeout-handling chain',
        steps: [
          { q: 'CMS API times out. What does your code do?', a: 'Treat as unknown. Follow-up read via correlation ID determines actual state. If sub-customer exists → finalize project. If not → idempotent retry.' },
          { q: 'How do you prevent duplicate sub-customers on retry?', a: 'CMS API is idempotent on projectId. Same key → same sub-customer.' },
          { q: 'What if reconciliation also times out?', a: 'Persistent reconciliation queue. Backoff + retry. Alert if queue depth grows.' },
          { q: 'What proves the 95% sync-failure reduction?', a: 'Pre-state: drift detector counted daily mismatches across legacy paths. Post-state: cross-service consistency monitor shows real-time mismatch count. 95% reduction is the comparison.' },
        ],
      },
      {
        title: 'The eventual-consistency tradeoff chain',
        steps: [
          { q: 'Why is the user-facing CMS sync strongly consistent but downstreams eventually consistent?', a: 'User-facing action requires immediate visibility of outcome. Downstream projections (time tracking, transaction references) are eventual by design — making them sync would not scale.' },
          { q: 'How long is the inconsistency window?', a: 'Bounded by consumer lag. Monitored per consumer. Alerts fire above threshold.' },
          { q: 'What does the user see?', a: 'For just-converted project, no time activities or transactions until consumer catches up. UX guidance: refresh.' },
          { q: 'What about reports referencing the moved customer?', a: 'Reports corruption is the nastiest documented FMEA. DWSM trace + compensation flow + manual reconciliation tooling.' },
        ],
      },
    ],
  },
  'au-launch': {
    framing:
      'Cross-team execution at market scale. Probed on coordination, risk surfacing, and leadership without authority. Be specific about what you owned vs participated in. Stripped of fabricated bug stories from earlier draft.',
    decisions: [
      {
        q: 'Why launch with no marketing?',
        options: [
          'Full marketing launch: max influx, max risk if anything breaks.',
          'Soft launch: smaller cohort, lower support pressure, time to validate.',
        ],
        chosen: 'Soft launch.',
        why: 'New market with established competitors (Xero, MYOB). First impression matters. Soft launch lets product stability validate under real AU traffic before scaling marketing. Marketing follows confidence.',
        tradeoff: 'Slower initial adoption. Acceptable: a botched launch in a competitive market is worse than slower ramp.',
      },
      {
        q: 'Feature scope for GA — full Advanced parity or pragmatic subset?',
        options: [
          'All Advanced features at GA: maximum parity.',
          'Core + safe upgrade/downgrade + analytics correctness.',
        ],
        chosen: 'Core + upgrade safety + analytics.',
        why: 'Upgrade/downgrade safety non-negotiable for mid-market customers. Analytics correctness critical for the target segment. Other features follow post-GA.',
        tradeoff: 'Some feature gaps at GA. Documented in known-issues. Roadmap visible to early adopters.',
      },
    ],
    algorithms: [
      {
        name: 'Cross-team readiness gating',
        description:
          'Each of 10+ dependent teams owns a feature gate. Pre-Oct-27 cutoff: all gates green or features descoped. Daily readiness sync. Issue triage with severity tiers. No GA until P0/P1 gates green.',
        complexity: 'O(features × teams) coordination surface.',
        why: 'Mis-sequenced enablement risks silent data corruption or upgrade lock. Explicit per-team gating prevents "it works on my machine" surprises.',
      },
    ],
    numbers: [
      { metric: 'Dependent teams', value: '10+', note: 'Analytics, workflows, upgrade/downgrade, accountant flows, currency, locale, prod offers, experts.' },
      { metric: 'AU subscriber base', value: '~250K', note: 'Pre-launch QBO subscriber count. Strong upgrade opportunity to Advanced.' },
      { metric: 'Launch date', value: 'December 4', note: 'GA with no active marketing.' },
      { metric: 'Pre-prod cutoff', value: 'October 27', note: 'All feature gates green or descoped by this date.' },
      { metric: 'Target segment', value: 'Mid-market', note: 'Construction and professional services emphasis.' },
    ],
    edgeCases: [
      { case: 'AU-only feature dependency timing', handling: 'Sequenced after global-feature enablement. If global delayed, AU launch path adjusted (descope or wait). Explicit dependency graph.' },
      { case: 'Mid-market customer with existing third-party tools', handling: 'Migration path documented. Not gating for GA — migration support is post-GA work.' },
      { case: 'Upgrade matrix coverage', handling: 'Every cohort path (Simple Start, Essentials, Plus → Advanced AU) tested. Soft-blocker conditions in legacy AU configs validated.' },
    ],
    whatIWouldChange:
      'Retrospective opinion only. Possibility: build AU test data set in parallel with feature work, not after. Verify before claiming.',
    chains: [
      {
        title: 'The cross-team execution chain',
        steps: [
          { q: 'How did you sequence 10+ teams?', a: 'Per-feature dependency graph + per-team readiness gate. Daily sync. P0/P1 triaged within 24h.' },
          { q: 'What was the riskiest path?', a: 'Upgrade/downgrade. Soft blockers in legacy AU configs could lock customers in or corrupt data. Gated hardest.' },
          { q: 'What would have caused rollback?', a: 'Analytics drift on key metric, upgrade-path corruption, or critical region-specific bug. Validated pre-GA precisely to avoid.' },
          { q: 'What did you personally drive?', a: 'Sequencing + readiness gates for Projects/IES slice. Personal validation of upgrade/downgrade and analytics correctness for our area. Escalation owner for cross-team blockers.' },
        ],
      },
    ],
  },
  'template-sharing': {
    framing:
      'Frontend-led with platform-thinking implications. Your source describes the WAS → UCS publish ordering, PII masking with dot-dash, and share scopes. Failure modes below are scenarios the design accounts for, not historical incidents.',
    decisions: [
      {
        q: 'Workflow-specific feature or plugin-agnostic platform?',
        options: [
          'Workflow-only: faster ship, rebuild per plugin.',
          'Plugin-agnostic: shared publish/discovery flow across plugins.',
        ],
        chosen: 'Plugin-agnostic platform.',
        why: 'Templates are a category, not a single-plugin feature. Same publishing/discovery flow can serve future plugins. Build once for many.',
        tradeoff: 'Higher upfront design cost. Pays back as additional plugins adopt the framework.',
      },
      {
        q: 'PII masking — where to enforce?',
        options: [
          'Client-side only.',
          'Server-side only.',
          'Both.',
        ],
        chosen: 'Client-side masking with dot-dash representation.',
        why: 'Templates published to community/companies/clients must not leak tenant data. Dot-dash visualization gives the publisher immediate feedback that values are scrubbed.',
        tradeoff: 'Client-side enforcement alone has gaps without server backstop. Note: I do not have detail from your source on server-side validation specifics — verify before claiming.',
      },
      {
        q: 'Publish flow — order of WAS and UCS calls?',
        options: [
          'UCS first then WAS: backwards causality.',
          'WAS first (persist workflow definition) then UCS (publish template metadata).',
        ],
        chosen: 'WAS → UCS.',
        why: 'UCS template metadata references the persisted workflow. UCS-first would create unreferenceable template entries. Sequential dependency drives ordering.',
        tradeoff: 'WAS-success-then-UCS-failure leaves an orphan workflow that needs explicit handling.',
      },
    ],
    algorithms: [
      {
        name: 'Multi-step publish orchestration',
        description:
          'Sequence: (1) enter publish mode → mask PII (dot-dash), hide workflow-specific UI; (2) collect template metadata; (3) call WAS to persist workflow definition; (4) on WAS success → call UCS to publish template metadata; (5) on UCS success → navigate to discovery view + reset UI.',
        complexity: 'O(1) sequential steps.',
        why: 'UCS references WAS workflow entity. Reverse ordering creates orphan template entries. Strict order preserves referential integrity.',
      },
    ],
    numbers: [
      { metric: 'Users publishing templates', value: '1K+', note: 'Across tenants using the feature.' },
      { metric: 'Setup time reduction', value: '~60%', note: 'For tenants using shared templates vs creating from scratch.' },
      { metric: 'Share scopes', value: '3', note: 'community / my companies / my clients.' },
    ],
    warStories: [
      {
        scenario: 'WAS success + UCS failure leaving orphan workflow',
        whatHappened:
          'Documented risk in the publish flow: WAS persists workflow definition successfully, UCS template-publish fails (transient infra issue). Result: workflow exists in WAS without a discoverable template in UCS.',
        howResolved:
          'Retry surfaced to user. On retry, UCS call repeats with the same WAS reference (idempotent on workflow key — no duplicate created). For sustained failures, an orphan-cleanup sweep can address WAS entries without UCS references.',
        lesson:
          'Multi-service publish flows need explicit retry semantics and orphan cleanup. Silent retries on the client cause confusion.',
      },
      {
        scenario: 'PII visibility for the publisher',
        whatHappened:
          'Templates are tenant-published but consumed across tenants. Without masking, tenant-specific values (customer names, emails, account references) would appear in shared templates.',
        howResolved:
          'On entering publish mode, sensitive values are masked client-side using dot-dash representation so the publisher sees what consumers will see.',
        lesson:
          'For cross-tenant sharing, masking is a publisher-facing trust signal, not just a data-protection mechanism.',
      },
    ],
    edgeCases: [
      { case: 'User closes browser mid-publish', handling: 'WAS may have succeeded, UCS may not. Orphan cleanup eventually sweeps WAS workflows without UCS references. User can re-publish (idempotent on workflow key).' },
      { case: 'Share scope selection', handling: 'Three scopes captured at publish time: community / my companies / my clients. UCS enforces visibility on discovery accordingly.' },
      { case: 'Multi-plugin extensibility', handling: 'Future plugins (reports, spreadsheets) extend via a Template Handler contract with core fields + plugin-specific extension map.' },
    ],
    whatIWouldChange:
      'Retrospective opinion only — verify before claiming. Possibilities: server-side orchestration with transactional semantics (vs client-orchestrated); explicit template versioning earlier; standalone PII scrub service reusable across surfaces.',
    chains: [
      {
        title: 'The platform-extensibility chain',
        steps: [
          { q: 'How does this extend to a new plugin?', a: 'Template Handler is plugin-agnostic. New plugin implements the metadata contract. Discovery + publishing UX reused.' },
          { q: 'What if a new plugin needs different metadata?', a: 'Core fields + plugin-specific extension map. New plugin adds its fields without changing core.' },
          { q: 'How do you prevent the platform from drifting workflow-specific?', a: 'Code review discipline. Workflow-specific logic stays in the workflow plugin. Platform has its own test surface.' },
        ],
      },
      {
        title: 'The publish-flow consistency chain',
        steps: [
          { q: 'Why does WAS publish before UCS?', a: 'UCS template metadata references the persisted workflow. UCS-first would create orphan template entries.' },
          { q: 'What if UCS fails after WAS succeeds?', a: 'Retry CTA surfaced to user. UCS call repeats with same WAS reference. Idempotent on workflow key — no duplicates.' },
          { q: 'What about repeated UCS failures?', a: 'Orphan cleanup sweep can address WAS entries without UCS references after a threshold.' },
        ],
      },
    ],
  },
  'consolidated-email': {
    framing:
      'Frontend-focused. Your source confirms toggle preference, class-based React without hooks, mock APIs for testing, and legal/branding requirements. War stories below are scenarios the design accounts for, not specific incidents to claim.',
    decisions: [
      {
        q: 'Force consolidated emails or give users a choice?',
        options: [
          'Force consolidated: simpler, ignores low-volume users.',
          'Give users a choice via toggle.',
        ],
        chosen: 'Give users a choice.',
        why: 'Initial forced experience did not respect user preference and had legal/branding gaps. Toggle preserves user agency. Low-volume users prefer per-transaction; high-volume users want consolidation.',
        tradeoff: 'Two code paths to support. Mitigated by refactoring shared components rather than duplicating logic.',
      },
      {
        q: 'Default mode — preserve old behavior or default to new?',
        options: [
          'Default to consolidated (new).',
          'Default to per-transaction (preserve existing behavior).',
        ],
        chosen: 'Preserve existing behavior; consolidation is opt-in.',
        why: 'Existing workflows must continue to function without surprise. Backward compatibility is the non-negotiable design constraint.',
        tradeoff: 'Slower adoption pace. Acceptable for trust-sensitive notifications.',
      },
      {
        q: 'Refactor shared components or duplicate logic per mode?',
        options: [
          'Duplicate: faster, future code rot.',
          'Refactor shared components.',
        ],
        chosen: 'Refactor.',
        why: 'Per your source: "We avoided branching logic explosion by refactoring shared components to support both modes cleanly." Class-based React without hooks made refactoring careful but not impossible.',
        tradeoff: 'Refactor work carries regression risk in legacy codebase. Mitigated by mock APIs + unit/integration test coverage.',
      },
      {
        q: 'Frontend testing without backend readiness?',
        options: [
          'Wait for backend.',
          'Build with mocked services to decouple delivery.',
        ],
        chosen: 'Mock APIs.',
        why: 'Per your source: "I used mocked services to decouple frontend delivery from backend readiness, which kept the release on schedule."',
        tradeoff: 'Mock divergence risk if not maintained. Mitigated by treating contract as the source of truth and updating both.',
      },
    ],
    algorithms: [
      {
        name: 'Mode-aware shared component pattern',
        description:
          'Email composition components accept mode prop ("per-transaction" | "consolidated"). Branching inside the component handles content template, recipient list, CTA differences. CC/BCC, freeform body, and attachments handled in shared code paths.',
        complexity: 'O(1) mode branching per render.',
        why: 'Two delivery modes share most UX. Mode-aware prop pattern keeps shared parts shared and specialized parts isolated. Extending to a third mode = add enum value + add branch.',
      },
    ],
    numbers: [
      { metric: 'Email volume reduction', value: '65%', note: 'Per resume claim; aggregated reduction for high-volume reminder workflows.' },
      { metric: 'CSAT increase', value: '~40%', note: 'Post-launch survey.' },
      { metric: 'Backward compatibility', value: 'Preserved', note: 'Existing reminder workflows unchanged by default.' },
      { metric: 'Codebase characteristic', value: 'Class-based React (no hooks)', note: 'Lifecycle methods + refactoring without destabilizing shared components.' },
    ],
    warStories: [
      {
        scenario: 'Refactor risk in class-based React without hooks',
        whatHappened:
          'Documented design challenge: introducing extensibility in a class-based React codebase without destabilizing shared components. Sibling features (CC/BCC, freeform body) live in the same shared surface.',
        howResolved:
          'Per your source: "We avoided branching logic explosion by refactoring shared components to support both modes cleanly." Mock APIs for testing kept delivery independent of backend readiness. Unit and integration coverage documented.',
        lesson:
          'Legacy frontend codebases have unwritten contracts between sibling features. Test those contracts before changing the implementation underneath them.',
      },
      {
        scenario: 'Legal and branding requirements',
        whatHappened:
          'Per your source: "Email content changes were legally sensitive, so correctness mattered more than speed." Consolidated email content needed to meet updated legal and branding requirements.',
        howResolved:
          'Coordinated with design and legal during content rework. Compliance treated as gate, not afterthought.',
        lesson:
          'Customer-facing communications are legal artifacts. Compliance review is part of the merge gate, not a post-merge check.',
      },
    ],
    edgeCases: [
      { case: 'User toggles mode mid-workflow', handling: 'Preference applies to future workflow execution, not in-flight email generation.' },
      { case: 'CC/BCC across modes', handling: 'CC/BCC composition shared, preserved across both modes.' },
      { case: 'Freeform email body', handling: 'Preserved across both modes; not mode-specific.' },
      { case: 'Backward compatibility for existing reminder workflows', handling: 'Default per-transaction behavior preserved. No silent migration.' },
    ],
    whatIWouldChange:
      'Retrospective opinion only. Possibilities: mode as a string enum from day one to enable future modes (e.g., weekly digest); template versioning so legal updates are diffable. Verify before claiming.',
    chains: [
      {
        title: 'The backward-compatibility chain',
        steps: [
          { q: 'How did you ensure the toggle did not break existing workflows?', a: 'Default preserved old behavior. Toggle is opt-in. Shared components are mode-aware via props, not via duplicate code paths.' },
          { q: 'What if a user has hand-customized their template?', a: 'Templates persist per workflow. Mode toggle does not overwrite customization; customizations apply within the resolved mode.' },
          { q: 'How would a third mode be added?', a: 'Extend the enum. Add one branch in the shared components. Existing modes unaffected.' },
        ],
      },
      {
        title: 'The frontend-delivery chain',
        steps: [
          { q: 'How did you ship without waiting for backend?', a: 'Mocked services let the frontend develop and test against contracts. Backend readiness was decoupled from frontend release schedule.' },
          { q: 'How did you handle legal review?', a: 'Treated content changes as a legal gate. Legal sign-off required before merging template changes.' },
          { q: 'How did you preserve CC/BCC and freeform body?', a: 'These are shared across both modes via the refactored shared components, not duplicated per mode.' },
        ],
      },
    ],
  },
  'implicit-ads': {
    framing:
      'Academic/research project. Useful for analytical depth, not core strength. Keep answers honest and tight. I do not have detailed source material on specific algorithms used — claims below are conservative; verify specifics before claiming.',
    decisions: [
      {
        q: 'Whole-video vs segment-level classification?',
        options: [
          'Whole-video binary: useless for actual product use.',
          'Segment-level: enables boundary detection within otherwise-normal content.',
        ],
        chosen: 'Segment-level.',
        why: 'Implicit ads are embedded inside otherwise-normal content. A 10-min video with a 30-sec embedded ad looks like non-ad at whole-video granularity. Segment level enables localization.',
        tradeoff: 'Requires reliable segmentation logic. Failure on continuous-audio content.',
      },
      {
        q: 'Single-modality or multi-modal classification?',
        options: [
          'Vision-only or audio-only: each fails when ads mimic the other modality.',
          'Multi-modal fusion across audio + visual + contextual signals.',
        ],
        chosen: 'Multi-modal.',
        why: 'Implicit ads are defined by intent, not any single modality. Visual signals (logos, products), audio signals (brand mentions, CTA urgency), and contextual signals (promotional phrasing) all weakly indicate intent. Combined signal is stronger than any one.',
        tradeoff: 'Higher inference cost. Acceptable for the offline batch use case.',
      },
      {
        q: 'Optimize for precision or recall on the ad class?',
        options: [
          'Precision: fewer false positives, more false negatives.',
          'Recall: fewer false negatives, more false positives.',
        ],
        chosen: 'Recall.',
        why: 'Per your prep guide: "Missing an ad segment is worse than occasionally flagging non-ad content in moderation use cases." Moderation reviews can filter out false positives; missed ads cannot be recovered.',
        tradeoff: 'More flagged content to review. Operationally acceptable.',
      },
    ],
    algorithms: [
      {
        name: 'Multi-modal feature combination',
        description:
          'Audio, visual, and contextual signals extracted per segment and combined for final classification. Specifics of architecture and feature engineering withheld here — verify from your own notes before claiming exact components.',
        complexity: 'Depends on per-modality model choice.',
        why: 'No single modality is reliable for implicit-ad detection. Combining weak signals across modalities improves discrimination.',
      },
    ],
    numbers: [
      { metric: 'Accuracy', value: '~85%', note: 'On the labeled test set per resume.' },
      { metric: 'Recall priority', value: 'High over precision', note: 'Moderation use case: false negatives more costly than false positives.' },
      { metric: 'Classification granularity', value: 'Segment-level', note: 'Not whole-video; enables localization.' },
    ],
    edgeCases: [
      { case: 'Continuous-audio content (music videos, podcasts)', handling: 'Sentence-boundary segmentation degrades. Fallback to fixed-time-window with reduced confidence.' },
      { case: 'Multi-language content', handling: 'V1 scope was a single language. Multi-language would require localized brand dictionaries and language-specific CTA patterns.' },
      { case: 'Genuine product reviews flagged as ads', handling: 'Documented failure class. Mitigated by weighting promotional-intent signals (CTA phrasing, urgency) over brand-presence alone. Intent is the signal, not brand mention.' },
    ],
    whatIWouldChange:
      'Retrospective opinion only. Possibilities: confidence-banded output (high/medium/low) for moderation triage; human-in-the-loop review for medium-confidence segments. Verify before claiming.',
    chains: [
      {
        title: 'The problem-formulation chain',
        steps: [
          { q: 'Why segment-level instead of whole-video?', a: 'Implicit ads are embedded within otherwise-normal content. Whole-video loses locality and conflates ad and non-ad signals.' },
          { q: 'Why multi-modal?', a: 'Intent is the signal, not brand presence. No single modality reliably captures intent. Multi-modal combines weak signals.' },
          { q: 'Why optimize for recall?', a: 'In moderation, a missed ad cannot be recovered. False positives can be filtered by review. Recall priority follows from the use case.' },
          { q: 'What is the hardest part of this problem?', a: 'Implicit ads do not look like ads. There is no clean visual boundary or audio spike. The only reliable signal is intent — which forces semantic segmentation and weak-signal fusion.' },
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
