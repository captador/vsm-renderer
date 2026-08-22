# VSM Notation Standard

**Version:** 1.1  
**License:** EUPL-1.2

This document is the authoritative, **implementation-independent** specification for rendering the Viable System Model (VSM). Any rendering library — React, Vue, Canvas, SVG, PDF — that claims VSM Notation 1.1 compliance must conform to this spec.

---

## 1. Non-negotiable principles

1. **Recursion-first.** The VSM is one structure repeated at every scale, not a 5-box hierarchy. Every level renders identically; navigating between levels is the core interaction.
2. **Never omit System 3\*.** Systems are **1, 2, 3, 3\*, 4, 5**. A diagram without 3\* is incorrect.
3. **Pixel-faithful shapes.** Use the exact shapes, sides, and colours specified below. Do not invent new visual elements.
4. **Not an org chart.** Recursion levels are containment (viable systems inside viable systems), not command hierarchy.
5. **Distinguish S1 from support.** Operational units (S1) and support functions (S2–S5) are categorically different.

---

## 2. Systems — semantics

| System | Name              | Role                                                                                             |
| ------ | ----------------- | ------------------------------------------------------------------------------------------------ |
| S1     | Operations        | Primary value-producing units. Each is itself a complete viable system.                          |
| S2     | Coordination      | Damps oscillation and conflict between S1 units (shared standards, scheduling).                  |
| S3     | Control           | Runs the inside as a whole; allocates resources; optimises the S1 collective.                    |
| S3\*   | Audit             | Sporadic direct probe into operations that **bypasses** the command line to verify ground truth. |
| S4     | Intelligence      | Looks outside and ahead; models the future; adapts.                                              |
| S5     | Policy / Identity | Ethos, identity, final arbiter; balances S3 (now) vs S4 (future).                                |

**Groupings:** S1+S2+S3+S3\* = _operative management_. S3↔S4 = _strategic_. S5 = _normative_.

---

## 3. Visual element catalog

Draw each element exactly as specified. **Sides matter:** S3\* is always LEFT, S2 is always RIGHT.

### 3.1 Metasystem nodes (one per level)

| Element    | Shape                               | Fill      | Label         | Notes                                                                          |
| ---------- | ----------------------------------- | --------- | ------------- | ------------------------------------------------------------------------------ |
| System 5   | Rounded rectangle, wide             | `#A0C0D5` | "5" (white)   | Top of diagram; two arms curve down both sides embracing the operations column |
| System 4   | Rounded rectangle                   | `#7BCA79` | "4" (white)   | Below S5                                                                       |
| System 3   | Rounded rectangle                   | `#FF5534` | "3" (white)   | Below S4                                                                       |
| System 3\* | **Inverted** triangle (▽), tip down | `#FF5534` | "3\*" (white) | **Left side**, below S3                                                        |
| System 2   | **Upward** triangle (△), tip up     | `#FFCC50` | "2" (white)   | **Right side**, below S3                                                       |

### 3.2 Operational nodes (one set per S1 unit, repeated N times)

| Element       | Shape             | Fill      | Stroke    | Notes                                              |
| ------------- | ----------------- | --------- | --------- | -------------------------------------------------- |
| S1 operation  | Circle            | `#FFFFFF` | `#9A9A9A` | Value-producing process; labelled "1a", "1b", …    |
| S1 management | Rounded rectangle | `#FFFFFF` | `#9A9A9A` | Positioned diagonally upper-right of the op circle |

**S1 diagonal layout:** the management square sits at a ~42° offset above and to the right of its operation circle. The two are connected by a diagonal line. This arrangement saves vertical space while preserving the Beer notation distinction between operation and management.

**Holon indicator:** if an S1 unit contains a nested VSM (i.e. it is a _holon_), both its operation circle, management square, and the connecting diagonal line are drawn with a **thicker stroke** (~3.5 px vs ~2 px for leaf units). No additional icon is shown.

### 3.3 Environment nodes

| Element             | Shape                      | Fill                     | Notes                                            |
| ------------------- | -------------------------- | ------------------------ | ------------------------------------------------ |
| Outer environment   | Large organic amoeba/cloud | `#D7D7D7` at 50% opacity | Encompasses all S1 sub-environments              |
| S1 sub-environment  | Organic blob per unit      | `#8F8F8F`                | One per S1 unit; positioned left of the unit row |
| Future environment  | Organic cloud              | `#A2DAA0`                | Top of environment column; scanned by S4         |
| Environment overlap | Amber lens/eye shape       | `#FFCC50`                | Between adjacent S1 sub-environments             |

---

## 4. Color palette (exact hex values)

```
System 5 / Policy         #A0C0D5  (light blue)
System 4 / Intelligence   #7BCA79  (green)
System 3 / Control        #FF5534  (red — also S3*)
System 2 / Coordination   #FFCC50  (amber — also resource ladder, squiggles, env overlaps)
Future environment        #A2DAA0  (pale green)
Navy connectors           #1D3880
Environment amoeba outer  #D7D7D7
S1 sub-environment blobs  #8F8F8F
Element stroke / outlines #9A9A9A
S1 operation / mgmt fill  #FFFFFF
Amplifier arrows          #333333
White labels on shapes    #FFFFFF
Algedonic bypass          #C0399F  (magenta)
```

---

## 5. Communication channels (a–g)

Channels are the connective tissue of the VSM. Each must be **independently toggleable**.

| ID    | Name                     | Visual                                                                                              | Color     | Connects                                            |
| ----- | ------------------------ | --------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------- |
| **a** | Environmental overlaps   | Amber lens shape (filled ellipse)                                                                   | `#FFCC50` | Adjacent S1 sub-environments                        |
| **b** | System 3\* audit         | Vertical spine from S3\* triangle down + horizontal branch into each S1 **ops circle**              | `#FF5534` | S3\* → each S1 ops circle only                      |
| **c** | Operational dependencies | Wavy vertical arrows between adjacent S1 ops circles                                                | `#FFCC50` | Adjacent S1 ops circles                             |
| **d** | Resource bargain         | Vertical line (right side) with horizontal rung at each S1 **mgmt square** row                      | `#FF5534` | S3 ↔ each S1 mgmt square                            |
| **e** | Command / intervention   | Vertical line (left side) from S3 down to bottom S1 mgmt level                                      | `#FF5534` | S3 → S1 mgmt column                                 |
| **f** | S2 coordination          | Vertical spine from S2 triangle down + horizontal rungs into each S1 **mgmt square AND ops circle** | `#FFCC50` | S2 → each S1 mgmt square **and** each S1 ops circle |
| **g** | Algedonic bypass         | Dashed magenta path; default **off**                                                                | `#C0399F` | S1 ops → S5 (unidirectional upward alarm)           |

**Channel g routing:** originates at the left edge of the bottom-most S1 ops circle, routes horizontally left to a vertical column positioned **between the environment blob column and the S3\* triangle** (in the narrow gap between them), then runs straight up to the S5 midline and enters the S5 bar from the left. The signal is **unidirectional upward** — it bypasses S2, S3, S4 to deliver a threshold alarm directly to S5. Any response returns via normal command channels, not via this path.

**Channel f note (Beer notation):** S2 (Coordination) connects to both the **management** and **operation** poles of each S1 unit. This reflects Beer's rule that coordination signals must reach both the governing function and the operational process.

**Additional structural connectors** (always visible, not toggled):

| Name                   | Visual                          | Color                           | Connects                             |
| ---------------------- | ------------------------------- | ------------------------------- | ------------------------------------ |
| S3↔S4 homeostat        | Cubic Bézier curls              | Red `#FF5534` + Green `#7BCA79` | S3 ↔ S4 (bidirectional)              |
| S5 arms                | Curved paths                    | `#A0C0D5`                       | S5 rectangle curling down both sides |
| S4 ↔ future env        | Double-headed Bézier arcs       | `#7BCA79`                       | S4 ↔ future environment blob         |
| Amplifier / attenuator | Double-headed horizontal arrows | `#333333`                       | Each S1 env blob ↔ its ops circle    |
| S3→S3\* feed           | Elbow line                      | `#FF5534`                       | S3 bar → S3\* triangle               |
| S3→S2 feed             | Elbow line                      | `#FFCC50`                       | S3 bar → S2 triangle                 |

---

## 6. Canonical layout

Use a **portrait** canvas with approximate proportions matching `viewBox="0 0 900 1100"`. Three columns:

```
┌──────────────┬────────────────────────────────────┐
│ ENVIRONMENT  │          THE SYSTEM (R0)           │
│  (~30% wide) │                                    │
│              │   ┌──────── S5 ───────┐            │  ← wide rounded rect; arms curve down
│  green cloud ◄── │──┌───── S4 ────┐  │            │
│  (future)    │   └──└───── S3 ────┘──┘ [homeostat]│
│              │   ▽ S3*    ║ ↕ ║     S2 △          │  ← S3* LEFT, S2 RIGHT
│              │            ║   ║                   │
│  gray amoeba │    ○ op ╲  ║   ║  ╱─── S2 rung    │  ← diagonal: op circle lower-left
│  ┌─blob 1a◄──┼──►        □ mgmt ────── S2 rung   │    mgmt square upper-right
│              │    ○ op ╲  ║   ║  ╱─── S2 rung    │
│  ┌─blob 1b◄──┼──►        □ mgmt ────── S2 rung   │
│              │    ○ op ╲  ║   ║  ╱─── S2 rung    │
│  ┌─blob 1c◄──┼──►        □ mgmt ────── S2 rung   │
└──────────────┴────────────────────────────────────┘
 ↑ algedonic (g)      ↑ amplifier/attenuator arrows (double-headed, black)
   far-left dashed
```

**Vertical order top→bottom:** S5 → S4 → S3 → (S3\* left, S2 right) → S1 units stack.

**S1 unit spacing:** leave enough vertical gap between the S3/S3\*/S2 band and the first S1 unit to avoid visual crowding of the mgmt squares.

---

## 7. Interactivity

All clickable elements must indicate their interactivity through **hover color tint** alone — no additional icons or badges. A lighter fill on mouse-enter is sufficient affordance.

| Element         | Hover affordance                                           | Click action                              |
| --------------- | ---------------------------------------------------------- | ----------------------------------------- |
| S5, S4, S3 bars | Lighter fill tint                                          | Emit `click:s5` / `click:s4` / `click:s3` |
| S3\* triangle   | Lighter fill tint                                          | Emit `click:s3star`                       |
| S2 triangle     | Lighter fill tint                                          | Emit `click:s2`                           |
| S1 unit         | Both circle and square get tint; full name tooltip appears | Emit `click:s1` with index and unit data  |
| Env blob        | Lighter fill tint                                          | Emit `click:env` with index and env data  |
| Future env blob | Lighter fill tint                                          | Emit `click:futureEnv`                    |

**Selection highlight:** the most recently clicked element receives a dashed-border overlay (navy, dash 6/4) drawn on a dedicated top layer, padding the element's exact outline by ~3 px. The highlight is cleared on re-render and on drill-down/up.

---

## 8. Recursion model

- **R+1**: the system that contains the current one.
- **R0**: the **System in Focus (SIF)** — the level currently rendered.
- **R-1**: the S1 sub-units; each unfolds into its own full VSM.
- **Drill down**: the host application navigates to a child VSM and calls `setSystem()` on the renderer.
- **Zoom out**: navigating to an ancestor similarly calls `setSystem()` with the parent VSM.
- **Breadcrumb**: always show `R+1 ▸ R0 (SIF) ▸ R-1` path in the host UI.
- **Self-similarity**: every level renders with the identical structure. No special top level.
- **Holon visual cue**: S1 units that contain a child VSM are drawn with thicker borders to signal drillability.

---

## 9. Structural constraints

- **Exactly one** S2, S3, S3\*, S4, S5 node per recursion level.
- **Exactly one** future-environment node per recursion level.
- **N ≥ 1** S1 units and corresponding sub-environment nodes (N determines the layout height).
- S1 units are labelled 1a, 1b, 1c, … (alpha suffix, wrapping after z).

---

## 10. Info-panel copy (per element)

| Element              | Copy                                                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| S5 — Policy/Identity | Ultimate authority and identity. Sets policy, holds the ethos, balances present (S3) vs future (S4). Governs by exception.   |
| S4 — Intelligence    | Scans the outside and the future; models options; adapts. Bridges the inside (S3) with the environment.                      |
| S3 — Control         | Runs the whole S1 complex here and now; allocates resources; drives synergy.                                                 |
| S3\* — Audit         | Sporadic, direct probe into operations that bypasses the command line to verify reality. Without it, S3 has no check.        |
| S2 — Coordination    | Damps oscillation and conflict between units via shared standards and scheduling. Reduces load on S3.                        |
| S1 — Operation       | A primary value-producing unit. Itself a complete viable system — drill down to unfold.                                      |
| Environment          | Each unit has its own local environment; these overlap (amber lenses). S4 additionally scans the future environment (green). |
