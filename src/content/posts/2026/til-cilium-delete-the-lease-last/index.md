---
title: "Deleting the lease brought it back"
description: "We knew how to bring a service VIP back, but the quick fix kept leaving us without an answer for why it stopped working."
pubDate: 2026-10-20
category: til
draft: false
liveFrom: 2026-10-20
tags: [cilium, kubernetes, networking, l2-announcements, troubleshooting]
---

One way into a service stopped accepting connections, while another way to the same service still worked. Everything looked healthy, including the Cilium lease. My first thought was, "it's the same thing again."

We knew how to get traffic back. Delete the lease, let another node take it, and it sends out an ARP announcement so the network can find the VIP again. It came back within seconds. We did it twice, and learned nothing either time.

The logs showed the API server stalling and the lease renewal timing out. Then the same node took the lease again. But we never looked at what MAC the router had cached, or whether a node still had the wrong entry in its ARP responder map. We didn't capture where a failing packet stopped either, so I'm not sure the renewal caused the outage at all.

Cilium [issue #45068](https://github.com/cilium/cilium/issues/45068) gave us one lead. It describes an L2 responder bug where a map cleanup could remove an entry it was supposed to keep. [PR #45197](https://github.com/cilium/cilium/pull/45197) fixed that in 1.19.4 and 1.20.0. Someone later reported the same defect in 1.18 too, so we still need to check our exact version. It sounds possible, but we haven't shown that this is our problem. [Issue #48626](https://github.com/cilium/cilium/issues/48626) sounds similar at first, but it describes a different failure after a network interruption.

Longer lease timings might stop the same node having to take the lease again after a short API stall. That's something we want to test, not a fix yet.

So we wrote a runbook to capture the ARP entry, the responder map and a packet trace before deleting the lease next time. The quick fix will still be there, but maybe we'll know a little more before using it again.

## Links

- [Cilium L2 Announcements](https://docs.cilium.io/en/v1.18/network/l2-announcements/), including lease failover and gratuitous ARP
- [Cilium issue #45068](https://github.com/cilium/cilium/issues/45068) and [fix #45197](https://github.com/cilium/cilium/pull/45197)
- [Cilium issue #48626](https://github.com/cilium/cilium/issues/48626), a different failure with a similar symptom
