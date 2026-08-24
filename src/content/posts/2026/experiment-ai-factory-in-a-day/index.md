---
title: "An AI factory in a day"
description: "A one-day proof of concept: a circular AI DevOps loop that plans, builds, tests, deploys, monitors and analyzes a web page on its own... and the day its analyzer lied to me."
pubDate: 2026-09-29
category: experiment
draft: false
liveFrom: 2026-09-29
tags: ["ai", "agents", "devops", "automation"]
cover: ./before-after.png
coverAlt: The same NimbusNote landing page twice, a clashing cyan, pink and lime Comic Sans mess on the left and a clean Material Design page on the right
---

On Friday, August 21, I demoed a one-day proof of concept to my colleagues... an
AI factory that takes the classic DevOps infinity loop and removes the humans
from the turning of it ... well, not entirely. A human still steers, but the
cycles run themselves: plan, build, test, deploy, monitor, analyze, rediscover,
and around again.

![The NimbusNote page improving deploy by deploy, from a Comic Sans eyesore to a clean Material Design page, with a version badge ticking upward](./transformation.gif)

*Every visible improvement in there maps to a git diff.*

The idea comes from a couple of places. Harvard Business School calls it the
[AI factory](https://online.hbs.edu/blog/post/ai-factory), software that turns
data into decisions in a loop where each cycle's output feeds the next cycle's
input, and Cloudflare built
[an agent that triages incoming GitHub issues for Astro](https://blog.cloudflare.com/astro-issue-triage/)
before a human ever looks at them
([here's one in the wild](https://github.com/withastro/astro/issues/17763)).
I wanted to **see** it to understand the flow, so I built one.

The Astro triage bot was a great inspiration and something that I'm actually considering for us.

## The loop

The factory evolves a landing page for a fake notes app called NimbusNote, three
files, `index.html`, `styles.css`, and `app.js`, made deliberately horrible at the
start. Comic Sans. A 21-color clashing palette, 1.3:1 body contrast, `<center>`
tags, a busy loop that runs at parse time. Quality score at v0: 24 out of 100.
(but for some this might be a nice 1990's nostalgia website 😅)

The seven stages are drawn as the DevOps figure-eight with deploy at the
crossing, right where "release" sits in the original logo. And the boring stages
are real. TEST actually parses the HTML and syntax-checks the JS and rolls back
on failure, and MONITOR actually measures contrast ratios, payload bytes and
heading structure. So the loop on screen follows the real work the agents do.

![The factory dashboard mid-run: the seven-stage infinity loop lighting up, personas rotating at the wheel, and logs streaming below](./dashboard-loop.gif)

Three personas take turns at the wheel, one full cycle each... a UX and
accessibility auditor steering toward Material Design 3, a growth architect who
wants one obvious action on the page, and a performance engineer whose favorite
change is deleting things. Each persona ends its cycle by writing a handover,
what it did and what the next persona should care about, and every backlog item
carries a why the planner can point to, a measurement or a user report. None of
this is clever storage, the backlog with its whys and the last twenty handovers
live in one JSON file on disk. Fifteen cycles in, the same three files score
around 97.

I actually realised in the middle of building this that the deploy should
probably happen after all agents had done their cycles, not once per agent. To
get the demo to show step by step I also had to slow the agents down, they were
only allowed one minor change per cycle... which made each step easier to demo
(it took around 19 versions before it looked and worked "ok").

![A mission card from the backlog, showing the persona, the mission, a conclusion with the score delta, and the handover text to the next persona](./mission-card.png)

*One backlog item. The why field is the part I'd keep even if I threw the rest away.*

I tried typing a seed into the loop live during the demo... but it was too slow
and I couldn't wait for it. I'm glad I had mocked most steps and could just
"replay" them like a recording (the transformation gif at the top shows roughly
what the live run would have done).

## The analyzer lied to me

The most valuable bug of the day was in the measurement itself. While testing I
injected "make everything green" and the agent obliged. The result had dark text
on dark green, genuinely unreadable. The accessibility score? 100.

So what happened... the analyzer only measured one contrast pair, body text on
body background. Everything else was invisible to it, and that made it invisible
to the UX persona too (I think this is the real lesson, the agents' plans are
only as good as the evidence/context they get). A loop with weak instruments kept
telling me everything was fine.

![The dashboard with the analyzer log reading "design capped at 76 by 3 visible smell(s): blinking text, 1990s bevelled borders, exclamation-mark shouting"](./dashboard-hero.png)

*The analyzer after the fix, naming the smells it can now actually see.*

The fix was surprisingly mechanical. The trick was just to check every
container color against its on-color, so the monitor now checks every token
pair and every section's text against its background, in both light and dark
schemes. The same green page scored 61 after that, with the failing selector
and both hex values named in the next plan's evidence. Next time I'd audit
what the agents can actually perceive before letting them loop, I think.

## What broke

What was a bit of a struggle was getting something to show in just around 6
hours. So every step back and failure made me a bit nervous because of the
timeline.

I decided to use [Hono](https://hono.dev) and websockets to update the webpage
automatically on any and all updates. Which worked pretty well... but I didn't
tie up the prototype correctly at first, so it needed a reload to work (but
that got fixed).

The prototype was also way to "good" at first... so it was hard to see if we
made any improvements or not. But that got addressed too 😄

To be able to run the "cycles" again and again I needed some way to revert back
to version 0... and that revert didn't really work as expected. Several times
while improving the AI factory itself I also committed the target app by
mistake (the crappy website I wanted to cycle on), so reverting properly was a
bit of a hassle. And the safety guard that reverts stray agent edits outside
the sandbox happily reverted my own uncommitted files too 🙃. Autonomous
cleanup needs a baseline of what was already dirty before the run... the fix
was a `git status --porcelain` snapshot taken before each run, and anything on
it is off limits to the guard.

The part I enjoy most is that the factory was itself built the same way, by
orchestrated AI agents working in parallel for a day, test-first, about 475
tests at the end. So the demo is basically a small version of how it got built
(almost... the ones at the wheel were very different).

## Where this goes

The backlog is the pluggable part. Today it's analyzer findings and typed seeds,
tomorrow it could be an issue tracker like in the Astro setup, or support
tickets. I think this project is done... but I learned enough that I want to
try a release gate next time, where any persona can veto a deploy and the
veto's reasoning gets written down, so the next cycle can read why and not do
it again. Or maybe every persona should get to run through the changes before
anything is allowed to go forward. It's the same question I poked at in
[Who owns the code AI writes?](/posts/essay-ai-code-ownership/), because when
the loop turns on its own, what I actually own is the instruments and the
gates. I'm not sure how well any of this scales past a demo... we'll see, time
will tell 😁

## Links

- [The AI factory](https://online.hbs.edu/blog/post/ai-factory), Harvard Business School's framing
- [Improving Astro's issue triage with Cloudflare Workers](https://blog.cloudflare.com/astro-issue-triage/), the triage bot
- [An Astro issue triaged by the bot](https://github.com/withastro/astro/issues/17763)
- [Hono](https://hono.dev), the web framework used for live updates
