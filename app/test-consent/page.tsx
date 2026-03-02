'use client';

import { useState } from 'react';

export default function TestConsentPage() {
  const [log, setLog] = useState<string[]>([]);
  const [handshakeId, setHandshakeId] = useState('43d3c9ae-8462-4e5c-a9b7-650c72dc595e');
  const [profileA, setProfileA] = useState('b76fe4b2-3d38-4c27-9799-4ce50121b1e4');
  const [profileB, setProfileB] = useState('9201be4d-3631-4753-9ec5-d5f436d190b0');
  const [handshakeData, setHandshakeData] = useState<any>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLog(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const createHandshake = async () => {
    try {
      addLog('Creating handshake...');
      const res = await fetch('/api/create-handshake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initiatorId: profileA,
          recipientId: profileB,
        }),
      });
      const data = await res.json();
      addLog(`Response: ${JSON.stringify(data)}`);
      if (data.handshakeId) {
        setHandshakeId(data.handshakeId);
        addLog(`✅ Handshake created: ${data.handshakeId}`);
      }
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
    }
  };

  const checkStatus = async () => {
    try {
      addLog('Checking handshake status...');
      const res = await fetch(`/api/get-handshake?id=${handshakeId}`);
      const data = await res.json();
      addLog(`Response: ${JSON.stringify(data, null, 2)}`);
      setHandshakeData(data.handshake);
      setAnalysisData(data.analysis);

      if (data.analysis?.analysis_status) {
        addLog(`📊 Analysis status: ${data.analysis.analysis_status}`);
      }
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
    }
  };

  const triggerAnalysis = async () => {
    try {
      setLoading(true);
      addLog('Triggering Stage 1 analysis... (this may take 10-20 seconds)');
      const res = await fetch('/api/analyze-stage1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handshakeId }),
      });
      const data = await res.json();
      addLog(`Response: ${JSON.stringify(data, null, 2)}`);
      if (data.success) {
        addLog('✅ Analysis completed!');
        await checkStatus();
      } else if (data.error) {
        addLog(`❌ Analysis failed: ${data.error}`);
      }
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const grantConsent = async (isInitiator: boolean) => {
    addLog(`⚠️ Consent API not implemented yet (would grant for ${isInitiator ? 'initiator' : 'recipient'})`);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#fff', color: '#000' }}>
      <h1 style={{ marginBottom: '20px', color: '#000' }}>Consent Flow Debug Page</h1>
      {loading && <div style={{ padding: '10px', backgroundColor: '#ff0', color: '#000', fontWeight: 'bold', marginBottom: '10px' }}>⏳ Loading...</div>}

      <div style={{ marginBottom: '20px', padding: '15px', border: '2px solid #000' }}>
        <h2 style={{ color: '#000' }}>Step 1: Create Handshake</h2>
        <div style={{ marginTop: '10px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label>Profile A ID: </label>
            <input
              type="text"
              value={profileA}
              onChange={(e) => setProfileA(e.target.value)}
              style={{ width: '400px', padding: '5px', border: '1px solid #000' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Profile B ID: </label>
            <input
              type="text"
              value={profileB}
              onChange={(e) => setProfileB(e.target.value)}
              style={{ width: '400px', padding: '5px', border: '1px solid #000' }}
            />
          </div>
          <button onClick={createHandshake} style={{ padding: '8px 20px', border: '2px solid #000', cursor: 'pointer' }}>
            CREATE HANDSHAKE
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '2px solid #000' }}>
        <h2 style={{ color: '#000' }}>Step 2: Check Status & Trigger Analysis</h2>
        <div style={{ marginTop: '10px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label>Handshake ID: </label>
            <input
              type="text"
              value={handshakeId}
              onChange={(e) => setHandshakeId(e.target.value)}
              style={{ width: '400px', padding: '5px', border: '1px solid #000', marginRight: '10px' }}
            />
          </div>
          <button onClick={checkStatus} style={{ padding: '8px 20px', border: '2px solid #000', marginRight: '10px', cursor: 'pointer' }}>
            CHECK STATUS
          </button>
          <button
            onClick={triggerAnalysis}
            disabled={loading}
            style={{ padding: '8px 20px', border: '2px solid #000', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.5 : 1 }}
          >
            {loading ? 'ANALYZING...' : 'TRIGGER ANALYSIS'}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '2px solid #000' }}>
        <h2 style={{ color: '#000' }}>Step 3: Grant Consent (Stage 2)</h2>
        <button onClick={() => grantConsent(true)} style={{ padding: '8px 20px', border: '2px solid #000', marginRight: '10px', cursor: 'pointer' }}>
          GRANT CONSENT (Initiator)
        </button>
        <button onClick={() => grantConsent(false)} style={{ padding: '8px 20px', border: '2px solid #000', cursor: 'pointer' }}>
          GRANT CONSENT (Recipient)
        </button>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '2px solid #000', backgroundColor: '#f5f5f5' }}>
        <h2 style={{ color: '#000' }}>Current State</h2>
        {handshakeData && (
          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ color: '#000' }}>Handshake:</h3>
            <pre style={{ fontSize: '11px', overflow: 'auto', padding: '10px', backgroundColor: '#fff', border: '1px solid #ccc' }}>
              {JSON.stringify(handshakeData, null, 2)}
            </pre>
          </div>
        )}
        {analysisData && (
          <div>
            <h3 style={{ color: '#000' }}>Analysis:</h3>
            <pre style={{ fontSize: '11px', overflow: 'auto', padding: '10px', backgroundColor: '#fff', border: '1px solid #ccc' }}>
              {JSON.stringify(analysisData, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div style={{ padding: '15px', border: '2px solid #000', backgroundColor: '#000', color: '#0f0' }}>
        <h2 style={{ color: '#0f0' }}>Debug Log</h2>
        <div style={{ maxHeight: '300px', overflow: 'auto', fontSize: '11px', fontFamily: 'monospace' }}>
          {log.length === 0 && <div>No logs yet...</div>}
          {log.map((entry, i) => (
            <div key={i}>{entry}</div>
          ))}
        </div>
        <button
          onClick={() => setLog([])}
          style={{ marginTop: '10px', padding: '5px 15px', backgroundColor: '#333', color: '#0f0', border: '1px solid #0f0', cursor: 'pointer' }}
        >
          CLEAR LOG
        </button>
      </div>
    </div>
  );
}
