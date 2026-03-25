# Sacred Timeline — Strategy

**Date:** 2026-03-25

---

## The Big Idea

Sacred Timeline is git for the AI-native world.

In the AI age, everyone builds — code, strategy, writing, research. The git concepts developers have always relied on (safe experiments, rollback, capture moments, merge what works) are now universal needs. Sacred Timeline is the human interface for all of it.

We are not building another git client for developers. We are building the layer that makes git invisible — and makes AI-native work accessible to everyone.

---

## Market Opportunity

Git training and tooling is a multi-million dollar industry. Companies hire consultants to onboard teams to git. That budget exists because git is hard and the tools assume you already understand it.

The AI-native wave makes this 10x larger:
- Vibe coders are building real products without CS backgrounds
- Knowledge workers (strategists, researchers, writers) now use AI to build iteratively
- AI coding tools (Claude Code, OpenClaw, Cline) generate changes humans can't track

Nobody has built the right interface for these users. That is the gap.

---

## Positioning

**For:** Anyone who builds anything with AI — from vibe coders to senior developers, from strategy consultants to researchers

**Against:** "Learn git properly" / git GUIs built for developers who already know git

**The difference:** Sacred Timeline doesn't teach git. It makes git disappear. The AI narration layer tells you the story of what you built, in plain English, without you needing to understand what a commit is.

---

## Competitive Landscape

| Tool | Who it's for | What's missing |
|------|-------------|----------------|
| GitHub Desktop | Devs who hate terminal | Still uses git vocabulary |
| GitKraken / Tower | Developer teams | Requires git knowledge |
| git CLI | Experienced devs | Steep learning curve |
| Sacred Timeline | Everyone | Nothing — this is the gap we fill |

**The moat:** LLM-powered narration. No other tool can explain what you built, why it matters, and what you tried — in plain English, across all your projects.

---

## Product Strategy

### Phase 1 — Claude Code Skill (beachhead)
The Claude Code user is the highest-density AI-native audience right now. A Sacred Timeline skill integrates directly into their workflow — auto-capturing sessions, narrating what was built, suggesting experiments before risky changes. Word spreads from Claude Code to other AI tools.

### Phase 2 — CLI with Real AI Narration
Upgrade `sacred narrate` from a commit counter to a real LLM-powered narrative engine. This is the feature that makes people evangelize Sacred Timeline to their networks.

### Phase 3 — Web App
Cross-project dashboard. The "home" for your Sacred Timeline. This is what teams buy — replacing the git training consultant with a product that onboards everyone automatically.

### Phase 4 — Platform
OpenClaw, Cline, Cursor integrations. Team features. Mobile companion. API for other tools to build on.

---

## Open Source Strategy

Sacred Timeline is open source (MIT). This is a deliberate choice:

1. **Distribution:** The AI coding community (Claude Code, OpenClaw users) is developer-heavy. Open source is the fastest path to trust and adoption in this community.
2. **Ecosystem:** Skills, plugins, and integrations built by the community extend Sacred Timeline to surfaces we can't build ourselves.
3. **Narrative:** "Git for the AI-native world, built in the open" is a compelling story that attracts contributors, users, and press.

**What stays open:** CLI, skill integrations, plugin architecture, narration engine
**Future paid layer:** Web app team features, cloud sync, enterprise onboarding

---

## Key Metrics to Track

- CLI installs (npm downloads)
- Skill activations (Claude Code)
- `sacred narrate` usage (proxy for LLM engagement)
- Web app DAUs (when shipped)
- GitHub stars (community health)

---

## Next Actions

1. Build Sacred Timeline Claude Code skill
2. Upgrade `sacred narrate` with Claude API
3. Add `sacred config --show-git` dev mode
4. Begin web app spec
5. Post to Claude Code community / OpenClaw community
