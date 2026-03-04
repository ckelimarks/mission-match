'use client';

import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';

// ============================================================================
// DATA MODELS (Will map to API calls later)
// ============================================================================

interface Profile {
  name: string;
  role: string;
  aspects: { name: string; score: number }[];
  radar: { process: number; empathy: number; org: number; speed: number; vision: number; bold: number };
  contact: { email: string; phone: string; linkedin: string };
}

const PROFILES: Record<string, Profile> = {
  jordan: {
    name: "JORDAN LEE",
    role: "Senior Product Manager",
    aspects: [
      { name: "Process & Systems", score: 85 },
      { name: "Empathy", score: 60 },
      { name: "Organization", score: 88 }
    ],
    radar: { process: 85, empathy: 60, org: 88, speed: 92, vision: 45, bold: 78 },
    contact: { email: "jordan@example.com", phone: "+1 555-123-4567", linkedin: "jordanlee" }
  },
  darius: {
    name: "DARIUS WEBB",
    role: "Founder & CEO",
    aspects: [
      { name: "Vision & Strategy", score: 92 },
      { name: "Bold Moves", score: 88 },
      { name: "Creative Strategy", score: 90 }
    ],
    radar: { process: 25, empathy: 90, org: 18, speed: 15, vision: 92, bold: 88 },
    contact: { email: "darius@visionlabs.io", phone: "+1 555-987-6543", linkedin: "dariuswebb" }
  }
};

const ANALYSIS = {
  shared: ["Building products", "AI accessibility", "Mentorship"],
  question: "If you had someone to turn your ideas into systematic processes — what would you finally build?",
  complementarity: {
    jordan: ["Process (85)", "Speed (92)", "Organization (88)"],
    darius: ["Vision (92)", "Bold (88)", "Empathy (90)"],
    together: "Visionary Strategy + Execution Discipline"
  }
};

const QUICK_PICK = [
  { q: "What type of collaboration?", options: ["Build a product", "Research/explore", "Creative project", "Business venture"] },
  { q: "Work style preference?", options: ["Technical co-founder", "Design partner", "Strategy advisor", "Ops support"] },
  { q: "Time commitment?", options: ["Full-time sprint", "Nights & weekends", "Casual exploration", "One-off project"] },
  { q: "Primary goal?", options: ["Ship a product", "Learn new skills", "Expand network", "Generate revenue"] }
];

const PRIORITIES = ["Shipping fast", "Quality & craft", "Learning", "Revenue", "Fun & creativity"];

// Evidence for profile aspects
const ASPECT_EVIDENCE = [
  {
    name: "Process & Systems Thinking",
    score: 85,
    description: "You consistently build and document repeatable workflows. Strong evidence of systematic thinking.",
    evidence: {
      label: "Evidence from Work History",
      quote: "Built the entire product roadmap process from scratch. Created templates for PRDs, sprint planning, and retrospectives that the whole team still uses 2 years later.",
      source: "— Q4 2024 Performance Review"
    }
  },
  {
    name: "Empathy & User Understanding",
    score: 60,
    description: "Deep commitment to understanding user needs. You conduct thorough research before building.",
    evidence: {
      label: "Evidence from Projects",
      quote: "Interviewed 43 users before writing a single line of spec. Discovered the feature we planned to build would solve the wrong problem.",
      source: "— Case Study: HealthTech Redesign 2024"
    }
  },
  {
    name: "Organization & Follow-Through",
    score: 88,
    description: "You excel at tracking complex projects and ensuring nothing falls through the cracks.",
    evidence: {
      label: "Evidence from Teammates",
      quote: "Jordan is the person you want running point on cross-functional initiatives. Never drops a ball. Always knows status without having to ask.",
      source: "— Peer Review, Engineering Lead"
    }
  }
];

type Screen = 'home' | 'create-profile' | 'my-profile' | 'scanned-qr' | 'my-connections' | 'stage1' | 'stage2' | 'prioritization';

// The extraction prompt for users to copy
const EXTRACTION_PROMPT = `You're creating a collaboration profile for me based on everything you know from our conversations.

Goal: Help potential collaborators decide "Should I reach out?" in 30 seconds.

Return JSON with these fields:
{
  "hook": "2 sentences max - what you're building and your unique angle",
  "proof_points": [
    {"name": "Project", "description": "10 words max", "impact": "specific metrics", "reveals": "what this shows about working style"}
  ],
  "working_style": {
    "core_dimensions": {
      "sync_async": {"score": 0-100, "confidence": "high/medium/low", "proof": "behavioral evidence"},
      "fast_ship_high_polish": {"score": 0-100, "confidence": "high/medium/low", "proof": "..."},
      "solo_multiplier": {"score": 0-100, "confidence": "high/medium/low", "proof": "..."},
      "builder_strategist": {"score": 0-100, "confidence": "high/medium/low", "proof": "..."}
    },
    "vibe": "1-2 sentences describing collaboration texture"
  },
  "collaboration_fit": {
    "looking_for": "specific collaborator type",
    "availability": "co-founder/project partner/advisor/one-time",
    "stage": "exploring/building/scaling",
    "work_best_with": ["trait 1", "trait 2"],
    "struggle_with": ["real friction point"],
    "what_i_bring": ["concrete offering 1", "concrete offering 2"],
    "best_way_to_engage": "how to reach out"
  },
  "profile_confidence": 1-5,
  "contact": {"email": "...", "linkedin": "..."}
}

Be specific, not vague. Extract from our actual conversations.`;

// Real connections are fetched from the API via the connections state

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DemoPage() {
  const [screen, setScreen] = useState<Screen>('home');
  const [viewingAs, setViewingAs] = useState<'A' | 'B'>('A'); // Toggle between Person A and B perspectives
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [quickPickAnswers, setQuickPickAnswers] = useState<(string | null)[]>([null, null, null, null]);
  const [priorityTab, setPriorityTab] = useState<'quick' | 'rpg'>('quick');

  // Profile creation state
  const [profileJson, setProfileJson] = useState('');
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [createProfileError, setCreateProfileError] = useState<string | null>(null);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<typeof PROFILES.jordan | null>(null);
  const [myFullProfile, setMyFullProfile] = useState<any>(null); // Full profile from API
  const [promptCopied, setPromptCopied] = useState(false);
  const [pointAllocation, setPointAllocation] = useState<number[]>([2, 2, 2, 2, 2]);
  const [consentGranted, setConsentGranted] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);

  // Load profile from localStorage and fetch from API
  useEffect(() => {
    const consent = localStorage.getItem('mm_consent');
    if (consent === 'granted') {
      setConsentGranted(true);
      setScreen('stage2');
    }

    // Check if we have a stored profile ID
    const storedProfileId = localStorage.getItem('mm_profile_id');
    if (storedProfileId) {
      setMyProfileId(storedProfileId);
      fetchMyProfile(storedProfileId);
    }
  }, []);

  // Fetch connections when profile is loaded (polling every 10s)
  useEffect(() => {
    if (!myProfileId) return;

    const fetchConnections = async () => {
      setIsLoadingConnections(true);
      try {
        const response = await fetch(`/api/get-pending-connections?profileId=${myProfileId}`);
        if (response.ok) {
          const data = await response.json();
          setConnections(data.connections || []);
        }
      } catch (error) {
        console.error('Failed to fetch connections:', error);
      } finally {
        setIsLoadingConnections(false);
      }
    };

    fetchConnections();
    const interval = setInterval(fetchConnections, 10000);
    return () => clearInterval(interval);
  }, [myProfileId]);

  const fetchMyProfile = async (profileId: string) => {
    setIsLoadingProfile(true);
    try {
      const response = await fetch(`/api/get-profile?profileId=${profileId}`);
      if (response.ok) {
        const profile = await response.json();
        setMyFullProfile(profile);

        // Map to display format
        setMyProfile({
          name: profile.display_name?.toUpperCase() || profile.hook?.split('.')[0]?.toUpperCase() || 'YOUR PROFILE',
          role: profile.role || profile.collaboration_fit?.looking_for || 'Builder',
          aspects: [
            { name: 'Sync ↔ Async', score: profile.working_style?.core_dimensions?.sync_async?.score || 50 },
            { name: 'Ship ↔ Polish', score: profile.working_style?.core_dimensions?.fast_ship_high_polish?.score || 50 },
            { name: 'Solo ↔ Multiplier', score: profile.working_style?.core_dimensions?.solo_multiplier?.score || 50 },
          ],
          radar: {
            process: profile.working_style?.core_dimensions?.sync_async?.score || 50,
            empathy: 50,
            org: profile.working_style?.core_dimensions?.solo_multiplier?.score || 50,
            speed: profile.working_style?.core_dimensions?.fast_ship_high_polish?.score || 50,
            vision: profile.working_style?.core_dimensions?.builder_strategist?.score || 50,
            bold: 50,
          },
          contact: profile.contact || {},
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleGrantConsent = () => {
    localStorage.setItem('mm_consent', 'granted');
    setConsentGranted(true);
    setShowConsentModal(false);
    setScreen('stage2');
  };

  const handleResetDemo = () => {
    localStorage.removeItem('mm_consent');
    localStorage.removeItem('mm_profile_id');
    setConsentGranted(false);
    setScreen('home');
    setViewingAs('A');
    setQuickPickAnswers([null, null, null, null]);
    setPointAllocation([2, 2, 2, 2, 2]);
    setMyProfileId(null);
    setMyProfile(null);
    setProfileJson('');
    setCreateProfileError(null);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(EXTRACTION_PROMPT);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  };

  const handleCreateProfile = async () => {
    if (!profileJson.trim()) {
      setCreateProfileError('Please paste your profile JSON');
      return;
    }

    setIsCreatingProfile(true);
    setCreateProfileError(null);

    try {
      // Send raw text to API - server handles sanitization and parsing
      const response = await fetch('/api/save-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileData: profileJson }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create profile');
      }

      const data = await response.json();
      const profileData = data.profile;

      // Store profile ID
      localStorage.setItem('mm_profile_id', data.profileId);
      localStorage.setItem('mm_device_id', data.deviceId);
      setMyProfileId(data.profileId);
      setMyFullProfile(profileData);

      // Create a display profile from the returned data
      setMyProfile({
        name: profileData.role?.split('.')[0]?.toUpperCase() || 'YOUR PROFILE',
        role: profileData.mission || 'Builder',
        aspects: [
          { name: 'Sync ↔ Async', score: profileData.role_aspects?.core_dimensions?.sync_async?.score || 50 },
          { name: 'Ship ↔ Polish', score: profileData.role_aspects?.core_dimensions?.fast_ship_high_polish?.score || 50 },
          { name: 'Solo ↔ Multiplier', score: profileData.role_aspects?.core_dimensions?.solo_multiplier?.score || 50 },
        ],
        radar: {
          process: profileData.working_style?.core_dimensions?.sync_async?.score || 50,
          empathy: 50,
          org: profileData.role_aspects?.core_dimensions?.solo_multiplier?.score || 50,
          speed: profileData.role_aspects?.core_dimensions?.fast_ship_high_polish?.score || 50,
          vision: profileData.role_aspects?.core_dimensions?.builder_strategist?.score || 50,
          bold: 50,
        },
        contact: profileData.communication_aspects || {},
      });

      setScreen('my-profile');
    } catch (err) {
      console.error('Profile creation error:', err);
      setCreateProfileError(err instanceof Error ? err.message : 'Invalid JSON format');
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const handleQuickPick = (questionIndex: number, answer: string) => {
    const newAnswers = [...quickPickAnswers];
    newAnswers[questionIndex] = answer;
    setQuickPickAnswers(newAnswers);
  };

  const handlePointChange = (index: number, delta: number) => {
    const total = pointAllocation.reduce((a, b) => a + b, 0);
    const newVal = pointAllocation[index] + delta;
    if (newVal >= 0 && newVal <= 10 && (total + delta <= 10 || delta < 0)) {
      const newAlloc = [...pointAllocation];
      newAlloc[index] = newVal;
      setPointAllocation(newAlloc);
    }
  };

  const totalPoints = pointAllocation.reduce((a, b) => a + b, 0);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      {/* Background elements */}
      <div className="grid-overlay" />
      <div className="floating-orb-cyan" />
      <div className="floating-orb-red" />

      <div className="container">
        {/* Navigation */}
        <nav>
          <div className="logo">
            <img src="/mm2-logo.png" alt="MM" style={{ width: '80px', height: 'auto' }} />
            <span>Mission Match</span>
          </div>
          <div className="nav-links">
            <button onClick={() => setScreen('home')} className={screen === 'home' ? 'active' : ''}>
              Home
            </button>
            <button onClick={() => setScreen('my-profile')} className={screen === 'my-profile' ? 'active' : ''}>
              My Profile
            </button>
            <button onClick={() => setScreen('my-connections')} className={screen === 'my-connections' ? 'active' : ''}>
              Connections
            </button>
            <button onClick={() => setScreen('scanned-qr')} className={screen === 'scanned-qr' ? 'active' : ''}>
              B Scans
            </button>
            <button onClick={() => setScreen('stage1')} className={screen === 'stage1' ? 'active' : ''}>
              Stage 1
            </button>
            <button
              onClick={() => consentGranted && setScreen('stage2')}
              className={`${screen === 'stage2' ? 'active' : ''} ${!consentGranted ? 'disabled' : ''}`}
            >
              Stage 2
            </button>
            <button
              onClick={() => consentGranted && setScreen('prioritization')}
              className={`${screen === 'prioritization' ? 'active' : ''} ${!consentGranted ? 'disabled' : ''}`}
            >
              Prioritize
            </button>
          </div>
        </nav>

        {/* SCREEN: Home */}
        {screen === 'home' && (
          <div className="screen active">
            <div className="hero">
              <div className="hero-badge">Human Collaboration Protocol</div>
              <h1>Find your people. Own your data.</h1>
              <p className="description">
                Your AI already knows your work patterns, goals, and collaboration style.
                Extract that knowledge, make it portable, and find the right collaborators instantly.
              </p>
              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn" onClick={() => setScreen('create-profile')}>
                  Create My Profile →
                </button>
                {myProfileId && (
                  <button className="btn btn-secondary" onClick={() => setScreen('my-profile')}>
                    View My Profile
                  </button>
                )}
              </div>
            </div>

            {/* Two-Stage Consent Flow - Commented out (too distracting) */}
            {/* <div className="section">
              <h2 className="section-header"><span className="icon">◈</span> Two-Stage Consent Flow</h2>
              <div className="flow-diagram">
                <div className="flow-step">
                  <div className="flow-step-number">1</div>
                  <div className="flow-step-content">
                    <h4>A Shows QR</h4>
                    <p>Person A displays their QR code at an event</p>
                  </div>
                </div>
                <div className="flow-arrow">→</div>
                <div className="flow-step">
                  <div className="flow-step-number">2</div>
                  <div className="flow-step-content">
                    <h4>B Scans</h4>
                    <p>Person B scans and creates their profile</p>
                  </div>
                </div>
                <div className="flow-arrow">→</div>
                <div className="flow-step">
                  <div className="flow-step-number">3</div>
                  <div className="flow-step-content">
                    <h4>Stage 1: Public</h4>
                    <p>Both see shared interests, conversation starters. Names hidden.</p>
                  </div>
                </div>
                <div className="flow-arrow">→</div>
                <div className="flow-step">
                  <div className="flow-step-number">4</div>
                  <div className="flow-step-content">
                    <h4>Mutual Consent</h4>
                    <p>Both grant consent to unlock full profiles</p>
                  </div>
                </div>
                <div className="flow-arrow">→</div>
                <div className="flow-step">
                  <div className="flow-step-number">5</div>
                  <div className="flow-step-content">
                    <h4>Stage 2: Full</h4>
                    <p>Contact info, radar chart, complementarity revealed</p>
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        )}

        {/* SCREEN: Create Profile */}
        {screen === 'create-profile' && (
          <div className="screen active">
            <div className="results-header">
              <div className="results-header-label">
                Create Your Collaboration Profile
              </div>
              <h1 className="results-title" style={{ textAlign: 'center', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                Extract Your Profile from AI
              </h1>
              <p className="results-subtitle" style={{ textAlign: 'center' }}>
                Your AI already knows you. Let's make that knowledge portable.
              </p>
            </div>

            <div className="create-profile-steps">
              {/* Step 1: Copy Prompt */}
              <div className="create-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Copy this prompt</h3>
                  <div className="prompt-box">
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', lineHeight: '1.5' }}>
                      {EXTRACTION_PROMPT}
                    </pre>
                  </div>
                  <button
                    className={`btn ${promptCopied ? 'btn-success' : ''}`}
                    onClick={handleCopyPrompt}
                    style={{ marginTop: '15px' }}
                  >
                    {promptCopied ? '✓ Copied!' : 'Copy Prompt'}
                  </button>
                </div>
              </div>

              {/* Step 2: Paste to AI */}
              <div className="create-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Paste to your AI assistant</h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '15px' }}>
                    Open ChatGPT or Claude where you have conversation history, paste the prompt, and copy the JSON response.
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <a
                      href="https://chat.openai.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ flex: 1, textAlign: 'center' }}
                    >
                      Open ChatGPT
                    </a>
                    <a
                      href="https://claude.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ flex: 1, textAlign: 'center' }}
                    >
                      Open Claude
                    </a>
                  </div>
                </div>
              </div>

              {/* Step 3: Paste JSON */}
              <div className="create-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Paste the JSON response</h3>
                  <textarea
                    value={profileJson}
                    onChange={(e) => setProfileJson(e.target.value)}
                    placeholder="Paste the JSON response from your AI here..."
                    className="json-textarea"
                    style={{
                      width: '100%',
                      minHeight: '200px',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(78, 205, 196, 0.3)',
                      borderRadius: '8px',
                      padding: '15px',
                      color: '#fff',
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '13px',
                      resize: 'vertical',
                    }}
                  />

                  {createProfileError && (
                    <div className="error-message" style={{
                      marginTop: '15px',
                      padding: '15px',
                      background: 'rgba(255, 107, 107, 0.1)',
                      border: '1px solid #ff6b6b',
                      borderRadius: '8px',
                      color: '#ff6b6b',
                    }}>
                      {createProfileError}
                    </div>
                  )}

                  <button
                    className="btn"
                    onClick={handleCreateProfile}
                    disabled={isCreatingProfile || !profileJson.trim()}
                    style={{ marginTop: '20px', width: '100%' }}
                  >
                    {isCreatingProfile ? 'Creating Profile...' : 'Create Profile →'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN: My Connections (A sees who connected) */}
        {screen === 'my-connections' && (
          <div className="screen active">
            <div className="results-header">
              <div className="results-header-label">
                Your Incoming Connections
              </div>
              <h1 className="results-title" style={{ textAlign: 'center' }}>
                <span className="person-name cyan">JORDAN LEE</span>
              </h1>
              <p className="results-subtitle" style={{ textAlign: 'center' }}>
                People who scanned your QR code
              </p>
            </div>

            <div className="connections-list">
              {isLoadingConnections ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading connections...</p>
                </div>
              ) : connections.length === 0 ? (
                <div className="empty-state">
                  <p>No connections yet. Share your QR code to get started!</p>
                  <button className="btn" onClick={() => setScreen('my-profile')}>
                    View My QR Code
                  </button>
                </div>
              ) : (
                connections.map((conn) => (
                  <div
                    key={conn.handshakeId}
                    className={`connection-card ${conn.status === 'pending' ? 'new' : ''}`}
                    onClick={() => window.location.href = `/handshake-result/${conn.handshakeId}`}
                  >
                    <div className="connection-info">
                      <div className="connection-name">{conn.otherParty?.displayName || conn.otherParty?.role || 'Anonymous'}</div>
                      <div className="connection-role">{conn.otherParty?.role || 'Builder'}</div>
                    </div>
                    <div className="connection-meta">
                      <span className="connection-time">{new Date(conn.createdAt).toLocaleDateString()}</span>
                      {conn.status === 'pending' && !conn.theirConsent && <span className="new-badge">NEW</span>}
                    </div>
                    <div className="connection-action">
                      View Match →
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="info-box" style={{ marginTop: '30px' }}>
              <h4>How it works</h4>
              <ul>
                <li>When someone scans your QR, they appear here</li>
                <li>Tap to see your Stage 1 match (shared interests, conversation starters)</li>
                <li>Grant consent to unlock full profiles for both of you</li>
              </ul>
            </div>
          </div>
        )}

        {/* SCREEN: Scanned QR (B's experience) */}
        {screen === 'scanned-qr' && (
          <div className="screen active">
            <div className="results-header">
              <div className="results-header-label">
                You Scanned Someone's QR Code
              </div>
              <h1 className="results-title" style={{ textAlign: 'center' }}>
                Connect with <span className="person-name cyan">JORDAN LEE</span>
              </h1>
              <p className="results-subtitle" style={{ textAlign: 'center' }}>
                Senior Product Manager
              </p>
            </div>

            <div className="scanned-profile-preview">
              <div className="info-box">
                <h4>Their Mission</h4>
                <p style={{ fontStyle: 'italic', fontSize: '16px', lineHeight: '1.7' }}>
                  "Building tools that help teams ship faster without burning out.
                  Obsessed with the intersection of process and human wellbeing."
                </p>
              </div>

              <div className="info-box">
                <h4>What You'll See (Stage 1)</h4>
                <ul>
                  <li>Shared interests and overlapping skills</li>
                  <li>AI-generated conversation starter question</li>
                  <li>Complementarity preview</li>
                </ul>
              </div>

              <div className="warning-box info-box">
                <h4>What's Hidden Until Mutual Consent</h4>
                <ul>
                  <li>Full name and contact info</li>
                  <li>Detailed radar chart comparison</li>
                  <li>Complete collaboration analysis</li>
                </ul>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => setScreen('stage1')}>
                Create My Profile & Connect →
              </button>
            </div>

            <p style={{ textAlign: 'center', marginTop: '15px', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
              You'll create your profile using the same AI extraction flow, then see your match instantly.
            </p>
          </div>
        )}

        {/* SCREEN: My Profile */}
        {screen === 'my-profile' && (
          <div className="screen active">
            {isLoadingProfile ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading your profile...</p>
              </div>
            ) : !myProfileId ? (
              <div className="empty-state">
                <h2>No Profile Yet</h2>
                <p>Create your collaboration profile to get started.</p>
                <button className="btn" onClick={() => setScreen('create-profile')}>
                  Create My Profile →
                </button>
              </div>
            ) : (
              <>
                <div className="results-header">
                  <div className="results-header-label">
                    Your Collaboration Profile · ID: {myProfileId.slice(0, 8)}...
                  </div>

                  <div className="profile-header-container">
                    {/* QR Code - Real */}
                    <div className="profile-qr-card">
                      <div className="qr-code-box" style={{ background: 'white', padding: '16px', borderRadius: '8px' }}>
                        <QRCode
                          value={typeof window !== 'undefined' ? `${window.location.origin}/connect/${myProfileId}` : ''}
                          size={180}
                          level="M"
                        />
                      </div>
                      <div className="qr-url">
                        <span>/connect/{myProfileId.slice(0, 8)}...</span>
                      </div>
                    </div>

                    {/* Profile Info */}
                    <div className="profile-header-content">
                      <h1>{myProfile?.name || 'YOUR PROFILE'}</h1>
                      <p className="role">{myProfile?.role || 'Builder'}</p>
                      {myFullProfile?.hook && (
                        <p className="description">{myFullProfile.hook}</p>
                      )}
                      <div className="profile-actions">
                        <button
                          className="btn-small btn-primary-small"
                          onClick={() => {
                            const url = `${window.location.origin}/connect/${myProfileId}`;
                            navigator.clipboard.writeText(url);
                          }}
                        >
                          📋 Copy Link
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pending Connections */}
                {connections.length > 0 && (
                  <div className="section">
                    <h2 className="section-header">
                      <span className="icon">🔔</span> Incoming Connections ({connections.length})
                    </h2>
                    <div className="connections-list">
                      {connections.map((conn) => (
                        <div key={conn.handshakeId} className="connection-card" onClick={() => {
                          // Navigate to handshake result
                          window.location.href = `/handshake-result/${conn.handshakeId}`;
                        }}>
                          <div className="connection-info">
                            <div className="connection-name">
                              {conn.otherParty?.displayName || conn.otherParty?.role || 'Anonymous'}
                            </div>
                            <div className="connection-role">{conn.otherParty?.role || 'Builder'}</div>
                            <div className="connection-time">
                              {new Date(conn.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="connection-status">
                            {conn.status === 'pending' && !conn.theirConsent && (
                              <span className="badge badge-new">NEW</span>
                            )}
                            {conn.status === 'stage1_complete' && (
                              <span className="badge badge-stage1">Stage 1</span>
                            )}
                            {(conn.myConsent && conn.theirConsent) && (
                              <span className="badge badge-connected">Connected</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Working Style Dimensions */}
                {myProfile?.aspects && (
                  <div className="section">
                    <h2 className="section-header">
                      <span className="icon">◈</span> Your Working Style
                    </h2>
                    <div className="aspects-grid">
                      {myProfile.aspects.map((aspect, i) => (
                        <div key={i} className="aspect-detailed">
                          <div className="aspect-detailed-header">
                            <h4>{aspect.name}</h4>
                            <div className="aspect-score-badge">{aspect.score}/100</div>
                          </div>
                          <div className="aspect-bar">
                            <div className="aspect-bar-fill" style={{ width: `${aspect.score}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Proof Points */}
                {myFullProfile?.proof_points && myFullProfile.proof_points.length > 0 && (
                  <div className="section">
                    <h2 className="section-header">
                      <span className="icon">✓</span> Proof Points
                    </h2>
                    <div className="proof-points-list">
                      {myFullProfile.proof_points.map((proof: any, i: number) => (
                        <div key={i} className="proof-point-card">
                          <div className="proof-name">{proof.name}</div>
                          <div className="proof-description">{proof.description || proof.detail}</div>
                          {proof.impact && <div className="proof-impact">{proof.impact}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Collaboration Fit */}
                {myFullProfile?.collaboration_fit && (
                  <div className="section" style={{ maxWidth: '800px', margin: '60px auto' }}>
                    <h2 className="section-header">
                      <span className="icon">👥</span> Collaboration Fit
                    </h2>

                    <div className="info-box">
                      <h4>Looking For:</h4>
                      <p>{myFullProfile.collaboration_fit.looking_for}</p>
                      {myFullProfile.collaboration_fit.work_best_with && (
                        <>
                          <h4 style={{ marginTop: '16px' }}>Works Best With:</h4>
                          <ul>
                            {myFullProfile.collaboration_fit.work_best_with.map((trait: string, i: number) => (
                              <li key={i}>{trait}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>

                    {myFullProfile.collaboration_fit.struggle_with && (
                      <div className="info-box warning-box">
                        <h4>Watch Points:</h4>
                        <ul>
                          {myFullProfile.collaboration_fit.struggle_with.map((point: string, i: number) => (
                            <li key={i}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* CTA */}
                <div className="cta-section">
                  <h2>Share Your Profile</h2>
                  <p>Show your QR code to potential collaborators or share your link.</p>
                  <div className="cta-actions">
                    <button className="btn-small btn-outline-small" onClick={handleResetDemo}>
                      🗑 Reset Profile
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* SCREEN: Stage 1 (Public Only) */}
        {screen === 'stage1' && (
          <div className="screen active">
            <div className="results-header">
              <div className="results-header-label">
                Collaboration Protocol · Stage 1 Public Access
              </div>

              <div className="results-header-people">
                <div className="person-header left">
                  <div className="person-name">{PROFILES.jordan.name}</div>
                  <div className="person-role">{PROFILES.jordan.role}</div>
                </div>
                <div className="vs-divider">×</div>
                <div className="person-header right">
                  <div className="person-name">???</div>
                  <div className="person-role">Consent Required</div>
                </div>
              </div>

              <div className="results-description">
                <p>Partner profile is hidden until mutual consent is granted. Shared interests visible below.</p>
              </div>
            </div>

            {/* Shared Interests */}
            <div className="section">
              <h2 className="section-header">
                <span className="icon">◈</span> Shared Interests
              </h2>
              <div className="shared-tags">
                {ANALYSIS.shared.map((interest, i) => (
                  <span key={i} className="shared-tag">{interest}</span>
                ))}
              </div>
            </div>

            {/* Powerful Question */}
            <div className="powerful-question">
              <div className="label">Conversation Starter</div>
              <div className="question-text">"{ANALYSIS.question}"</div>
            </div>

            {/* Privacy Section */}
            <div className="section">
              <h2 className="section-header">
                <span className="icon">🔒</span> Privacy First
              </h2>
              <div className="card domain-technology">
                <h3>Stage 1: Public Profile Access</h3>
                <p style={{ marginBottom: '15px' }}>
                  This analysis uses <strong>public profile data only</strong> — like a Slack bot that can see channels but can't post until invited.
                </p>
                <p className="api-preview">
                  GET /cpx/human/{'{id}'}/public → 200 OK<br />
                  ✓ Aspects, mission, work style visible<br /><br />
                  GET /cpx/human/{'{id}'}/full → 403 Forbidden<br />
                  ✗ Name, contact, LinkedIn require consent
                </p>
                <p className="consent-status">
                  <strong>is_consent_granted: false</strong> — No PII shared yet
                </p>
              </div>

              <button className="btn" style={{ marginTop: '20px', width: '100%' }} onClick={() => setShowConsentModal(true)}>
                🔓 Grant Consent (Stage 2)
              </button>
            </div>
          </div>
        )}

        {/* SCREEN: Stage 2 (Full Access) */}
        {screen === 'stage2' && (
          <div className="screen active">
            <div className="results-header">
              <div className="results-header-label">
                Collaboration Protocol · Stage 2 Access Granted
              </div>

              <div className="consent-badge">
                <span className="checkmark">✓</span>
                Full Profile Access Enabled
              </div>

              <div className="results-header-people">
                <div className="person-header left">
                  <div className="person-name">{PROFILES.jordan.name}</div>
                  <div className="person-role">{PROFILES.jordan.role}</div>
                </div>
                <div className="vs-divider">×</div>
                <div className="person-header right">
                  <div className="person-name">{PROFILES.darius.name}</div>
                  <div className="person-role">{PROFILES.darius.role}</div>
                </div>
              </div>

              <div className="results-description">
                <p>Both parties have granted consent. Full profiles with contact information and detailed evidence are now visible.</p>
              </div>
            </div>

            {/* Contact Cards */}
            <div className="section">
              <h2 className="section-header">
                <span className="icon">👤</span> Contact Information
              </h2>
              <p className="section-subtitle">Now that consent is granted, you can connect directly.</p>

              <div className="contact-cards">
                <div className="contact-card left">
                  <h3>{PROFILES.jordan.name}</h3>
                  <div className="role">{PROFILES.jordan.role} @ TechCorp</div>
                  <div className="contact-info">
                    <div className="contact-info-item">
                      <span className="icon">✉</span>
                      <a href={`mailto:${PROFILES.jordan.contact.email}`}>{PROFILES.jordan.contact.email}</a>
                    </div>
                    <div className="contact-info-item">
                      <span className="icon">📱</span>
                      <a href={`tel:${PROFILES.jordan.contact.phone}`}>{PROFILES.jordan.contact.phone}</a>
                    </div>
                    <div className="contact-info-item">
                      <span className="icon">💼</span>
                      <a href={`https://linkedin.com/in/${PROFILES.jordan.contact.linkedin}`} target="_blank">linkedin.com/in/{PROFILES.jordan.contact.linkedin}</a>
                    </div>
                  </div>
                </div>

                <div className="contact-card right">
                  <h3>{PROFILES.darius.name}</h3>
                  <div className="role">{PROFILES.darius.role} @ VisionLabs</div>
                  <div className="contact-info">
                    <div className="contact-info-item">
                      <span className="icon">✉</span>
                      <a href={`mailto:${PROFILES.darius.contact.email}`}>{PROFILES.darius.contact.email}</a>
                    </div>
                    <div className="contact-info-item">
                      <span className="icon">📱</span>
                      <a href={`tel:${PROFILES.darius.contact.phone}`}>{PROFILES.darius.contact.phone}</a>
                    </div>
                    <div className="contact-info-item">
                      <span className="icon">💼</span>
                      <a href={`https://linkedin.com/in/${PROFILES.darius.contact.linkedin}`} target="_blank">linkedin.com/in/{PROFILES.darius.contact.linkedin}</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Radar Chart */}
            <div className="section">
              <h2 className="section-header"><span className="icon">◈</span> Visual Comparison</h2>
              <p className="section-subtitle">Behavioral patterns across 6 key dimensions</p>
              <RadarChart jordan={PROFILES.jordan.radar} darius={PROFILES.darius.radar} />
              <p className="radar-legend">
                <span style={{ color: '#4ecdc4' }}>█</span> JORDAN LEE &nbsp;&nbsp;&nbsp;
                <span style={{ color: '#ff6b6b' }}>█</span> DARIUS WEBB
              </p>
            </div>

            {/* Aspect Breakdown */}
            <div className="section">
              <h2 className="section-header"><span className="icon">⬡</span> Aspect Breakdown</h2>
              <div className="two-sided-section">
                <div className="side-left">
                  <div className="side-label">Jordan's Strengths</div>
                  {PROFILES.jordan.aspects.map((aspect, i) => (
                    <div key={i} className="aspect-bar">
                      <div className="aspect-bar-label">
                        <span className="name">{aspect.name}</span>
                        <span className="value">{aspect.score}/100</span>
                      </div>
                      <div className="aspect-bar-track">
                        <div className="aspect-bar-fill cyan" style={{ width: `${aspect.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="side-right">
                  <div className="side-label">Darius's Strengths</div>
                  {PROFILES.darius.aspects.map((aspect, i) => (
                    <div key={i} className="aspect-bar">
                      <div className="aspect-bar-label">
                        <span className="name">{aspect.name}</span>
                        <span className="value">{aspect.score}/100</span>
                      </div>
                      <div className="aspect-bar-track">
                        <div className="aspect-bar-fill red" style={{ width: `${aspect.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Complementarity */}
            <div className="section">
              <h2 className="section-header"><span className="icon">⚡</span> Why This Works</h2>
              <div className="complementarity-map">
                <div className="person-brings">
                  <h4>Jordan Brings</h4>
                  <div className="traits">
                    {ANALYSIS.complementarity.jordan.map((t, i) => <div key={i}>{t}</div>)}
                  </div>
                </div>
                <div className="plus-operator">+</div>
                <div className="person-brings right">
                  <h4>Darius Brings</h4>
                  <div className="traits">
                    {ANALYSIS.complementarity.darius.map((t, i) => <div key={i}>{t}</div>)}
                  </div>
                </div>
              </div>
              <div className="result-box">
                <h3>= {ANALYSIS.complementarity.together}</h3>
              </div>
            </div>

            {/* Powerful Question */}
            <div className="powerful-question">
              <div className="label">Start Here</div>
              <div className="question-text">"{ANALYSIS.question}"</div>
              <div className="explanation">
                <strong>What to do with this question:</strong><br />
                • Schedule a 30-minute call to discuss your answers<br />
                • Share specific examples (Jordan: your unfinished ideas, Darius: your systematic gaps)<br />
                • See if the answers reveal a concrete project you could collaborate on
              </div>
              <button className="btn" style={{ marginTop: '20px' }} onClick={() => setScreen('prioritization')}>
                → Align on Priorities
              </button>
            </div>
          </div>
        )}

        {/* SCREEN: Prioritization */}
        {screen === 'prioritization' && (
          <div className="screen active">
            <div className="results-header" style={{ paddingBottom: '2rem' }}>
              <div className="results-header-label">
                Prioritize Your Collaboration
              </div>
              <p style={{ textAlign: 'center', color: '#bbb', marginTop: '10px' }}>
                Choose how you want to reveal your priorities
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="prioritization-tabs">
              <button
                className={`priority-tab ${priorityTab === 'quick' ? 'active' : ''}`}
                onClick={() => setPriorityTab('quick')}
              >
                ✓ Quick Pick (4 clicks)
              </button>
              <button
                className={`priority-tab ${priorityTab === 'rpg' ? 'active' : ''}`}
                onClick={() => setPriorityTab('rpg')}
              >
                ⚔ Point Allocation (RPG)
              </button>
            </div>

            {/* Quick Pick */}
            {priorityTab === 'quick' && (
              <div className="section">
                <div className="quick-pick-container">
                  <div className="quick-pick-header">TAP ONE ANSWER PER QUESTION</div>
                  <div className="quick-questions">
                    {QUICK_PICK.map((q, qIndex) => (
                      <div key={qIndex} className="quick-question">
                        <div className="quick-question-header">{qIndex + 1}. {q.q}</div>
                        <div className="quick-options">
                          {q.options.map((opt, oIndex) => (
                            <div
                              key={oIndex}
                              className={`quick-option ${quickPickAnswers[qIndex] === opt ? 'selected' : ''}`}
                              onClick={() => handleQuickPick(qIndex, opt)}
                            >
                              <div className="quick-option-label">{opt}</div>
                              <div className="quick-option-check">✓</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {quickPickAnswers.every(a => a !== null) && (
                    <div className="quick-pick-results">
                      <h3>Your Collaboration Profile</h3>
                      <div className="results-list">
                        {QUICK_PICK.map((q, i) => (
                          <div key={i} className="result-item">
                            <span className="label">{q.q}</span>
                            <span className="value">{quickPickAnswers[i]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* RPG Point Allocation */}
            {priorityTab === 'rpg' && (
              <div className="section">
                <div className="allocation-container">
                  <div className="allocation-header">
                    <div className="instruction">DISTRIBUTE 10 POINTS</div>
                    <div className={`points-remaining ${totalPoints === 10 ? 'complete' : ''}`}>
                      {totalPoints}/10 used
                    </div>
                  </div>

                  <div className="allocation-items">
                    {PRIORITIES.map((priority, i) => (
                      <div key={i} className="allocation-item">
                        <div className="priority-name">{priority}</div>
                        <div className="allocation-controls">
                          <button
                            className="alloc-btn"
                            onClick={() => handlePointChange(i, -1)}
                            disabled={pointAllocation[i] === 0}
                          >
                            -
                          </button>
                          <div className="alloc-bar-track">
                            <div
                              className="alloc-bar-fill"
                              style={{ width: `${pointAllocation[i] * 10}%` }}
                            />
                          </div>
                          <button
                            className="alloc-btn"
                            onClick={() => handlePointChange(i, 1)}
                            disabled={totalPoints >= 10}
                          >
                            +
                          </button>
                          <div className="alloc-value">{pointAllocation[i]}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalPoints === 10 && (
                    <div className="allocation-results">
                      <h3>Your Priority Distribution</h3>
                      <div className="results-list">
                        {PRIORITIES.map((p, i) => (
                          <div key={i} className="result-item">
                            <span className="label">{p}</span>
                            <span className="value">{pointAllocation[i]} pts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer>
          <button className="reset-btn" onClick={handleResetDemo}>
            ↺ Reset Demo
          </button>
          <p>Mission Match · Demo Day: March 9, 2026<br />Track 3: Personal Data, Personal Value</p>
        </footer>
      </div>

      {/* Consent Modal */}
      {showConsentModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowConsentModal(false)}>
          <div className="consent-modal">
            <div className="modal-header">
              <div className="modal-app-icon">MM</div>
              <h2>Allow Mission Match to access your collaboration profile?</h2>
              <p>Mission Match is requesting access to both JORDAN LEE and DARIUS WEBB's full profiles</p>
            </div>

            <div className="modal-body">
              <div className="permissions-header">Review profile permissions</div>

              <div className="permission-item">
                <div className="permission-item-header">
                  <div className="permission-item-title">Information Mission Match can view</div>
                </div>
                <div className="permission-item-content">
                  <ul>
                    <li>Full name and professional title</li>
                    <li>Email address and phone number</li>
                    <li>LinkedIn profile URL</li>
                    <li>Complete collaboration profile with all aspects</li>
                    <li>Work style preferences and availability</li>
                  </ul>
                </div>
              </div>

              <div className="permission-item">
                <div className="permission-item-header">
                  <div className="permission-item-title">Actions Mission Match can take</div>
                </div>
                <div className="permission-item-content">
                  <ul>
                    <li>Share your profile with other consenting users</li>
                    <li>Generate collaboration fit analysis</li>
                    <li>Create powerful questions for first conversations</li>
                    <li>Store your profile data (encrypted at rest)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="privacy-footer">
              By clicking Allow, you agree to Mission Match's <a href="#">User Agreement</a> and <a href="#">Privacy Policy</a>. Both parties must consent to share profiles — you can revoke access at any time.
            </div>

            <div className="modal-footer">
              <button className="btn btn-cancel" onClick={() => setShowConsentModal(false)}>Cancel</button>
              <button className="btn btn-allow" onClick={handleGrantConsent}>Allow</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================================
// QR CODE SVG
// ============================================================================

function QRCodeSVG() {
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
      <rect width="100" height="100" fill="white"/>
      <g fill="black">
        {/* Top-left corner marker */}
        <rect x="5" y="5" width="25" height="25" rx="2"/>
        <rect x="9" y="9" width="17" height="17" fill="white"/>
        <rect x="13" y="13" width="9" height="9"/>
        {/* Top-right corner marker */}
        <rect x="70" y="5" width="25" height="25" rx="2"/>
        <rect x="74" y="9" width="17" height="17" fill="white"/>
        <rect x="78" y="13" width="9" height="9"/>
        {/* Bottom-left corner marker */}
        <rect x="5" y="70" width="25" height="25" rx="2"/>
        <rect x="9" y="74" width="17" height="17" fill="white"/>
        <rect x="13" y="78" width="9" height="9"/>
      </g>
      <g fill="black">
        <rect x="35" y="10" width="4" height="4"/>
        <rect x="40" y="10" width="4" height="4"/>
        <rect x="50" y="10" width="4" height="4"/>
        <rect x="60" y="10" width="4" height="4"/>
        <rect x="35" y="15" width="4" height="4"/>
        <rect x="45" y="15" width="4" height="4"/>
        <rect x="55" y="15" width="4" height="4"/>
        <rect x="35" y="35" width="4" height="4"/>
        <rect x="45" y="35" width="4" height="4"/>
        <rect x="55" y="35" width="4" height="4"/>
        <rect x="70" y="35" width="4" height="4"/>
        <rect x="35" y="50" width="4" height="4"/>
        <rect x="50" y="50" width="4" height="4"/>
        <rect x="70" y="50" width="4" height="4"/>
        <rect x="85" y="50" width="4" height="4"/>
        <rect x="35" y="75" width="4" height="4"/>
        <rect x="50" y="75" width="4" height="4"/>
        <rect x="70" y="75" width="4" height="4"/>
        <rect x="85" y="75" width="4" height="4"/>
      </g>
    </svg>
  );
}

// ============================================================================
// RADAR CHART COMPONENT
// ============================================================================

function RadarChart({ jordan, darius }: { jordan: Profile['radar']; darius: Profile['radar'] }) {
  return (
    <div className="radar-container">
      <svg className="radar-svg" viewBox="0 0 500 500">
        {/* Background circles */}
        <circle cx="250" cy="250" r="200" className="radar-bg-circle"/>
        <circle cx="250" cy="250" r="150" className="radar-bg-circle"/>
        <circle cx="250" cy="250" r="100" className="radar-bg-circle"/>
        <circle cx="250" cy="250" r="50" className="radar-bg-circle"/>

        {/* Axis lines */}
        <line x1="250" y1="250" x2="250" y2="50" className="radar-axis-line"/>
        <line x1="250" y1="250" x2="423.2" y2="150" className="radar-axis-line"/>
        <line x1="250" y1="250" x2="423.2" y2="350" className="radar-axis-line"/>
        <line x1="250" y1="250" x2="250" y2="450" className="radar-axis-line"/>
        <line x1="250" y1="250" x2="76.8" y2="350" className="radar-axis-line"/>
        <line x1="250" y1="250" x2="76.8" y2="150" className="radar-axis-line"/>

        {/* Darius polygon (red/behind) */}
        <polygon
          points={calculatePolygon(darius)}
          className="radar-polygon-right"
        />

        {/* Jordan polygon (cyan/front) */}
        <polygon
          points={calculatePolygon(jordan)}
          className="radar-polygon-left"
        />

        {/* Axis labels */}
        <text x="250" y="35" textAnchor="middle" className="radar-label">Process</text>
        <text x="250" y="48" textAnchor="middle" className="radar-score">J: {jordan.process} | D: {darius.process}</text>

        <text x="440" y="145" textAnchor="start" className="radar-label">Empathy</text>
        <text x="440" y="158" textAnchor="start" className="radar-score">J: {jordan.empathy} | D: {darius.empathy}</text>

        <text x="440" y="365" textAnchor="start" className="radar-label">Org</text>
        <text x="440" y="378" textAnchor="start" className="radar-score">J: {jordan.org} | D: {darius.org}</text>

        <text x="250" y="485" textAnchor="middle" className="radar-label">Speed</text>
        <text x="250" y="472" textAnchor="middle" className="radar-score">J: {jordan.speed} | D: {darius.speed}</text>

        <text x="60" y="365" textAnchor="end" className="radar-label">Vision</text>
        <text x="60" y="378" textAnchor="end" className="radar-score">J: {jordan.vision} | D: {darius.vision}</text>

        <text x="60" y="145" textAnchor="end" className="radar-label">Bold</text>
        <text x="60" y="158" textAnchor="end" className="radar-score">J: {jordan.bold} | D: {darius.bold}</text>

        <circle cx="250" cy="250" r="3" fill="#666"/>
      </svg>
    </div>
  );
}

function calculatePolygon(data: Profile['radar']): string {
  const center = 250;
  const maxR = 200;
  const axes = [data.process, data.empathy, data.org, data.speed, data.vision, data.bold];

  const points = axes.map((val, i) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    const r = (val / 100) * maxR;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return `${x},${y}`;
  });

  return points.join(' ');
}

// ============================================================================
// STYLES (matching redesign.html exactly)
// ============================================================================

const styles = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'DM Sans', system-ui, sans-serif;
  background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%);
  color: #e8e8e8;
  line-height: 1.6;
  min-height: 100vh;
}

.grid-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
  z-index: 0;
}

.floating-orb-cyan {
  position: fixed;
  width: 400px; height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(78,205,196,0.1) 0%, transparent 70%);
  top: -100px; right: -100px;
  pointer-events: none;
  animation: pulse 8s ease-in-out infinite;
  z-index: 0;
}

.floating-orb-red {
  position: fixed;
  width: 300px; height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,107,107,0.08) 0%, transparent 70%);
  bottom: 100px; left: -50px;
  pointer-events: none;
  animation: pulse 10s ease-in-out infinite reverse;
  z-index: 0;
}

.container {
  position: relative;
  z-index: 1;
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
}

/* Navigation */
nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  margin-bottom: 40px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 700;
}

.logo span {
  background: linear-gradient(90deg, #ffffff 0%, #4ecdc4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.nav-links {
  display: flex;
  gap: 30px;
}

.nav-links button {
  background: none;
  border: none;
  color: #aaa;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
  font-family: inherit;
}

.nav-links button:hover,
.nav-links button.active {
  color: #4ecdc4;
}

.nav-links button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Screen */
.screen {
  animation: slideIn 0.4s ease-out;
}

/* Results Header */
.results-header {
  position: relative;
  margin-bottom: 4rem;
  padding: 3rem 0;
  border-top: 3px solid #4ecdc4;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.results-header-label {
  text-align: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: #4ecdc4;
  text-transform: uppercase;
  letter-spacing: 0.25em;
  margin-bottom: 2rem;
}

.results-header-people {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 40px;
  align-items: center;
  margin-bottom: 2rem;
}

.person-header.left {
  text-align: right;
  padding-right: 2rem;
  border-right: 3px solid #4ecdc4;
}

.person-header.right {
  text-align: left;
  padding-left: 2rem;
  border-left: 3px solid #ff6b6b;
}

.person-name {
  font-size: clamp(2rem, 6vw, 3.5rem);
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 0.75rem;
}

.person-header.left .person-name { color: #4ecdc4; }
.person-header.right .person-name { color: #ff6b6b; }

.person-role {
  font-size: 0.85rem;
  font-weight: 400;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.15em;
}

.vs-divider {
  font-size: 1.5rem;
  color: #666;
  font-weight: 300;
}

.results-description {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
  padding: 1.5rem;
  border-left: 3px solid rgba(78, 205, 196, 0.5);
  background: rgba(255,255,255,0.02);
}

.results-description p {
  font-size: 0.95rem;
  line-height: 1.8;
  color: #aaa;
}

/* Consent Badge */
.consent-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0.5rem 1rem;
  background: rgba(78, 205, 196, 0.15);
  border: 1px solid rgba(78, 205, 196, 0.3);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #4ecdc4;
  margin: 0 auto 20px;
  text-align: center;
}

/* Profile Header */
.profile-header-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  margin: 30px 0;
}

.profile-qr-card {
  text-align: center;
}

.qr-code-box {
  width: 212px;
  height: 212px;
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-url {
  margin-top: 12px;
}

.qr-url span {
  display: inline-block;
  padding: 6px 12px;
  background: rgba(0,0,0,0.3);
  border-radius: 6px;
  font-family: 'Space Mono', monospace;
  font-size: 0.65rem;
  color: #4ecdc4;
}

.profile-header-content {
  text-align: center;
}

.profile-header-content h1 {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  color: #fff;
  margin-bottom: 10px;
}

.profile-header-content .role {
  font-size: 1rem;
  color: rgba(255,255,255,0.6);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 20px;
}

.profile-header-content .description {
  font-size: 0.9rem;
  color: rgba(255,255,255,0.5);
  line-height: 1.6;
  max-width: 500px;
}

.profile-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  justify-content: center;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.875rem 1.5rem;
  background: transparent;
  color: rgba(255,255,255,0.7);
  font-weight: 500;
  font-size: 0.9rem;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: 'DM Sans', system-ui, sans-serif;
}

.btn:hover {
  background: linear-gradient(135deg, rgba(78,205,196,0.15) 0%, rgba(255,107,107,0.1) 100%);
  color: #4ecdc4;
  transform: translateX(4px);
}

.btn-small {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 0.8rem;
  font-weight: 500;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'DM Sans', system-ui, sans-serif;
}

.btn-primary-small {
  background: rgba(78, 205, 196, 0.15);
  color: #4ecdc4;
  border: 1px solid rgba(78, 205, 196, 0.3);
}

.btn-primary-small:hover {
  background: rgba(78, 205, 196, 0.25);
}

.btn-outline-small {
  background: transparent;
  color: rgba(255,255,255,0.6);
  border: 1px solid rgba(255,255,255,0.2);
}

.btn-outline-small:hover {
  background: rgba(255,255,255,0.05);
  color: #fff;
}

/* Section - override globals.css blueprint styling */
.section {
  margin-bottom: 60px;
  animation: slideIn 0.4s ease-out;
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  position: relative;
}

.section::before,
.section::after {
  display: none !important;
}

.section-header {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 20px;
  color: #fff;
}

.section-header .icon {
  color: #4ecdc4;
  margin-right: 10px;
  opacity: 0.8;
}

.section-subtitle {
  color: #aaa;
  margin-bottom: 20px;
  font-size: 14px;
}

/* Aspects Grid */
.aspects-grid {
  display: grid;
  gap: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.aspect-detailed {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 25px;
}

.aspect-detailed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.aspect-detailed-header h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
}

.aspect-score-badge {
  background: rgba(78, 205, 196, 0.15);
  border: 1px solid rgba(78, 205, 196, 0.3);
  color: #4ecdc4;
  padding: 4px 10px;
  border-radius: 6px;
  font-family: 'Space Mono', monospace;
  font-size: 0.85rem;
  font-weight: 600;
}

.aspect-description {
  color: rgba(255,255,255,0.65);
  font-size: 14px;
  line-height: 1.7;
  margin-bottom: 12px;
}

/* Evidence Box */
.evidence-box {
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(78, 205, 196, 0.2);
  padding: 16px;
  margin-top: 12px;
  border-radius: 8px;
}

.evidence-box .label {
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  color: #4ecdc4;
  text-transform: uppercase;
  font-weight: 600;
  margin-bottom: 8px;
  display: block;
}

.evidence-box .quote {
  font-size: 14px;
  color: rgba(255,255,255,0.8);
  font-style: italic;
  line-height: 1.7;
  margin-bottom: 8px;
}

.evidence-box .source {
  font-size: 12px;
  color: rgba(255,255,255,0.4);
  font-family: 'Space Mono', monospace;
}

/* Info Box */
.info-box {
  padding: 20px;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(78, 205, 196, 0.2);
  border-radius: 8px;
  margin: 20px 0;
}

.info-box h4 {
  color: #4ecdc4;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 10px;
}

.info-box ul {
  list-style: none;
  padding-left: 0;
}

.info-box li {
  color: rgba(255,255,255,0.7);
  font-size: 14px;
  line-height: 1.8;
  padding-left: 20px;
  position: relative;
}

.info-box li:before {
  content: "•";
  position: absolute;
  left: 0;
  color: #4ecdc4;
}

.warning-box {
  border-left: 4px solid #ff6b6b;
}

.warning-box h4 {
  color: #ff6b6b;
}

.warning-box li:before {
  color: #ff6b6b;
}

/* CTA Section */
.cta-section {
  text-align: center;
  margin: 80px 0 60px;
}

.cta-section h2 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 15px;
}

.cta-section p {
  font-size: 1rem;
  color: rgba(255,255,255,0.6);
  margin-bottom: 40px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.cta-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
}

/* Cards */
.card {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 20px;
}

.card h3 {
  color: #4ecdc4;
  font-size: 20px;
  margin-bottom: 15px;
  font-weight: 600;
}

.card p {
  color: #ccc;
  line-height: 1.7;
  font-size: 15px;
}

.domain-technology {
  background: rgba(78, 205, 196, 0.08);
  border-left: 4px solid #4ecdc4;
}

.api-preview {
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  background: rgba(0,0,0,0.5);
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 15px;
  color: #aaa;
}

.consent-status {
  color: #aaa;
  font-size: 14px;
}

/* Shared Tags */
.shared-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.shared-tag {
  padding: 10px 18px;
  background: rgba(78, 205, 196, 0.1);
  border: 1px solid rgba(78, 205, 196, 0.3);
  border-radius: 20px;
  font-size: 14px;
  color: #4ecdc4;
}

/* Powerful Question */
.powerful-question {
  padding: 40px;
  background: linear-gradient(135deg, rgba(78, 205, 196, 0.12) 0%, rgba(131, 56, 236, 0.08) 50%, rgba(255, 107, 107, 0.06) 100%);
  border: 1px solid rgba(78, 205, 196, 0.3);
  border-radius: 20px;
  margin: 40px 0;
  text-align: center;
}

.powerful-question .label {
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  color: #4ecdc4;
  text-transform: uppercase;
  margin-bottom: 20px;
}

.powerful-question .question-text {
  font-size: 22px;
  color: #fff;
  line-height: 1.6;
  font-weight: 500;
  margin-bottom: 25px;
}

.powerful-question .explanation {
  font-size: 14px;
  color: rgba(255,255,255,0.7);
  line-height: 1.8;
  padding: 20px;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(78, 205, 196, 0.2);
  border-radius: 8px;
  text-align: left;
}

/* Contact Cards */
.contact-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.contact-card {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 25px;
}

.contact-card.left {
  border-top: 3px solid #4ecdc4;
}

.contact-card.right {
  border-top: 3px solid #ff6b6b;
}

.contact-card h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 5px;
}

.contact-card.left h3 { color: #4ecdc4; }
.contact-card.right h3 { color: #ff6b6b; }

.contact-card .role {
  color: #888;
  font-size: 0.85rem;
  margin-bottom: 20px;
}

.contact-info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  font-size: 0.9rem;
}

.contact-info-item .icon {
  opacity: 0.7;
}

.contact-info-item a {
  color: rgba(255,255,255,0.8);
  text-decoration: none;
  transition: color 0.2s;
}

.contact-info-item a:hover {
  color: #4ecdc4;
}

/* Radar Chart */
.radar-container {
  display: flex;
  justify-content: center;
  margin: 40px 0;
  padding: 40px;
  background: rgba(0,0,0,0.3);
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.06);
}

.radar-svg {
  width: 100%;
  max-width: 500px;
  height: auto;
}

.radar-bg-circle {
  fill: none;
  stroke: rgba(255,255,255,0.05);
  stroke-width: 1;
}

.radar-axis-line {
  stroke: rgba(255,255,255,0.1);
  stroke-width: 1;
}

.radar-polygon-left {
  fill: rgba(78, 205, 196, 0.15);
  stroke: #4ecdc4;
  stroke-width: 2;
}

.radar-polygon-right {
  fill: rgba(255, 107, 107, 0.15);
  stroke: #ff6b6b;
  stroke-width: 2;
}

.radar-label {
  fill: #aaa;
  font-size: 12px;
  font-weight: 600;
}

.radar-score {
  fill: #666;
  font-size: 10px;
}

.radar-legend {
  text-align: center;
  color: #aaa;
  font-size: 14px;
  margin-top: 20px;
}

/* Two-sided Section */
.two-sided-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.side-left {
  padding-right: 20px;
  border-right: 1px solid rgba(78, 205, 196, 0.2);
}

.side-right {
  padding-left: 20px;
  border-left: 1px solid rgba(255, 107, 107, 0.2);
}

.side-label {
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  font-weight: 600;
  margin-bottom: 15px;
}

.side-left .side-label { color: #4ecdc4; }
.side-right .side-label { color: #ff6b6b; }

.aspect-bar {
  margin-bottom: 20px;
}

.aspect-bar-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}

.aspect-bar-label .name {
  color: rgba(255,255,255,0.8);
  font-weight: 500;
}

.aspect-bar-label .value {
  color: rgba(255,255,255,0.6);
  font-weight: 600;
  font-family: 'Space Mono', monospace;
  font-size: 12px;
}

.aspect-bar-track {
  height: 6px;
  background: rgba(255,255,255,0.05);
  border-radius: 3px;
  overflow: hidden;
}

.aspect-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.aspect-bar-fill.cyan {
  background: linear-gradient(90deg, rgba(78,205,196,1) 0%, rgba(78,205,196,0.8) 100%);
}

.aspect-bar-fill.red {
  background: linear-gradient(90deg, rgba(255,107,107,1) 0%, rgba(255,107,107,0.8) 100%);
}

/* Complementarity */
.complementarity-map {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 30px;
  align-items: center;
  padding: 30px;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(78, 205, 196, 0.2);
  border-radius: 16px;
}

.person-brings {
  text-align: right;
}

.person-brings.right {
  text-align: left;
}

.person-brings h4 {
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  color: #4ecdc4;
  text-transform: uppercase;
  margin-bottom: 15px;
  font-weight: 600;
}

.person-brings.right h4 {
  color: #ff6b6b;
}

.person-brings .traits {
  font-size: 15px;
  color: rgba(255,255,255,0.8);
  line-height: 2;
}

.plus-operator {
  font-size: 36px;
  color: #4ecdc4;
  font-weight: 700;
}

.result-box {
  text-align: center;
  padding: 25px;
  background: rgba(78, 205, 196, 0.15);
  border: 1px solid rgba(78, 205, 196, 0.3);
  border-radius: 12px;
  margin-top: 25px;
}

.result-box h3 {
  font-size: 20px;
  color: #4ecdc4;
  font-weight: 700;
}

/* Prioritization Tabs */
.prioritization-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0;
}

.priority-tab {
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.5);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  padding: 12px 20px;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;
  font-family: 'DM Sans', system-ui, sans-serif;
}

.priority-tab:hover {
  color: rgba(255,255,255,0.8);
}

.priority-tab.active {
  color: #4ecdc4;
  border-bottom-color: #4ecdc4;
}

/* Quick Pick */
.quick-pick-container {
  background: rgba(78, 205, 196, 0.05);
  border: 1px solid rgba(78, 205, 196, 0.2);
  border-radius: 8px;
  padding: 30px;
}

.quick-pick-header {
  text-align: center;
  font-size: 15px;
  color: #4ecdc4;
  font-weight: 600;
  margin-bottom: 25px;
}

.quick-questions {
  display: grid;
  gap: 30px;
}

.quick-question-header {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 15px;
}

.quick-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.quick-option {
  padding: 18px 20px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quick-option:hover {
  border-color: rgba(78, 205, 196, 0.3);
  background: rgba(78, 205, 196, 0.05);
}

.quick-option.selected {
  background: rgba(78, 205, 196, 0.15);
  border-color: #4ecdc4;
}

.quick-option-label {
  font-size: 15px;
  color: rgba(255,255,255,0.8);
}

.quick-option-check {
  color: #4ecdc4;
  font-weight: 700;
  opacity: 0;
  transition: opacity 0.2s;
}

.quick-option.selected .quick-option-check {
  opacity: 1;
}

.quick-pick-results,
.allocation-results {
  margin-top: 30px;
  padding: 25px;
  background: rgba(78, 205, 196, 0.08);
  border: 2px solid #4ecdc4;
  border-radius: 8px;
}

.quick-pick-results h3,
.allocation-results h3 {
  color: #4ecdc4;
  font-size: 18px;
  margin-bottom: 20px;
  text-align: center;
}

.results-list {
  display: grid;
  gap: 10px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.result-item .label {
  color: rgba(255,255,255,0.6);
}

.result-item .value {
  color: #fff;
  font-weight: 600;
}

/* Point Allocation */
.allocation-container {
  background: rgba(78, 205, 196, 0.05);
  border: 1px solid rgba(78, 205, 196, 0.2);
  border-radius: 8px;
  padding: 30px;
}

.allocation-header {
  text-align: center;
  margin-bottom: 30px;
}

.allocation-header .instruction {
  font-size: 15px;
  color: #4ecdc4;
  font-weight: 600;
  margin-bottom: 10px;
}

.points-remaining {
  font-size: 24px;
  font-weight: 700;
  font-family: 'Space Mono', monospace;
  color: #ff6b6b;
}

.points-remaining.complete {
  color: #4ecdc4;
}

.allocation-items {
  display: grid;
  gap: 20px;
}

.allocation-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.priority-name {
  width: 140px;
  font-size: 14px;
  color: rgba(255,255,255,0.8);
}

.allocation-controls {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.alloc-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  border: none;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
}

.alloc-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.2);
}

.alloc-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.alloc-bar-track {
  flex: 1;
  height: 12px;
  background: rgba(255,255,255,0.1);
  border-radius: 6px;
  overflow: hidden;
}

.alloc-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4ecdc4 0%, #ff6b6b 100%);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.alloc-value {
  width: 30px;
  text-align: center;
  font-family: 'Space Mono', monospace;
  font-size: 16px;
  color: #4ecdc4;
  font-weight: 600;
}

/* Footer */
footer {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  font-size: 13px;
  border-top: 1px solid rgba(255,255,255,0.1);
  margin-top: 80px;
}

.reset-btn {
  background: none;
  border: none;
  color: #666;
  font-size: 13px;
  cursor: pointer;
  margin-bottom: 15px;
  font-family: inherit;
}

.reset-btn:hover {
  color: #ff6b6b;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.consent-modal {
  background: #fff;
  border-radius: 8px;
  max-width: 520px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.modal-header {
  padding: 48px 40px 32px;
  text-align: center;
}

.modal-app-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, #4ecdc4, #3ba89f);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 700;
  color: #fff;
}

.modal-header h2 {
  font-size: 24px;
  color: #1d1c1d;
  margin-bottom: 8px;
  font-weight: 700;
  line-height: 1.2;
}

.modal-header p {
  font-size: 15px;
  color: #616061;
  line-height: 1.5;
}

.modal-body {
  padding: 0 40px 32px;
}

.permissions-header {
  font-size: 13px;
  font-weight: 700;
  color: #1d1c1d;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.permission-item {
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 8px;
  background: #fff;
}

.permission-item-header {
  padding: 14px 16px;
}

.permission-item-title {
  font-size: 15px;
  color: #1d1c1d;
  font-weight: 600;
}

.permission-item-content {
  padding: 0 16px 16px;
  border-top: 1px solid #f0f0f0;
}

.permission-item-content ul {
  list-style: none;
  padding: 12px 0 0;
}

.permission-item-content li {
  padding: 4px 0;
  font-size: 14px;
  color: #616061;
  line-height: 1.5;
}

.privacy-footer {
  padding: 20px 40px;
  background: #f8f8f8;
  border-top: 1px solid #ddd;
  font-size: 13px;
  color: #616061;
  line-height: 1.6;
}

.privacy-footer a {
  color: #1264a3;
  text-decoration: none;
}

.modal-footer {
  padding: 24px 40px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  background: #fff;
}

.btn-cancel {
  padding: 0.875rem 1.5rem;
  background: transparent;
  border: none;
  color: rgba(29, 28, 29, 0.6);
  font-weight: 500;
  font-size: 0.9rem;
  border-radius: 10px;
  cursor: pointer;
  font-family: 'DM Sans', system-ui, sans-serif;
}

.btn-cancel:hover {
  background: rgba(0,0,0,0.05);
  color: #1d1c1d;
}

.btn-allow {
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, rgba(0,122,90,0.15) 0%, rgba(0,122,90,0.1) 100%);
  border: none;
  color: #007a5a;
  font-weight: 600;
  font-size: 0.9rem;
  border-radius: 10px;
  cursor: pointer;
  font-family: 'DM Sans', system-ui, sans-serif;
}

.btn-allow:hover {
  background: linear-gradient(135deg, rgba(0,122,90,0.2) 0%, rgba(0,122,90,0.15) 100%);
  color: #006644;
}

/* Mobile */
@media (max-width: 768px) {
  .results-header-people {
    grid-template-columns: 1fr;
    gap: 20px;
    text-align: center;
  }

  .person-header.left,
  .person-header.right {
    text-align: center;
    padding: 0;
    border: none;
  }

  .vs-divider {
    display: none;
  }

  .two-sided-section {
    grid-template-columns: 1fr;
  }

  .side-left,
  .side-right {
    padding: 0;
    border: none;
  }

  .complementarity-map {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .person-brings,
  .person-brings.right {
    text-align: center;
  }

  .plus-operator {
    margin: 20px 0;
  }

  .contact-cards {
    grid-template-columns: 1fr;
  }

  .quick-options {
    grid-template-columns: 1fr;
  }

  .nav-links {
    gap: 15px;
    font-size: 12px;
  }

  .flow-diagram {
    flex-direction: column;
    gap: 15px;
  }

  .flow-arrow {
    transform: rotate(90deg);
  }
}

/* Hero Section */
.hero {
  text-align: center;
  padding: 60px 0;
  margin-bottom: 40px;
}

.hero-badge {
  display: inline-block;
  padding: 8px 16px;
  background: rgba(78, 205, 196, 0.15);
  border: 1px solid #4ecdc4;
  color: #4ecdc4;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: 600;
  margin-bottom: 20px;
  border-radius: 4px;
}

.hero h1 {
  font-size: clamp(2.5rem, 8vw, 4rem);
  font-weight: 700;
  margin-bottom: 20px;
  line-height: 1.1;
  background: linear-gradient(135deg, #4ecdc4, #8338ec);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero .tagline {
  font-size: 18px;
  color: #aaa;
  margin-bottom: 15px;
}

.hero .description {
  font-size: 16px;
  color: #bbb;
  line-height: 1.7;
  max-width: 700px;
  margin: 0 auto 40px;
}

.btn-secondary {
  background: transparent !important;
  border: 2px solid #4ecdc4 !important;
  color: #4ecdc4 !important;
}

.btn-secondary:hover {
  background: rgba(78, 205, 196, 0.1) !important;
}

/* Flow Diagram */
.flow-diagram {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 30px;
  background: rgba(0,0,0,0.3);
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.06);
}

.flow-step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 15px;
  background: rgba(78, 205, 196, 0.05);
  border: 1px solid rgba(78, 205, 196, 0.2);
  border-radius: 8px;
  max-width: 160px;
}

.flow-step-number {
  width: 24px;
  height: 24px;
  background: #4ecdc4;
  color: #000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
  flex-shrink: 0;
}

.flow-step-content h4 {
  color: #4ecdc4;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
}

.flow-step-content p {
  color: rgba(255,255,255,0.6);
  font-size: 11px;
  line-height: 1.4;
}

.flow-arrow {
  color: #4ecdc4;
  font-size: 20px;
  font-weight: 700;
}

/* Connections List */
.connections-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.connection-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(78, 205, 196, 0.2);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.connection-card:hover {
  border-color: #4ecdc4;
  background: rgba(78, 205, 196, 0.05);
}

.connection-card.new {
  border-color: #ff6b6b;
  background: rgba(255, 107, 107, 0.05);
}

.connection-card.new:hover {
  background: rgba(255, 107, 107, 0.1);
}

.connection-info {
  flex: 1;
}

.connection-name {
  color: #fff;
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
}

.connection-role {
  color: rgba(255,255,255,0.6);
  font-size: 13px;
}

.connection-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.connection-time {
  color: rgba(255,255,255,0.4);
  font-size: 12px;
  font-family: 'Space Mono', monospace;
}

.new-badge {
  background: #ff6b6b;
  color: #000;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.connection-action {
  color: #4ecdc4;
  font-size: 13px;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: rgba(255,255,255,0.5);
}

.empty-state p {
  margin-bottom: 20px;
}

/* Scanned Profile Preview */
.scanned-profile-preview {
  max-width: 600px;
  margin: 0 auto;
}

/* Create Profile Styles */
.create-profile-steps {
  max-width: 700px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.create-step {
  display: flex;
  gap: 20px;
  padding: 25px;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(78, 205, 196, 0.2);
  border-radius: 12px;
}

.step-number {
  width: 36px;
  height: 36px;
  background: #4ecdc4;
  color: #000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-content h3 {
  color: #fff;
  font-size: 18px;
  margin-bottom: 15px;
  font-weight: 600;
}

.prompt-box {
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(78, 205, 196, 0.2);
  border-radius: 8px;
  padding: 15px;
  max-height: 200px;
  overflow-y: auto;
  font-family: 'Space Mono', monospace;
  color: rgba(255,255,255,0.8);
}

.btn-success {
  background: #4ecdc4 !important;
  color: #000 !important;
}

.json-textarea:focus {
  outline: none;
  border-color: #4ecdc4;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(78,205,196,0.2);
  border-top-color: #4ecdc4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-state h2 {
  font-size: 28px;
  margin-bottom: 12px;
  color: #fff;
}

.empty-state p {
  color: rgba(255,255,255,0.6);
  margin-bottom: 24px;
}

/* Connections List */
.connections-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.connection-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.connection-card:hover {
  background: rgba(78,205,196,0.08);
  border-color: rgba(78,205,196,0.3);
  transform: translateX(4px);
}

.connection-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.connection-name {
  font-weight: 600;
  font-size: 16px;
  color: #fff;
}

.connection-role {
  font-size: 13px;
  color: rgba(255,255,255,0.6);
}

.connection-time {
  font-size: 12px;
  color: rgba(255,255,255,0.4);
}

.connection-status {
  display: flex;
  gap: 8px;
}

.badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-new {
  background: rgba(255,107,107,0.2);
  color: #ff6b6b;
  animation: pulse 2s ease-in-out infinite;
}

.badge-stage1 {
  background: rgba(78,205,196,0.2);
  color: #4ecdc4;
}

.badge-connected {
  background: rgba(78,205,196,0.3);
  color: #4ecdc4;
}

/* Aspect Bar */
.aspect-bar {
  height: 8px;
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
  margin-top: 12px;
  overflow: hidden;
}

.aspect-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4ecdc4, #45b7aa);
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* Proof Points */
.proof-points-list {
  display: grid;
  gap: 16px;
}

.proof-point-card {
  padding: 20px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
}

.proof-name {
  font-weight: 600;
  font-size: 16px;
  color: #4ecdc4;
  margin-bottom: 8px;
}

.proof-description {
  color: rgba(255,255,255,0.8);
  font-size: 14px;
  margin-bottom: 8px;
}

.proof-impact {
  font-size: 13px;
  color: rgba(255,255,255,0.5);
  font-style: italic;
}
`;
