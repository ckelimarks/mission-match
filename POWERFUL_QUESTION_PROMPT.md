# Powerful Question Generation Prompt

**Purpose:** Generate ONE multi-layered question that reveals mutual incompleteness and inspires deep collaboration.

---

## Prompt for Claude

```
You are analyzing two collaboration profiles to generate ONE powerful question that will catalyze meaningful partnership.

# INPUT DATA

## Person A Profile:
- Role: {role}
- Mission: {mission}
- Aspects:
  - Ideas: {score}/100 (Evidence: {proof})
  - Speed: {score}/100 (Evidence: {proof})
  - Structure: {score}/100 (Evidence: {proof})
  - Creative: {score}/100 (Evidence: {proof})
  - [... all other aspects]

## Person B Profile:
- Role: {role}
- Mission: {mission}
- Aspects:
  - Ideas: {score}/100 (Evidence: {proof})
  - Speed: {score}/100 (Evidence: {proof})
  - Structure: {score}/100 (Evidence: {proof})
  - Creative: {score}/100 (Evidence: {proof})
  - [... all other aspects]

---

# YOUR TASK

Generate ONE question that both people should discuss in their first conversation. This question must:

1. **Reveal mutual incompleteness** - Make each person realize what they're missing that the other provides
2. **Be purpose-driven** - About what they're trying to BUILD/CREATE/CHANGE, not about process
3. **Require vulnerability** - They must admit what they can't do alone
4. **Have teeth** - Provocative, cuts to the core, not surface-level
5. **Be multi-layered** - Works on tactical, strategic, and philosophical levels simultaneously

---

# ANALYSIS FRAMEWORK

## Step 1: Identify Core Tension

For each person, analyze:
- **High scores (80+):** What are they excellent at? What comes naturally?
- **Low scores (0-30):** What do they avoid/struggle with? What frustrates them?
- **Gap analysis:** Where is Person A strong and Person B weak? (and vice versa)

Example:
- Person A: High Ideas (88), Low Structure (45) → Frustrated by: "Ideas die because I can't systematize them"
- Person B: High Structure (95), Low Ideas (18) → Frustrated by: "Building perfect systems for unclear purposes"

## Step 2: Find the Mutual Incompleteness

What is each person STUCK ON that the other person SOLVES?

Example:
- Person A has: Ideas with no legs (can't execute reliably)
- Person B has: Legs with nowhere to run (executes well but lacks vision)
- Mutual need: A needs execution, B needs direction

## Step 3: Map Their Goals (From Mission/Role)

What is each person trying to ACHIEVE in the world?

Example:
- Person A mission: "Build AI tools that help people think better"
- Person B mission: "Create reliable systems that scale"
- Shared territory: Building tools that work at scale

## Step 4: Identify the Bottleneck

What's the ONE THING stopping each person from achieving their goal?

Example:
- Person A bottleneck: "I start 10 projects, finish 1, lose credibility"
- Person B bottleneck: "I build perfect infrastructure for products that never find users"

## Step 5: Craft the Question

Using this pattern:

**"If [CONSTRAINT removed by Person B], what would you [CONCRETE ACTION]? And if [CONSTRAINT removed by Person A], what would you [CONCRETE ACTION]?"**

The question should:
- **Be answerable through imagination** - Not "what's your bold move?" but "IF you had X, what WOULD you do?"
- **Remove a specific constraint** - That the other person actually solves
- **Ask for concrete action** - "What would you build/create/try/start?"
- **Mirror structure for both people** - Makes complementarity obvious
- **Trigger discovery, not recall** - They figure out the answer BY answering the question

---

# CRITICAL: MAKE IT ANSWERABLE

## ❌ UNANSWERABLE (Too Abstract)
"What bold move are you not making?"
→ Problem: Assumes they know what the bold move is

"What's stopping you from achieving your potential?"
→ Problem: Too vague, philosophical

"What are you avoiding?"
→ Problem: Requires deep self-awareness they may not have

## ✅ ANSWERABLE (Concrete Hypothetical)
"If you had someone to handle all the follow-through, what would you start?"
→ Works: Concrete constraint removed, concrete action requested

"If your calendar cleared for one week, what would you build?"
→ Works: Specific scenario, specific outcome

"If you could delegate the chaos, what would you create?"
→ Works: Clear trade-off, triggers imagination

**The key:** Start with "IF [thing other person provides]" then ask "WHAT WOULD YOU [do/build/create/try]?"

---

# EXAMPLES OF POWERFUL QUESTIONS

## Example 1: Ideator + Executor
**Pairing:**
- Person A: High Ideas (88), Low Structure (45)
- Person B: Low Ideas (18), High Structure (95)

**Question:**
"What's the one idea you've been sitting on because you don't trust yourself to execute it well—and what's the one system you've built that you wish had more vision behind it?"

**Why it works:**
- Layer 1 (Tactical): Reveals specific stuck projects
- Layer 2 (Strategic): Shows complementarity (A's idea + B's execution)
- Layer 3 (Purpose): Points to what they could build together
- Requires vulnerability: Admits incompleteness

---

## Example 2: Fast Mover + Deliberate Thinker
**Pairing:**
- Person A: High Speed (92), Low Planning (25)
- Person B: High Planning (90), Low Speed (20)

**Question:**
"What's the opportunity you're missing because you're moving too fast to see it—and what's the move you haven't made because you're still thinking about it?"

**Why it works:**
- Reveals Person A's blind spot (speed without sight)
- Reveals Person B's bottleneck (analysis paralysis)
- Shows how they balance each other
- Points to what they could capture together

---

## Example 3: Chaos Creator + System Builder
**Pairing:**
- Person A: Low Structure (15), High Creativity (88)
- Person B: High Structure (95), Low Risk Tolerance (20)

**Question:**
"What breakthrough are you avoiding because it would break your current systems—and what experiment are you afraid to run because you don't have a safety net?"

**Why it works:**
- Person A: Needs permission to build scaffolding
- Person B: Needs permission to take risks
- Shows how A provides innovation, B provides safety
- Creates a "we could do this TOGETHER" moment

---

# QUALITY CHECKS

Before outputting your question, verify:

✅ **Does it address BOTH people?** (not just one)
✅ **Does it require vulnerability?** (admitting what they can't do alone)
✅ **Is it purpose-driven?** (about goals, not process)
✅ **Does it have teeth?** (provocative, not generic)
✅ **Does it reveal complementarity?** (shows how they fit together)
✅ **Would it create an "oh shit" moment?** (realization of mutual need)

❌ **Avoid:**
- Tactical questions ("What's your workflow?")
- Binary questions ("Do you prefer X or Y?")
- Generic questions that work for anyone
- Questions about process/logistics
- Questions that don't reveal gaps

---

# OUTPUT FORMAT

Return ONLY the question. No preamble, no explanation. Just the question itself.

The question should be:
- 1-2 sentences maximum
- Uses em dash (—) to separate the two parts
- Addresses both people directly
- Ends with a question mark

Example output:
"What breakthrough are you avoiding because it would break your current systems—and what experiment are you afraid to run because you don't have a safety net?"

---

# NOW GENERATE THE QUESTION

Based on the profiles provided above, generate the ONE powerful question that will catalyze deep collaboration between these two people.
```

---

## How to Use This Prompt

1. **In Stage 1 Analysis:** After analyzing overlap, add this as a final step
2. **Input:** Both full profiles with aspects, scores, evidence, mission, role
3. **Output:** ONE question to display prominently on results page
4. **Placement:** Replace the "First Conversation Topics" section with this single powerful question

## Integration Example

```javascript
// In /api/analyze-handshake/route.ts

const powerfulQuestionPrompt = `
${POWERFUL_QUESTION_PROMPT}

Person A Profile:
${JSON.stringify(profileA, null, 2)}

Person B Profile:
${JSON.stringify(profileB, null, 2)}
`;

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4.5-20250514',
  max_tokens: 500,
  messages: [{
    role: 'user',
    content: powerfulQuestionPrompt
  }]
});

const powerfulQuestion = response.content[0].text;

// Return in analysis results
return {
  overlap: [...],
  conversation_starters: [...],
  powerful_question: powerfulQuestion // <-- NEW
};
```

---

## Expected Quality

**Good question:**
"What's the one thing you've been sitting on because you don't trust yourself to execute it—and what's the one system you've built that you wish had more vision behind it?"

**Bad question:**
"How do you prefer to communicate in a team setting?"

**The difference:**
- Good: Reveals incompleteness, requires vulnerability, shows mutual need
- Bad: Generic, tactical, could apply to anyone
