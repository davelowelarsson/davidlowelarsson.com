---
title: "DORA metrics are a flashlight, not a scoreboard"
description: "Deployment frequency, lead time, change failure rate, and MTTR tell you where to look. They are a poor basis for ranking teams against each other."
pubDate: 2026-05-08
category: essay
draft: true
tags: ["dora", "platform-engineering", "leadership", "metrics"]
---

> **WIP/TEST** — placeholder content while the site's design is under construction.

Every few months someone forwards me a dashboard with four DORA metrics and a traffic-light
column per team, and asks whether it's "good." The dashboard is never wrong, exactly. It's just
answering a different question than the one being asked.

![Abstract composition of a beam of light sweeping across a dark field, illuminating a small area](./essay-dora-metrics-flashlight.svg)

## What the four metrics are actually for

DORA — deployment frequency, lead time for changes, change failure rate, and time to restore —
came out of research correlating software delivery practices with organizational performance.
The research is solid. The metrics are diagnostic, built to answer "is our delivery pipeline
healthy," not "is Team A better than Team B."

That distinction gets lost the moment the numbers land in a spreadsheet with names attached.

### Deployment frequency isn't a productivity score

A team deploying twelve times a day and a team deploying twice a week can both be doing exactly
the right thing for their context. A payments team with strict compliance gates and a marketing
site team have different constraints, different blast radii, different acceptable cadences.
Comparing their deployment frequency side by side produces a number, not an insight.

### Change failure rate punishes honesty

If Team A tags every rollback as a failure and Team B quietly patches forward without ever
opening an incident, Team B's dashboard looks better and its actual reliability might be worse.
The metric assumes consistent, honest instrumentation across teams that often don't share
tooling, definitions, or incentives to report accurately.

## Where the flashlight is actually useful

> The value of a metric is not what it measures. It's what conversation it starts.

Used well, DORA metrics point a beam at one team's own trend over time:

- Lead time creeping up over a quarter — worth asking why, in a retro, with the people who felt it.
- Change failure rate spiking after a specific release — worth a blameless look at what changed.
- MTTR dropping after an on-call rotation change — worth confirming the causal story, not just
  celebrating the number.

None of that requires comparing the number to another team's. The comparison is the part that
turns a diagnostic tool into a scoreboard, and scoreboards change behavior in predictable, mostly
bad ways: people optimize the metric instead of the outcome it was meant to proxy for.

## A small table, because it helps to see the failure modes side by side

| Metric                  | Useful question                          | Scoreboard misuse                          |
| ------------------------ | ----------------------------------------- | -------------------------------------------- |
| Deployment frequency     | Is our batch size shrinking over time?    | Ranking teams by deploys/week               |
| Lead time for changes    | Where does work sit idle in our pipeline? | Bonus targets tied to a lead-time number    |
| Change failure rate      | Are our tests catching what matters?      | Penalizing teams for reporting failures     |
| Time to restore          | Can we actually recover fast under load?  | Comparing MTTR across teams with different SLAs |

## What I do instead, as a lead

When I bring DORA metrics into a conversation with a team, I try to keep three rules:

1. Always plot a team against its own history first. Cross-team comparison, if it happens at all,
   comes after — and with heavy caveats about differing context.
2. Pair every metric with a story. A number without a "why" is an invitation to guess, and guesses
   trend toward blame.
3. Instrument consistently or don't compare at all. If two teams define "incident" differently,
   their change failure rates aren't the same unit of measurement.

A small script that pulls deployment events and computes rolling lead time looks something like
this — deliberately boring, no dashboard framework required to start:

```ts
type Deployment = { mergedAt: Date; deployedAt: Date };

function leadTimeHours(deployments: Deployment[]): number[] {
  return deployments.map(
    (d) => (d.deployedAt.getTime() - d.mergedAt.getTime()) / (1000 * 60 * 60),
  );
}
```

## The honest version

DORA metrics are one of the better instruments we have for talking about delivery health, and
I'd rather have them than not. But a flashlight only shows you what's in its beam, and it shows
the same spot brighter the longer you hold it there — it doesn't tell you which spot to point it
at next. That part is still a judgment call, made by people who know the team, not a number on a
dashboard.
