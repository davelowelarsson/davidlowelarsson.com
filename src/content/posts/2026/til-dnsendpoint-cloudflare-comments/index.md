---
title: "TIL: DNSEndpoint CRs, and comments on Cloudflare DNS records"
description: "Cloudflare DNS records can carry a comment ... I'm using mine as a tiny metadata DB for the homelab dashboard."
pubDate: 2026-08-11
liveFrom: 2026-08-11
category: til
draft: false
tags: ["kubernetes", "external-dns", "cloudflare", "dns", "homelab"]
---

So I was wiring the url shortener into the Raspberry Pi cluster and Claude Code suggested a `DNSEndpoint` CR ... a resource I didn't know existed. That's a really nice thing about working with AI, you don't know what you don't know, and this time I got to use something I would never have searched for. I jumped over to the [external-dns CRD docs](https://kubernetes-sigs.github.io/external-dns/latest/docs/sources/crd/) and read up.

My external-dns runs with `--source=crd`, so this one file is what creates the DNS record pointing at the Cloudflare tunnel. But the part that stuck with me is the comment. Cloudflare DNS records can carry one, and external-dns can set it per record.

I'm using that comment as a tiny metadata DB 😁. My homelab dashboard reads the comments on the zone and renders a card per record, with a title, an icon and which backend it runs on. The free plan caps comments at 100 characters, so the JSON has to stay terse.

```yaml
apiVersion: externaldns.k8s.io/v1alpha1
kind: DNSEndpoint
metadata:
  name: url-shortener
  namespace: url-shortener-express
spec:
  endpoints:
    - dnsName: shortener-classic.saltast.com
      recordType: CNAME
      recordTTL: 1
      targets:
        - 00000000-dead-beef-0000-000000000000.cfargotunnel.com
      providerSpecific:
        - name: external-dns.alpha.kubernetes.io/cloudflare-proxied
          value: "true"
        # Free plan caps comments at 100 chars .. keep it terse
        - name: external-dns.alpha.kubernetes.io/cloudflare-record-comment
          value: '{"dash":1,"t":"URL Shortener v1 (Express)","i":"🔗","be":"lab","w":"url-shortener-monolith"}'
```

**Takeaway:** a Cloudflare DNS record comment is 100 free characters of metadata attached to a name I already own ... my dashboard is basically reading its config straight out of DNS. We'll see how long that stays a good idea 🤔

## Links

- [external-dns CRD source](https://kubernetes-sigs.github.io/external-dns/latest/docs/sources/crd/)
