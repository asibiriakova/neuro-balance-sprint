# Mindful Sprint

Create a modern, science-backed, minimalist web application called "NeuroSprint" for personal goal planning and neural regulation based on the Neurointegration methodology.

### Design System & Theme

* **Aesthetic:** Clean, calm, high-focus productivity interface (Linear / Raycast / Notion vibe).

* **Base Neutrals:** Crisp neutral backgrounds with subtle glassmorphic card borders.

* **NeuroBalance Zones & Exact State Color Tokens:**

  * **Burnout Zone (Hypoactivation / Freeze)**

    * `Apathy` (Апатия) $\rightarrow$ Deep Violet / Purple 

    * `Passivity` (Пассивность) $\rightarrow$ Sky Blue 

  * **Integration Zone (Optimal Window / Prefrontal Cortex Engagement)**

    * `Relaxation` (Расслабленность) $\rightarrow$ Teal / Cyan 

    * `Balance` (Баланс) $\rightarrow$ Vibrant Emerald Green 

    * `Engagement` (Включенность) $\rightarrow$ Amber Yellow

  * **Distress Zone (Hyperactivation / Amygdala Fight-or-Flight)**

    * `Overarousal` (Перевозбуждение) $\rightarrow$ Bright Orange 

    * `Panic` (Паника) $\rightarrow$ Crimson Red 

* **Icons & Animation:** Lucide-react icons, Framer Motion for smooth state needle movements, pulse rings, and modal transitions.

---

### Core Navigation & Layout

* **Global Floating Action Button (FAB):** Persistent in bottom-right corner marked as `SOS / Reset` to immediately open the Somatic SOS modal.

* **Top Navigation Bar:** Current Sprint cycle status (e.g., "Sprint #1: Day 8 of 21"), quick link to `Dashboard`, `Planning Canvas`, `Archive`, and an `Apple Reminders Sync Status` badge.

---

### Views & Pages

#### 1. Dashboard (`/`) — Daily Hub

* **Top Section: 1-Minute Daily Standup Widget**

  * Interactive **7-State NeuroBalance Speedometer Scale**:

    * Gauge arc color-coded from left to right: Violet (`Apathy`) $\rightarrow$ Blue (`Passivity`) $\rightarrow$ Teal (`Relaxation`) $\rightarrow$ Green (`Balance`) $\rightarrow$ Yellow (`Engagement`) $\rightarrow$ Orange (`Overarousal`) $\rightarrow$ Red (`Panic`).

    * Selecting a state moves the gauge needle, highlights the active zone card (Burnout / Integration / Distress), and changes dynamic accent highlights.

  * **Top 3 Priorities of the Day:** Quick checklist selecting 3 items from the active sprint backlog.

  * **Gratitude / Positivity Anchor:** Input field: *"Remarkable moment of the last 24 hours"* with a Save button.

* **Middle Section: Visual Analytics**

  * **21-Day NeuroBalance Heatmap:** Visual grid representing the 3 weeks of the sprint, color-coded by the 7 specific state colors.

  * **Time Budget Gauges:** 3 circular progress meters showing hours spent vs 10h limit per pillar (30h total sprint budget).

* **Bottom Section: Tri-Pillar Kanban View**

  * 3 columns representing the core pillars:

    1. 🛡️ **Foundation (Фундамент):** Health, sleep, physiology (Capped at 10h).

    2. ⚡ **Drive (Драйв):** Skills, ambitious leaps, career challenges (Capped at 10h).

    3. ✨ **Joy (Кайф):** Present-moment enjoyment, sensory recovery (Capped at 10h).

  * Task cards show title, estimated hours, and a checkbox to toggle completion.

#### 2. Sprint Planning Canvas (`/planning`) — Split-Screen Studio

* **Left Pane (40% width) — AI Planning Assistant:**

  * Conversational chat interface to brainstorm and decompose large monthly goals into micro-tasks.

  * Quick prompt chips: *"Decompose my fitness goal"*, *"Suggest 10h Drive backlog"*, *"Balance my cognitive load"*.

* **Right Pane (60% width) — Interactive Sprint Canvas:**

  * Dynamic sprint board where AI suggestions can be accepted into **Foundation**, **Drive**, or **Joy** with a single click.

  * Live aggregate hour calculator warning if any project exceeds 10 hours or total sprint exceeds 30 hours.

  * "Approve & Commit Sprint" action button with confirmation state.

#### 3. Transformational Reflection & Archive (`/reflection`)

* **AI-Guided 4-Step Wizard:**

  1. *Key Change Observed (Главное изменение)*

  2. *Actions Taken (Что я для этого сделал)*

  3. *Self-Insight (Что я понял о себе)*

  4. *Emerging Opportunities (Что теперь возможно для меня)*

* **Joy-Passana / Week 4 Configurator:**

  * Duration selector (3-4 hours, 1 day, 2 days, 3 days).

  * Pre-flight checklist: Silence notifications, meal planning, outdoor walks, creative hobbies.

* **Sprint Archive Table:** Historical list of past sprints with state logs and reflection cards.

#### 4. Global Somatic SOS Practices Modal (Overlay)

* Triggered via the global FAB or when entering Distress/Burnout on the standup scale.

* **Category Tabs:**

  * **Distress / Panic Reset (Orange / Red):**

    * *Physiological Sigh* (2-min guided breath circle animation: Double Inhale $\rightarrow$ Long Exhale).

    * *5-4-3-2-1 Sensory Grounding* (Interactive step-by-step checklist).

    * *Cold Vagus Stimulation* (Timer + guidance).

  * **Burnout / Freeze Reset (Violet / Blue):**

    * *Somatic Shaking* (3-min audio/timer metronome).

    * *Sensory Tea / Interoception Break* (5-min mindfulness timer).

    * *Brain Dump* (Distraction-free scratchpad with a "Burn / Archive" action)

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7c364c4c-fea8-464c-b13c-f2fdd15c7430).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
