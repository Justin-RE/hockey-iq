# HockeyIQ - Product Requirements

## Problem

Young field hockey players learn rules and positioning mostly at practice, where coaches have little time for one-on-one explanation. Players (and new parents and volunteer coaches) need a quick, visual way to rehearse common game situations and learn the "why" behind each decision.

## Audience

- Primary: girls' youth and high school field hockey players, roughly ages 10-18.
- Secondary: new coaches and parents learning the game.
- Assume some players are under 13. See "Privacy and COPPA" below.

## Product

A 2D, top-down web game. Each **scenario** shows a field hockey pitch with simple circle avatars (jersey color plus number) and a ball, frozen at a key moment. The player is "you" (highlighted avatar). A short prompt asks what to do next, offering 2-4 choices. After answering:

1. The avatars animate the result of the chosen option.
2. The game shows whether the choice was correct and explains why.
3. The player can retry or move to the next scenario.

## MVP scenario list

| Slug | Situation | Category |
| --- | --- | --- |
| `pc-defense-first-runner` | Defending a penalty corner: the first runner's job | Set piece |
| `pc-attack-injection` | Attacking a penalty corner: where the ball must go before a shot | Set piece / rules |
| `sixteen-yard-hit-outlet` | Defensive free hit inside 16 yards: safe outlet | Defense |
| `free-hit-five-yards` | Opponent's free hit: where defenders must stand | Rules |
| `goal-side-marking` | Marking an attacker entering your 25 | Defense |
| `obstruction-shielding` | Under pressure with the ball: shielding vs. moving the ball | Rules |
| `channel-the-attacker` | 1v1 defending: jab and channel vs. diving in | Defense |
| `two-v-one-overlap` | 2v1 attack: draw the defender, then pass | Attack |

## MVP scope

In scope:
- Scenario picker grouped by category, with a difficulty label.
- Scenario player: pitch, avatars, prompt, choices, outcome animation, feedback, explanation.
- Guest play with progress stored in the browser only.
- Optional account (nickname + password, no email) to save progress on the server.
- Progress page: scenarios attempted, correct on first try.
- Keyboard play, text-first content, color-blind-safe team colors.

Out of scope for MVP:
- Real-time multiplayer, free-roam control of avatars, sound.
- Coach dashboards, teams, leaderboards (they require more personal data).
- Scenario editor UI (scenarios are authored in code and reviewed via PRs).

## Privacy and COPPA

The Children's Online Privacy Protection Act applies when a site knowingly collects personal information from children under 13. MVP decisions:

- No email, real name, birthday, photo, location, or free-text profile fields.
- Accounts are optional; guest play is fully functional.
- Nicknames are validated against a pattern and a basic blocklist, and the UI tells users not to use their real name.
- No third-party ad or analytics trackers. Error monitoring (Sentry) is configured to drop IP addresses and user-identifying data.
- A plain-language privacy page explains what is stored.

Any future feature that collects personal data from children triggers a COPPA review (verifiable parental consent, data retention, deletion requests) before work starts.

## Success metrics

- 90%+ of scenario loads render without client errors (Sentry).
- p95 page response under 500 ms at the load balancer.
- At least 50% of players who start a scenario finish it.

## Non-functional requirements

- Availability target 99.5% monthly (small app, single region).
- Restore from backup within 4 hours (RTO), losing at most 24 hours of data (RPO); point-in-time restore usually does better.
- All traffic over HTTPS when a domain is configured; secrets only in AWS Secrets Manager.
