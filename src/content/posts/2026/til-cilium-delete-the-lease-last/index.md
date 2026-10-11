---
title: "Delete the lease last"
description: "Deleting a Cilium L2 announcement lease can restore a service VIP quickly, but it can also erase the state needed to understand why it stopped answering ARP."
pubDate: 2026-10-20
category: til
draft: false
liveFrom: 2026-10-20
tags: [cilium, kubernetes, networking, l2-announcements, troubleshooting]
---

One path to a service VIP stopped accepting connections, though another still worked. The gateway, backends and lease looked healthy. I thought, "it's the same thing again."

Deleting the `cilium-l2announce-*` lease restored traffic: a new holder sent gratuitous ARP, which can refresh clients' cached VIP MAC. We did it twice and learned nothing either time.

Logs showed API-server stalls, failed lease renewals, then the same node reacquiring the lease. We never captured the router's cached MAC, each node's responder-map state, or where a failing packet stopped. We can't tie the outage to a renewal.

Cilium [issue #45068](https://github.com/cilium/cilium/issues/45068) describes an L2 responder bug: pointer reuse during BPF-map iteration could delete entries reconciliation still needed. [PR #45197](https://github.com/cilium/cilium/pull/45197) fixes it in 1.19.4 and 1.20.0. A later comment reports the defect in v1.18 too; we still need to check our exact patch's backport status. This is a lead, not a diagnosis. [Issue #48626](https://github.com/cilium/cilium/issues/48626) reports a similar dead VIP after a LAN interruption and lease handoff, but with a different failure.

Longer lease windows might reduce the same-node re-acquisitions after short API stalls. That's a mitigation to test, not a fix we've proved.

**What I learned:** the quick recovery can destroy the evidence. We wrote a runbook to capture the neighbour entry, responder map and a packet trace before deleting the lease next time. We still don't know if that will find the cause, but it gives us a chance to learn something before the service comes back.

## Links

- [Cilium L2 Announcements](https://docs.cilium.io/en/v1.18/network/l2-announcements/), including lease failover and gratuitous ARP
- [Cilium issue #45068](https://github.com/cilium/cilium/issues/45068) and [fix #45197](https://github.com/cilium/cilium/pull/45197)
- [Cilium issue #48626](https://github.com/cilium/cilium/issues/48626), a different failure with a similar symptom
