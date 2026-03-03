# Mission Match Flow

```mermaid
flowchart TD
    subgraph PRE["🏠 PRE-EVENT"]
        A1[Person A has Claude conversation]
        A2[A copies prompt to Mission Match]
        A3[A's profile created with QR code]
        A1 --> A2 --> A3
    end

    subgraph EVENT["🎪 AT THE EVENT"]
        E1[A shows QR code]
        E2[B scans QR code]
        E3{B has profile?}
        E4[B creates profile<br/>same copy/paste flow]
        E5[Handshake created<br/>between A & B]

        E1 --> E2 --> E3
        E3 -->|No| E4 --> E5
        E3 -->|Yes| E5
    end

    subgraph S1["📋 STAGE 1: PUBLIC ACCESS"]
        S1A[Both see Stage 1 Results]
        S1B[✓ Shared interests]
        S1C[✓ Conversation starter question]
        S1D[✗ Names hidden]
        S1E[✗ Contact info locked]

        S1A --> S1B & S1C & S1D & S1E
    end

    subgraph CONSENT["🔐 CONSENT GATE"]
        C1[A grants consent]
        C2[B grants consent]
        C3{Both consented?}

        C1 & C2 --> C3
    end

    subgraph S2["🤝 STAGE 2: FULL ACCESS"]
        S2A[Full profiles unlocked]
        S2B[✓ Names revealed]
        S2C[✓ Email, phone, LinkedIn]
        S2D[✓ Radar chart comparison]
        S2E[✓ Complementarity map]

        S2A --> S2B & S2C & S2D & S2E
    end

    subgraph PRIO["🎯 PRIORITIZATION"]
        P1[Quick Pick: 4 questions]
        P2[RPG: Distribute 10 points]
        P3[Alignment insights]

        P1 & P2 --> P3
    end

    A3 --> E1
    E5 --> S1A
    S1A --> C1 & C2
    C3 -->|No| S1A
    C3 -->|Yes| S2A
    S2A --> P1 & P2
```

## Key Points

### Two-Stage Consent Model
Like Slack bot permissions - you see what you're granting before you grant it.

| Stage | What's Visible | What's Hidden |
|-------|---------------|---------------|
| Stage 1 | Aspects, interests, question | Name, email, phone, LinkedIn |
| Stage 2 | Everything | Nothing |

### Profile Creation
Both people need profiles. The flow supports:
- **A prepared**: Created profile before event
- **B spontaneous**: Creates profile after scanning A's QR

### The "Handshake"
When B scans A's QR, the system creates a handshake record linking both profiles. This triggers:
1. Stage 1 analysis (AI generates shared interests + question)
2. Consent tracking (who has granted what)
3. Stage 2 unlock when both consent

### Prioritization (Post-Consent)
After full access, both can reveal collaboration priorities:
- **Quick Pick**: Fast 4-question multiple choice
- **RPG Mode**: Distribute 10 points across 5 priorities
- **Output**: Alignment/divergence insights for first conversation
