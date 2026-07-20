---
title: "Git, the new SVN?"
description: "First impressions moving from SVN to Git, and setting up a GitHub-based workflow for developing this site across two computers."
pubDate: 2013-06-09
liveFrom: 2026-07-21
category: experiment
draft: false
tags: ["archive", "3d", "git", "version-control", "tooling"]
---

> **2026 note:** Thirteen years later I came back to this in [Who owns the code AI writes?](/posts/essay-ai-code-ownership/), with different tools but the same question around who owns what happens next.

![Try Git screenshot](./feature.jpg)

## What is Git?

When attending school they used SVN and until now I have never had any reason to change or look elsewhere for a version control system, until I discovered Git.

Here you can test it out! [try Git](http://try.github.com).
If you would like a more "real" project, check out [GitImmersion](http://gitimmersion.com/index.html).

Git is developed by Linus Torvalds, the creator of Linux. So it has to be good, right? [Here is talking about how good it is anyway.](http://youtu.be/4XpnKHJAok8)
The main difference between SVN and Git is that SVN is a "VCS" and Git is a "DVCS". Version control system and distrubuted version control system, the power is in the distrubution.

In my experience we are moving around more and more, and that is an issue when using SVN. When developing outside the office or away from home you can not do commits when using SVN. So if you want to test something and branch out, you can't.

Git is using a distributed model instead were the repositories are locally on your computer and you can commit several times, it's only when you push to the server that the commits are transferred (and you need to be connected). This is a really cool new way of handling version control.

So if you move around a lot and you feel the need to develop on the road, check out Git! Although it's not developed mainly to be a mobile SVN, it's one of the reasons I really got interested.

## Git and deployment

If you are a webdeveloper I would encourage you to check out [Beanstalk](http://beanstalkapp.com/), it uses Git but also has a very nice deployment system.

When I updated this website I started developing locally and then pushing the changes online. The workflow is really something I can recommend for anyone developing for the web who is still making changes directly on their FTP. Start by installing [WAMP](http://www.wampserver.com), [LAMP](https://help.ubuntu.com/community/ApacheMySQLPHP) or [MAMP](http://www.mamp.info). Depending on what platform your working on.

I researched this subject because I wanted to work locally on two different computers. The most common solution is to set up a online dev server, but then you need a internet connection. I wanted the homepage to stay in sync on both computers so I could work offline, so I looked around and found Github. The Github solution was really nice for me. Work locally on the laptop or home computer and keep it updated, then when I feel ready i can push the changes online. To have such a workflow when I'm developing on my own can seem like overkill, but I did it because I also wanted to create a nice pipeline, a workflow that works is never overrated.

Back to beanstalk

Download [Git](http://git-scm.com/downloads) and install it, then signup for beanstalk, there is a free account for 1 repos and under 100mb. Unfortunately my homepage was a little bit to big so I acctually choose to sign up for Github instead, but check out this [awesome guide](http://css-tricks.com/video-screencasts/109-getting-off-ftp-and-onto-git-deployment-with-beanstalk/) by Chris Coiyer, here he uses the really cool deployment by FTP, it also supports SFTP, ssh and more.

PS. [Github](https://github.com/) is a really cool service which is really popular, checkout these projects! DS.
[jquery](https://github.com/jquery/jquery) · [textmate](https://github.com/textmate/textmate)
