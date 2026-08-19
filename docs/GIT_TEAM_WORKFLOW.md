# Git Team Workflow — Crisis Connect

> This document defines the Git branching strategy, PR rules, and coordination protocols
> for the 5-member Crisis Connect development team.

---

## Branch Structure

```
main
│
├── member1/citizen-volunteer       ← Member 1 primary branch
├── member2/officer-gis             ← Member 2 primary branch
├── member3/backend                 ← Member 3 primary branch
├── member4/ai-data                 ← Member 4 primary branch
└── member5/optimization-demo       ← Member 5 primary branch
```

Each member works primarily on their own branch. Nobody works directly on `main`.

---

## Branching Rules

### Rule 1 — Nobody Works Directly on `main`

`main` is a protected branch. Direct pushes to `main` are prohibited.

All changes reach `main` through Pull Requests reviewed by at least one other member.

### Rule 2 — Each Member Works on Their Own Branch

Your primary working branch is:

| Member | Branch |
|--------|--------|
| Member 1 | `member1/citizen-volunteer` |
| Member 2 | `member2/officer-gis` |
| Member 3 | `member3/backend` |
| Member 4 | `member4/ai-data` |
| Member 5 | `member5/optimization-demo` |

For larger features, create sub-branches off your primary branch:

```
member1/citizen-volunteer/offline-sos-queue
member4/ai-data/flood-model-v2
```

### Rule 3 — Update from `main` Before Starting Work Each Day

```bash
git checkout main
git pull origin main
git checkout member1/citizen-volunteer
git merge main
# OR:
git rebase main
```

Do this **every morning** before writing code. This prevents large divergence.

### Rule 4 — Update from `main` Before Opening a PR

Before you open a PR, merge or rebase the latest `main` into your branch and resolve any conflicts locally:

```bash
git checkout main
git pull origin main
git checkout member1/citizen-volunteer
git merge main
# Resolve conflicts, then:
git push origin member1/citizen-volunteer
```

### Rule 5 — Keep PRs Focused on One Workstream

Each PR should do **one thing**. Do not combine:

- Feature work + refactoring
- Multiple unrelated bug fixes
- Frontend changes + backend changes (unless they are a single coherent integration)

**Smaller PRs merge faster and conflict less.**

### Rule 6 — Do Not Mix Unrelated Refactoring with Feature Changes

Refactoring is fine. But do it in a **separate PR** from feature work.

This makes code review faster and makes git blame more useful.

### Rule 7 — Do Not Modify Another Member's Owned Files Without Coordination

Before touching a file you do not own:

1. Contact the file's owner (see `docs/TEAM_FILE_OWNERSHIP.md`).
2. Agree on the change.
3. Either let the owner make it, or get explicit approval before you do.
4. Mention the coordination in your PR description.

If you need a function or behavior from another member's file to change, open a task / discussion — do not silently edit it.

### Rule 8 — Do Not Silently Alter an API Contract

If your change affects an API endpoint's path, method, request schema, or response schema:

1. Announce in the team channel before writing code.
2. Get agreement from the frontend consumers of that endpoint.
3. Update `docs/API_CONTRACTS.md` in the same PR.
4. Tag the affected members in the PR for review.

### Rule 9 — Do Not Edit Shared Files Without Informing the Primary Owner

Shared files (see `docs/TEAM_FILE_OWNERSHIP.md`) have a primary owner.

Before editing a shared file:
- Inform the primary owner.
- Get a thumbs-up (can be async in the team channel).
- Small, safe additions (adding an import, adding a route) are generally fine with a heads-up.
- Structural changes to shared files require agreement.

### Rule 10 — Prefer Adding a New File in Your Area Over Modifying Someone Else's

If you need new functionality that would go into another member's file, consider:

- Creating a **new service file** in your area that the other file calls
- Adding a **new adapter** in `src/lib/api/` for your endpoint
- Adding a **new component** in your pages folder

Avoid forcing changes into other members' files when a new file can accomplish the same goal without conflict.

### Rule 11 — Every PR Must Include a Checklist

Every PR description must include answers to these questions:

```
## PR Checklist

**Files changed:**
- [ ] List every significant file changed

**API changes:**
- [ ] None
- [ ] New endpoint added: (describe it)
- [ ] Existing endpoint changed: (describe the change)
- [ ] docs/API_CONTRACTS.md updated

**Shared files changed:**
- [ ] None
- [ ] (List shared files changed and confirm owner was informed)

**Dependencies added:**
- [ ] None
- [ ] package.json: (list packages)
- [ ] requirements.txt: (list packages)

**Database / migration changes:**
- [ ] None
- [ ] New model / table added
- [ ] Existing model field changed

**Other members affected:**
- [ ] None
- [ ] Member X affected because: (explain)
```

### Rule 12 — Small PRs Are Preferred Over Large End-of-Week Merges

**Maximum PR guideline:** A PR should ideally change fewer than 300 lines.

If your PR is approaching 500+ lines, consider splitting it.

---

## Merging Protocol

### Who Merges PRs?

- PRs touching only **your owned files** → Can be self-merged after 1 review from any teammate.
- PRs touching **shared files** → Must be reviewed by the primary owner of that shared file before merging.
- PRs touching **API contracts** → Must be reviewed by **Member 3** before merging.
- PRs touching `main` directly → **Never allowed**. Must go through a feature branch PR.

### Merge Strategy

Use **squash and merge** or **merge commit** (team decides). Do NOT rebase PRs onto main, as this rewrites public history.

---

## Daily Workflow

```
Morning:
  git checkout main && git pull
  git checkout <your-branch> && git merge main
  # Start work

During development:
  Commit frequently with descriptive messages:
    git commit -m "feat(citizen): add photo compression to SOS form"
    git commit -m "fix(backend): correct dispatch status after resource lock"
    git commit -m "docs(api): document /rescue-sites/rank response shape"

End of day:
  git push origin <your-branch>

When ready for review:
  Merge latest main → your branch
  Resolve conflicts locally
  Push
  Open PR with full checklist
```

---

## Commit Message Convention

Use the format:

```
type(area): short description
```

Types:
- `feat` — new feature
- `fix` — bug fix
- `docs` — documentation
- `refactor` — code restructure without feature change
- `test` — adding tests
- `chore` — dependency updates, config changes
- `style` — CSS / formatting (no logic change)

Areas: `citizen`, `volunteer`, `officer`, `gis`, `backend`, `auth`, `ai`, `demo`, `optimization`, `api`, `db`, `ws`, `docs`

Examples:
```
feat(citizen): implement offline SOS queue with localStorage
fix(backend): prevent double-dispatch of already-committed resources
docs(api): update /rescue-sites/rank contract with predicted_flood_m param
feat(ai): improve flood risk model with soil saturation weighting
feat(optimization): add counterfactual site comparison to ranking response
```

---

## Conflict Resolution

If two members both need to edit the same file at the same time:

1. **Stop.** Do not both edit it simultaneously.
2. **Decide:** Who is making the change? (Usually the file's owner.)
3. **Sequence:** One member finishes and merges first. The other rebases on top.
4. **Document:** Note the coordination in both PRs.

**"If two members need the same file, stop and coordinate before editing it."**

---

## Initial Branch Setup

To set up your branch from a fresh clone:

```bash
git clone <repo-url>
cd crisis-connect

# Member 1:
git checkout -b member1/citizen-volunteer
git push -u origin member1/citizen-volunteer

# Member 2:
git checkout -b member2/officer-gis
git push -u origin member2/officer-gis

# Member 3:
git checkout -b member3/backend
git push -u origin member3/backend

# Member 4:
git checkout -b member4/ai-data
git push -u origin member4/ai-data

# Member 5:
git checkout -b member5/optimization-demo
git push -u origin member5/optimization-demo
```
