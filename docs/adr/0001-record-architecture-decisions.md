# 1. Record architecture decisions

Date: 2026-10-09. Status: accepted.

## Context

We want a lightweight history of why the system looks the way it does, so future contributors (and AI agents) do not undo decisions by accident.

## Decision

Use short Architecture Decision Records in `docs/adr/`, numbered sequentially, each with Context, Decision, and Consequences. Superseded ADRs stay in place and link to their replacement.

## Consequences

Any change that alters a decision below needs a new ADR in the same PR.
