// API client — proxied through Vite to http://localhost:4000 (or backend in prod)
// Falls back to MOCK DATA when server is unreachable so the UI is fully testable.

const BASE = '/api';

// ─── Mock data library ──────────────────────────────────────────────────────
const MOCK = {
    '/dashboard/kpis': {
        activeCalls: 47, avgMOS: '4.2', slaPercent: 97.3, apiFallbackRate: 0.8,
        aiAgentsAvailable: 8, humanAgentsAvailable: 3, queueDepth: 6,
    },
    '/dashboard/ab-test': {
        winner: 'champion', confidence: 94,
        champion: { model: 'gemini-1.5-pro', csat: 4.7, avgDuration: 142, conversions: 31 },
        challenger: { model: 'gemini-flash', csat: 4.4, avgDuration: 118, conversions: 27 },
    },
    '/dashboard/events': [
        { id: 1, type: 'CALL_STARTED', message: 'New inbound call from +91-98765-43210', severity: 'info', createdAt: new Date().toISOString() },
        { id: 2, type: 'AGENT_ESCALATION', message: 'Agent Alpha escalated call to human', severity: 'warning', createdAt: new Date(Date.now() - 60000).toISOString() },
        { id: 3, type: 'SLA_BREACH', message: 'Queue wait exceeded 90s threshold', severity: 'error', createdAt: new Date(Date.now() - 120000).toISOString() },
        { id: 4, type: 'CAMPAIGN_COMPLETE', message: 'Campaign "Morning Leads" completed 200 calls', severity: 'info', createdAt: new Date(Date.now() - 180000).toISOString() },
    ],
    '/supervisor/calls': [
        { id: 'c1', caller: '+91-98765-43210', agent: 'Alpha Agent', duration: 142, status: 'active', sentiment: 'positive', mos: 4.3 },
        { id: 'c2', caller: '+91-87654-32109', agent: 'Beta Agent', duration: 87, status: 'active', sentiment: 'neutral', mos: 4.0 },
        { id: 'c3', caller: '+91-76543-21098', agent: 'Gamma Agent', duration: 213, status: 'hold', sentiment: 'negative', mos: 3.7 },
    ],
    '/agents': [
        { id: 'a1', name: 'Alpha Agent', status: 'active', language: 'en-IN', calls: 1247, csat: 4.7, model: 'gemini-1.5-pro' },
        { id: 'a2', name: 'Beta Agent', status: 'active', language: 'hi-IN', calls: 983, csat: 4.5, model: 'gemini-flash' },
        { id: 'a3', name: 'Gamma Agent', status: 'inactive', language: 'en-IN', calls: 456, csat: 4.2, model: 'gemini-1.5-pro' },
    ],
    '/knowledge': [
        { id: 'k1', name: 'Product FAQ.pdf', status: 'indexed', chunks: 142, updatedAt: new Date().toISOString() },
        { id: 'k2', name: 'Return Policy.docx', status: 'indexed', chunks: 38, updatedAt: new Date().toISOString() },
        { id: 'k3', name: 'Shipping Guide.pdf', status: 'processing', chunks: 0, updatedAt: new Date().toISOString() },
    ],
    '/analytics/calls': [
        { id: 'l1', caller: '+91-98765-43210', agent: 'Alpha Agent', duration: 142, status: 'completed', sentiment: 'positive', createdAt: new Date().toISOString() },
        { id: 'l2', caller: '+91-87654-32109', agent: 'Beta Agent', duration: 87, status: 'completed', sentiment: 'neutral', createdAt: new Date().toISOString() },
        { id: 'l3', caller: '+91-76543-21098', agent: 'Gamma Agent', duration: 35, status: 'missed', sentiment: 'negative', createdAt: new Date().toISOString() },
    ],
    '/analytics/stats': {
        totalCalls: 14872, avgDuration: 134, csat: 4.5, missedRate: 3.2,
        topHour: '11:00', sentiment: { positive: 62, neutral: 28, negative: 10 },
    },
    '/dialer/campaigns': [
        { id: 'dc1', name: 'Morning Leads Q1', status: 'running', total: 500, called: 320, answered: 210, agent: 'Alpha Agent', createdAt: new Date().toISOString() },
        { id: 'dc2', name: 'Re-engagement Feb', status: 'paused', total: 200, called: 95, answered: 68, agent: 'Beta Agent', createdAt: new Date().toISOString() },
    ],
    '/followups': [
        { id: 'f1', caller: '+91-98765-43210', reason: 'Requested callback for billing query', status: 'pending', dueAt: new Date(Date.now() + 86400000).toISOString() },
        { id: 'f2', caller: '+91-87654-32109', reason: 'Escalated — needs manager call', status: 'in_progress', dueAt: new Date(Date.now() + 3600000).toISOString() },
    ],
    '/routing/rules': [
        { id: 'r1', name: 'VIP Customers', condition: 'caller_tier == VIP', target: 'Alpha Agent', priority: 1, active: true },
        { id: 'r2', name: 'Hindi Language', condition: 'language == hi', target: 'Beta Agent', priority: 2, active: true },
    ],
    '/integrations': [
        { id: 'crm', name: 'Salesforce CRM', connected: true, icon: '🔵' },
        { id: 'helpdesk', name: 'Freshdesk', connected: false, icon: '🟢' },
        { id: 'calendar', name: 'Google Calendar', connected: true, icon: '🔴' },
    ],
    '/security/voice-signatures': [
        { id: 's1', name: 'John Doe', enrolled: true, createdAt: new Date().toISOString() },
        { id: 's2', name: 'Jane Smith', enrolled: false, createdAt: new Date().toISOString() },
    ],
    '/settings/api-keys': [
        { id: 'key1', name: 'Production Key', prefix: 'cx_prod_****', createdAt: new Date().toISOString() },
        { id: 'key2', name: 'Staging Key', prefix: 'cx_stg_****', createdAt: new Date().toISOString() },
    ],
    '/settings/webhooks': [
        { id: 'wh1', url: 'https://your-app.com/webhook', events: ['call.ended', 'call.escalated'], active: true },
    ],
    '/billing/stats': {
        planName: 'Enterprise', minutesUsed: 14872, minutesLimit: 50000,
        costThisMonth: 1247.80, costLastMonth: 1089.40, nextBillingDate: '2026-04-01',
    },
};

function getMock(path) {
    // Strip query strings for matching
    const cleanPath = path.split('?')[0];
    // Match exact or prefix
    for (const key of Object.keys(MOCK)) {
        if (cleanPath === key || cleanPath.startsWith(key + '/')) {
            return MOCK[key];
        }
    }
    return [];
}

// ─── Fetch wrapper ───────────────────────────────────────────────────────────
export async function apiFetch(path, options = {}) {
    try {
        const res = await fetch(`${BASE}${path}`, {
            headers: { 'Content-Type': 'application/json', ...options.headers },
            ...options,
            body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body,
        });
        if (!res.ok) throw new Error(`API error ${res.status}`);
        return res.json();
    } catch (err) {
        console.warn(`[API] ${path} failed (${err.message}) — using mock data`);
        const mock = getMock(path);
        // For mutations (POST/PATCH/DELETE), return a success-like object
        if (options.method && options.method !== 'GET') {
            return mock && typeof mock === 'object' && !Array.isArray(mock)
                ? { ...mock, _mock: true }
                : { success: true, _mock: true };
        }
        return mock;
    }
}

export const api = {
    // Generic methods
    get: (path) => apiFetch(path),
    post: (path, data) => apiFetch(path, { method: 'POST', body: data }),
    patch: (path, data) => apiFetch(path, { method: 'PATCH', body: data }),
    delete: (path) => apiFetch(path, { method: 'DELETE' }),

    // Dashboard
    kpis: () => apiFetch('/dashboard/kpis'),
    abTest: () => apiFetch('/dashboard/ab-test'),
    events: () => apiFetch('/dashboard/events'),

    // Supervisor
    activeCalls: () => apiFetch('/supervisor/calls'),
    simulateCall: (data) => apiFetch('/supervisor/calls', { method: 'POST', body: data }),
    endCall: (id) => apiFetch(`/supervisor/calls/${id}/end`, { method: 'PATCH' }),
    whisper: (id, message) => apiFetch(`/supervisor/calls/${id}/whisper`, { method: 'POST', body: { message } }),
    exportReports: (type, range) => apiFetch(`/reports/export?type=${type}&range=${range}`, { method: 'GET' }),

    // Follow Ups
    followups: () => apiFetch('/followups'),
    createFollowUp: (data) => apiFetch('/followups', { method: 'POST', body: data }),
    setFollowUpStatus: (id, status) => apiFetch(`/followups/${id}/status`, { method: 'PATCH', body: { status } }),
    barge: (id) => apiFetch(`/supervisor/calls/${id}/barge`, { method: 'POST' }),
    transcript: (id) => apiFetch(`/supervisor/calls/${id}/transcript`),

    // Agents
    agents: () => apiFetch('/agents'),
    agent: (id) => apiFetch(`/agents/${id}`),
    createAgent: (data) => apiFetch('/agents', { method: 'POST', body: data }),
    updateAgent: (id, data) => apiFetch(`/agents/${id}`, { method: 'PATCH', body: data }),
    deleteAgent: (id) => apiFetch(`/agents/${id}`, { method: 'DELETE' }),
    agentPromptVersions: (id) => apiFetch(`/agents/${id}/prompt-versions`),
    savePromptVersion: (id, data) => apiFetch(`/agents/${id}/prompt-version`, { method: 'POST', body: data }),
    setAgentStatus: (id, status) => apiFetch(`/agents/${id}/status`, { method: 'PATCH', body: { status } }),

    // Knowledge
    docs: () => apiFetch('/knowledge'),
    uploadDoc: (formData) => fetch(`${BASE}/knowledge`, { method: 'POST', body: formData }).then(r => r.json()).catch(() => ({ success: true, _mock: true })),
    deleteDoc: (id) => apiFetch(`/knowledge/${id}`, { method: 'DELETE' }),
    resyncDoc: (id) => apiFetch(`/knowledge/${id}/resync`, { method: 'POST' }),

    // Simulation
    runBatch: (data) => apiFetch('/simulation/batch', { method: 'POST', body: data }),
    runAdversarial: (data) => apiFetch('/simulation/adversarial', { method: 'POST', body: data }),

    // Dialer
    campaigns: () => apiFetch('/dialer/campaigns'),
    createCampaign: (data) => apiFetch('/dialer/campaigns', { method: 'POST', body: data }),
    updateCampaign: (id, data) => apiFetch(`/dialer/campaigns/${id}`, { method: 'PATCH', body: data }),
    setCampaignStatus: (id, status) => apiFetch(`/dialer/campaigns/${id}/status`, { method: 'PATCH', body: { status } }),
    deleteCampaign: (id) => apiFetch(`/dialer/campaigns/${id}`, { method: 'DELETE' }),

    // Analytics & Billing
    callLogs: (params = '') => apiFetch(`/analytics/calls${params}`),
    callDetail: (id) => apiFetch(`/analytics/calls/${id}`),
    triggerACW: (id) => apiFetch(`/analytics/calls/${id}/acw`, { method: 'POST' }),
    analyticsStats: () => apiFetch('/analytics/stats'),
    billingStats: () => apiFetch('/billing/stats'),

    // Routing
    routingRules: () => apiFetch('/routing/rules'),
    createRule: (data) => apiFetch('/routing/rules', { method: 'POST', body: data }),
    updateRule: (id, data) => apiFetch(`/routing/rules/${id}`, { method: 'PATCH', body: data }),
    deleteRule: (id) => apiFetch(`/routing/rules/${id}`, { method: 'DELETE' }),

    // Integrations
    integrations: () => apiFetch('/integrations'),
    connectIntegration: (id, config) => apiFetch(`/integrations/${id}/connect`, { method: 'PATCH', body: { config } }),
    disconnectIntegration: (id) => apiFetch(`/integrations/${id}/disconnect`, { method: 'PATCH' }),

    // Security
    voiceSignatures: () => apiFetch('/security/voice-signatures'),
    createVoiceSig: (data) => apiFetch('/security/voice-signatures', { method: 'POST', body: data }),
    deleteVoiceSig: (id) => apiFetch(`/security/voice-signatures/${id}`, { method: 'DELETE' }),

    // Settings
    apiKeys: () => apiFetch('/settings/api-keys'),
    createApiKey: (data) => apiFetch('/settings/api-keys', { method: 'POST', body: data }),
    deleteApiKey: (id) => apiFetch(`/settings/api-keys/${id}`, { method: 'DELETE' }),
    webhooks: () => apiFetch('/settings/webhooks'),
    createWebhook: (data) => apiFetch('/settings/webhooks', { method: 'POST', body: data }),
    updateWebhook: (id, data) => apiFetch(`/settings/webhooks/${id}`, { method: 'PATCH', body: data }),
    deleteWebhook: (id) => apiFetch(`/settings/webhooks/${id}`, { method: 'DELETE' }),
    testWebhook: (id) => apiFetch(`/settings/webhooks/${id}/test`, { method: 'POST' }),
};
