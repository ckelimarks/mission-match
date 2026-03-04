# TODO: Make Profile a Showcase (Not Just Assessment)

## The Problem

Current profile display feels like a personality assessment, not something you'd be proud to show people.

**What we lost:**
- Compelling showcase of shipped work
- Proof points with impact/evidence
- Portfolio-like feel
- "Here's what I've built" pride

**What it became:**
- Aspect scores without context
- Personality dimensions
- Working style metrics
- More Myers-Briggs, less portfolio

## The Original Vision

From early iterations, profiles were meant to showcase:

1. **Proof Points** - Things you've actually shipped
   - "Built the entire product roadmap process from scratch"
   - "Interviewed 43 users before writing a single line of spec"
   - Specific projects with impact metrics
   - URLs to live work

2. **Evidence-Based Aspects**
   - Not just "Process & Systems: 85"
   - But "Process & Systems: 85" BECAUSE "Created templates for PRDs, sprint planning, and retrospectives that the whole team still uses 2 years later"

3. **Concrete Examples**
   - Real projects
   - Specific outcomes
   - Measurable impact
   - Links to proof

## What Makes a Profile "Showcase-Worthy"

People are proud to share:
- ✅ "I built X and it got Y users"
- ✅ "Here's a project I shipped"
- ✅ "This is evidence of how I work"

People are NOT proud to share:
- ❌ "My process score is 85"
- ❌ "I'm 60% empathy"
- ❌ Generic dimension labels

---

## Examples of Great Profile Showcases (March 3, 2026)

### 1. mission-match-wizard.html (Best Proof Points Display)

**What Works:**
```html
<div class="spec-item">
    <div class="spec-label">Validated Output</div>
    <div class="proof-grid">
        <div class="proof-callout">
            <div class="proof-name">LoveNotes</div>
            <div class="proof-desc">
                AI relationship journal →
                2000+ messages exchanged →
                80-90% engagement rate →
                Production scale
            </div>
        </div>
        <div class="proof-callout">
            <div class="proof-name">Teaching</div>
            <div class="proof-desc">
                100+ students taught →
                9-10 NPS scores →
                Proven education impact
            </div>
        </div>
        <div class="proof-callout">
            <div class="proof-name">Podcast Farm</div>
            <div class="proof-desc">
                $360K revenue generated →
                Validated business model →
                AI automation
            </div>
        </div>
    </div>
</div>
```

**Key Insights:**
- **"Validated Output"** framing (not "Projects" or "Work History")
- **Visual proof grid** with cards
- **Arrow flow (→)** showing progression: What → Metrics → Outcome → Impact
- **Concrete numbers**: "2000+ messages", "$360K revenue"
- **Outcome-oriented**: "Production scale", "Proven impact", "Validated business model"

### 2. Travis Bonnet's Profile (travisbreaks.org/overture)

**What Works:**
- **Dell Technologies**: "Launched customer contact engine: $800M savings in year one"
- **Livid Instruments**: "362% funding ($145K raised, $40K goal hit on day one)"
- **Military**: "Distinguished Honor Graduate. Dodge Award recipient"

**Key Insights:**
- **Concrete outcomes + context** - Not "Led project" but "$800M savings in year one"
- **Narrative arc**: Mission → Proof → How to collaborate
- **Signal/Noise framework**: One thesis connecting all work ("Execution is technical. Scaling is psyche")
- **Every bullet answers "why does this matter?"**
- **Interactive protocol**: Visitors can copy a prompt and get analyzed compatibility
- **Proof structure**: What was done + Measurable impact + Why it matters

**What Makes It Compelling:**
1. Opens with mission statement
2. Proves ability through varied domains
3. Clarifies what collaboration looks like
4. Converts passive reading into active engagement

### 3. mission-match-redesign.html

**What Works:**
- Clean section hierarchy
- Proof points with evidence labels
- Visual separation between sections
- Professional showcase feel

---

## The Ideal Mission Match Profile Structure

Based on these examples, here's the hierarchy:

```
┌─────────────────────────────────────────────────┐
│ 1. HOOK (2 sentences)                           │
│    Mission + unique angle                       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 2. VALIDATED OUTPUT (Proof Points Grid) ★★★    │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ LoveNotes                                │  │
│  │ AI relationship journal →                │  │
│  │ 2000+ messages → 80-90% engagement →     │  │
│  │ Production scale                         │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ Teaching                                 │  │
│  │ 100+ students taught →                   │  │
│  │ 9-10 NPS scores →                        │  │
│  │ Proven education impact                  │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ Podcast Farm                             │  │
│  │ $360K revenue generated →                │  │
│  │ Validated business model →               │  │
│  │ AI automation                            │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 3. HOW I WORK                                   │
│    - The Vibe (1-2 sentences)                   │
│    - Core dimensions (with context)             │
│    - Distinctive edges (only if <30 or >70)     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 4. LOOKING FOR                                  │
│    - Specific collaborator type                 │
│    - Availability & stage                       │
│    - Work best with / Struggle with             │
│    - What I bring (concrete actions)            │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 5. CONTACT (after they're interested)           │
│    - Email, LinkedIn, etc.                      │
└─────────────────────────────────────────────────┘
```

**Key Principle:**
PROOF FIRST, then how you work, then who you're looking for.

People need to see what you've DONE before they care about your working style scores.

## Check: Did the Prompt Lose This?

The extraction prompt in `app/page.tsx` currently asks for:
```
"proof_points": [
  {"name": "Project", "description": "10 words max", "impact": "specific metrics", "reveals": "what this shows about working style"}
],
```

**This is good!** The prompt still asks for it.

**Question:** Is the profile DISPLAY showing these proof points prominently?

## What to Review Tomorrow

1. **Check the My Profile screen**
   - Does it showcase proof points prominently?
   - Are shipped projects front and center?
   - Does it feel like a portfolio or a test result?

2. **Check the Handshake Result page**
   - Are proof points visible in Stage 2?
   - Do you see actual work, or just scores?
   - Would someone be excited to share this view?

3. **Check the extraction prompt**
   - Are we asking for enough concrete examples?
   - Should we add "portfolio_url" or "github" or "live_demo"?
   - Do we need more emphasis on shipped work?

4. **Compare to redesign HTML**
   - Look at how mission-match-redesign.html displays profiles
   - What made those versions feel more showcase-worthy?
   - Can we port that visual hierarchy?

## Design Principles for Tomorrow

### Make It Portfolio-First
- Lead with "What I've Shipped"
- Then show "How I Work" (aspects)
- Then show "Who I Work Best With"

### Evidence Over Scores
```
BAD:  Process & Systems: 85
GOOD: Process & Systems: 85
      "Built the entire product roadmap process from scratch.
       Created templates for PRDs, sprint planning, and retrospectives
       that the whole team still uses 2 years later."
      — Q4 2024 Performance Review
```

### Add Visual Proof
- Link to live projects
- Screenshots if available
- GitHub repos
- Demo videos
- "View Project →" CTAs

### Make It Shareable
People should WANT to:
- Show this at networking events
- Send this to potential collaborators
- Include this in introductions
- Post screenshots of it

If they wouldn't share it, it's not good enough.

## Action Items for Tomorrow

- [ ] Review My Profile screen display
- [ ] Review Handshake Result Stage 2 display
- [ ] Check if proof_points are prominently shown
- [ ] Compare current vs. redesign HTML versions
- [ ] Consider adding "portfolio" section to profile
- [ ] Add "View Project" links if URLs exist
- [ ] Make shipped work more prominent than scores
- [ ] Test: Would YOU be proud to show this to someone?

## Reference: Original Aspect Evidence Structure

From early PRD/designs, each aspect had:
```
{
  "name": "Process & Systems Thinking",
  "score": 85,
  "description": "You consistently build and document repeatable workflows.",
  "evidence": {
    "label": "Evidence from Work History",
    "quote": "Built the entire product roadmap process from scratch. Created templates for PRDs, sprint planning, and retrospectives that the whole team still uses 2 years later.",
    "source": "— Q4 2024 Performance Review"
  }
}
```

**This is what makes it showcase-worthy** - the evidence, the quote, the source.

## The Test

Ask: "Would I screenshot this and send it to a potential co-founder?"

If not, it's assessment. If yes, it's showcase.

---

**Created:** March 3, 2026
**Priority:** High - Core to product value prop
**Next Review:** Tomorrow morning
