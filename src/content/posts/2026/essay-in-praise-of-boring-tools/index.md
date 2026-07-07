---
title: "In praise of boring tools"
description: "Choosing the tool with the fewest surprises is not a failure of ambition — it's usually the ambitious choice, once you count the cost of surprises."
pubDate: 2026-06-19
category: essay
draft: true
tags: ["tooling", "platform-engineering", "leadership"]
---

The most reliable systems I've run were never built on the newest tool in the room. They were
built on the tool with the smallest surface area for surprise — usually a few years old, usually
a little unfashionable, always well understood by whoever was on call.

![Abstract composition of a single solid grounded shape surrounded by faded, drifting shapes](./essay-boring-tools.svg)

## Boring is a property of the operator, not the tool

"Boring" doesn't mean simple, old, or feature-poor. It means the people running it have already
found its edges. A tool is boring once its failure modes are documented in someone's memory
instead of waiting to be discovered in an incident.

### The cost nobody puts on the slide

New tools get evaluated on features. They rarely get evaluated on the cost of the first year of
finding out how they fail — the outages that teach you what the vendor's docs didn't mention, the
support tickets that become tribal knowledge, the on-call shifts spent reading source code
instead of runbooks.

> Every tool has a "getting to know you" tax. The question is whether you pay it before or during
> an incident.

## What I actually look for

- Predictable failure modes, ideally ones other teams have already hit and written up
- A boring, mechanical upgrade path — no "rewrite your config format" between minor versions
- Enough adoption that Stack Overflow, GitHub issues, and coworkers have already hit your bug
- A rollback path that doesn't require the tool's own healthy operation to execute

None of that shows up in a feature comparison table, which is exactly why feature comparison
tables are a bad way to choose infrastructure.

## A comparison, stated plainly

| Property                 | Exciting new tool          | Boring established tool         |
| -------------------------- | ---------------------------- | ---------------------------------- |
| Failure modes              | Discovered live, by you      | Documented, by someone else already |
| On-call familiarity        | Low, growing slowly          | High, from day one                  |
| Migration risk if it stalls | High — small community      | Low — many exits, many alternatives |
| Feature velocity            | High                         | Low, but predictable                |

## Where "exciting" is still the right call

This isn't an argument for never adopting anything new. Some problems genuinely need a tool that
doesn't exist yet in boring form. The distinction I try to hold onto: adopt exciting tools for
capabilities you can't get any other way, not for capabilities you already have, slightly nicer.

```bash
# a boring health check, run from a boring cron job,
# writing to a boring log file — and still catching the outage
curl -sf https://example.com/health || echo "$(date -u) health check failed" >> /var/log/health.log
```

That one-liner has caught more real incidents for me than any observability platform I've
adopted for the excitement of it. It's not sophisticated. It's just been running, unattended,
for years, and I know exactly how it fails.

## The actual ambition

Choosing boring tools is not the safe, unambitious choice it looks like from the outside. It's a
bet that your team's attention is the scarcest resource in the system, and that spending it on
novel failure modes is a worse trade than spending it on the actual problem you're trying to
solve. That's still ambition — just pointed at the right target.
