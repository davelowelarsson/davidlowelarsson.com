---
title: "In praise of boring tools"
description: "The containers we started with at UR were early software, and they were still boring, and that turned out to be the difference that mattered."
pubDate: 2026-06-19
category: essay
draft: true
tags: ["tooling", "platform-engineering", "kubernetes", "leadership"]
---

A couple of years ago (must be something like 15 years ago) I was still working in a codebase relying heavily on mootools. Nobody had used
mootools for years. But someone sat down years before I got there, weighed mootools against jquery,
and picked the one that lost, and then I was the one living with it.

![Abstract composition of a single solid grounded shape surrounded by faded, drifting shapes](./essay-boring-tools.svg)

<!-- Maybe use this image here - https://imgs.xkcd.com/comics/dependency.png -->

So that's what I'm actually thinking about whenever we discuss at work whether something is too
new to run in production. Not the feature list. Who is going to be living inside this decision in
2033, and will they understand why it was made 🤔

## Docker in 2016

We started jumping on docker maybe 2016 or 2017. The software was early but it was stable, and we
took it in small steps. We experimented with docker and docker swarm, then started a very small
cluster on Rancher's own Cattle, and by the time we were ready to actually scale, Rancher had
moved to RKE, so that became the next step rather than a rewrite. Today it's kubernetes, and I
still like the opinionated way Rancher sets things up, enough that I [built a k3s cluster out of
raspberry pis at home](/posts/raspberry-pi-cluster/) to keep learning it.

Every one of those steps was early. None of them was new. Other people had already run the thing
we were about to run, it was already a big part of the CNCF landscape, and the failure modes were
written down somewhere by someone who had hit them first. That's the whole trick, and it has
nothing to do with how old the software is.

## The part that took longest was not the software

Trust and workflows around containers were very limited in the beginning, and people had a really
hard time seeing the benefit. The abstraction levels are the hard part... taking the leap from
"frontend, application, backend" all the way down to infrastructure is a long journey, and a lot
of coworkers and others I've worked with have not completed it yet. Neither had I, for years.

That's the cost I never see in anyone's evaluation of a tool. The tool arrives more or less on the
day we install it. The understanding arrives whenever it arrives, and until it does, the tool is
something most of the team has to trust rather than reason about.

## The rule, and the things we kept too long

We have continuous discussions about tools and newness, and the rule we land on is boring in
itself: anything that isn't 1.0 or GA we evaluate, try out, play with, but don't put in
production. We do bend that for some kubernetes tooling, which I notice and am not entirely
comfortable with. Beyond that it's tried and true, preferably open source, because that gives me
much more confidence about what happens when the vendor loses interest. And never build it
yourself. Not-invented-here is a dangerous and very maintenance heavy road to walk through a
career.

Jenkins is the one we should have let go earlier than we did. We built a very competent shared
workflow, and also a complicated one that was genuinely hard to make sense of at some points, and
I've written about [where that started creating its own
friction](/posts/essay-3d-art-to-platform-engineering/) already. And ur.se on Ruby on Rails is
probably something we never should have moved to. It was never easy to edit or make changes in,
and it gave us issues more than once. Moving that over to Next.js and TypeScript has taken six or
seven years and is only mainly done now.

The tools that never seem to be in the way are ssh, bash, grep, find and vim/neovim. Kubernetes
and docker are not boring, they're incredible, so maybe boring is the wrong word for what I look
for... what I look for is a tool somebody else has already found the edges of. Six or seven years
for one migration is a good reminder of how long these decisions keep being someone's daily work
after the meeting where they were made. We'll see what I'm still living inside in 2033 🤷
