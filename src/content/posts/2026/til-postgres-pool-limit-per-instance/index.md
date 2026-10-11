---
title: "Postgres needed more than a bigger pool"
description: "A growth chart made me look at the pool, the memory Postgres was really using, and the temporary files it kept writing."
pubDate: 2026-10-27
category: til
draft: false
liveFrom: 2026-10-27
tags: [postgresql, connection-pooling, kubernetes, reliability]
---

We were preparing for growth when a chart showed more users than we expected. Maybe it isn't much in a global perspective, but it was new for us, so I wanted to understand what it meant for the database.

![Illustrative, anonymized chart comparing planned and observed user growth. The relative index and timeline are synthetic, not production data.](./user-growth-index.svg)

*Illustrative curve only, the dates, counts and index are not real.*

The client service ran on several replicas, each with its own pool. I looked at one setting and thought it was fine. Then I added them together and compared the total with Postgres's `max_connections`, leaving room for backups and other clients. When a pool is full, a request waits and can time out. When Postgres is full, it refuses the connection.

But the pool wasn't the whole story. `shared_buffers` is the memory Postgres uses for its cache. `effective_cache_size` sounds like it reserves memory, but only tells the planner what might be available in Postgres and the operating system. `work_mem` is for each sort or hash, not the whole server, so several operations can use it at once. Too little meant temporary files on our slow storage, and too much could use more memory than the container had.

So we capped each replica's pool so the total stayed under `max_connections`, doubled the container's memory to 2Gi, and sized `shared_buffers`, `effective_cache_size` and `work_mem` to fit it. Then the last two days against the same two days a week earlier:

| Metric | Before | After |
| --- | --- | --- |
| Buffer hit rate | 64.5% | 81.4% |
| Disk reads | 30.5 blocks/s | 18.2 blocks/s (−40%) |
| Temporary files | 731 MB | 0 |
| Transactions | 1.85/s | 1.55/s (−16%) |

| Connection pool | Before | After |
| --- | --- | --- |
| Primary connections, peak | 97 | 15 |
| Longest wait for a connection | 4.8–11 s | 0.8–1.2 s |

Memory peaked at 1.30 GB of the 2Gi limit, mostly file cache. The pool cap itself hasn't met a real traffic peak yet.

I was also worried that a bigger cache meant a rush of writes. `checkpoint_completion_target` spreads them over time. Traffic was also lower that week, so I compared reads per transaction instead of raw totals... and those were about 29% lower.

There wasn't one setting to fix it. We had to look at connections, memory and storage together... we'll see how it holds up as more people use it.

## Links

- [PostgreSQL connection settings](https://www.postgresql.org/docs/current/runtime-config-connection.html), including `max_connections`
- [PostgreSQL resource consumption](https://www.postgresql.org/docs/current/runtime-config-resource.html), including `shared_buffers` and `work_mem`
- [PostgreSQL query planning](https://www.postgresql.org/docs/current/runtime-config-query.html), including `effective_cache_size`
- [PostgreSQL WAL configuration](https://www.postgresql.org/docs/current/wal-configuration.html), including checkpoint pacing
