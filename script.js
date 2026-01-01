import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyAlXi4CSvr07HTbu_bV4EGO59MXVjmHf54",
    authDomain: "lakhuteleservices-1f9e0.firebaseapp.com",
    projectId: "lakhuteleservices-1f9e0",
    storageBucket: "lakhuteleservices-1f9e0.firebasestorage.app",
    messagingSenderId: "855678452910",
    appId: "1:855678452910:web:b0347ec8dfd710104c593f",
    measurementId: "G-K12ZEMY8KK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'lakhuteleservices-app';

let currentUser = null;
let currentClient = "Lakhu Teleservices";
let currentScripts = [];
let selectedTestScript = null;
let allClientsCache = [];
let creditBalance = 24.50; // Mock starting balance

// --- Auth & Data Listeners ---
onAuthStateChanged(auth, (user) => {
    const statusDot = document.getElementById('connectionStatus');
    const userDisplay = document.getElementById('userIdDisplay');

    if (user) {
        currentUser = user;
        statusDot.classList.remove('bg-yellow-500', 'bg-danger');
        statusDot.classList.add('bg-success');
        statusDot.title = "Connected to Firebase";
        userDisplay.innerText = `User ID: ${user.uid.slice(0, 8)}...`;
        
        setupClientListener(user.uid);
        
        // Initial Load
        loadClientDashboard("Lakhu Teleservices", "Active");
        loadKnowledgeBase(); // Init Knowledge Base mock
    } else {
        signInAnonymously(auth).catch((error) => {
            console.error("Auth failed:", error);
            userDisplay.innerText = "Connection Failed";
            statusDot.classList.remove('bg-yellow-500');
            statusDot.classList.add('bg-danger');
        });
    }
});

// --- Feature 2: Update Cost/Credit Widget ---
function updateCostWidget() {
    const text = document.getElementById('creditText');
    const bar = document.getElementById('creditBar');
    if(text && bar) {
        text.innerText = `$${creditBalance.toFixed(2)} left`;
        const percentage = Math.max(0, Math.min(100, (creditBalance / 30) * 100)); // Assume $30 is max
        bar.style.width = `${percentage}%`;
        if(creditBalance < 5) bar.className = "bg-red-500 h-1.5 rounded-full transition-all duration-500";
    }
}

// --- Feature 3: Model Switcher Logic ---
function updateModel(select) {
    const model = select.value;
    alert(`System switching to Voice Model ${model}...\nExpect a 2s latency during handover.`);
}

// --- Navigation Logic ---
function showSection(sectionId) {
    document.querySelectorAll('.section-view').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('[id^="nav-"]').forEach(btn => {
        btn.className = "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors";
    });

    const target = document.getElementById(sectionId + 'Area');
    if (target) target.classList.remove('hidden');

    const activeBtn = document.getElementById('nav-' + sectionId);
    if (activeBtn) {
        activeBtn.className = "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg bg-accent-600/10 text-accent-500 border border-accent-600/20 transition-all";
    }
    
    document.getElementById('pageTitle').innerText = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);

    if(sectionId === 'clients') loadClientsPage();
    if(sectionId === 'recordings') loadRecordingsPage();
    if(sectionId === 'knowledge') loadKnowledgeBase();
}

// --- Firestore Logic ---
function setupClientListener(userId) {
    const clientsRef = collection(db, 'artifacts', appId, 'users', userId, 'clients');
    const q = query(clientsRef, orderBy('createdAt', 'desc'));

    onSnapshot(q, (snapshot) => {
        const clientList = document.getElementById('clientList');
        allClientsCache = []; 
        while (clientList.children.length > 1) {
            clientList.removeChild(clientList.lastChild);
        }

        allClientsCache.push({ name: "Lakhu Teleservices", status: "active", goal: "Outbound Sales", recordingsNeeded: 500, fileCount: 523 });

        snapshot.forEach((doc) => {
            const data = doc.data();
            allClientsCache.push(data);
            const btn = document.createElement('button');
            btn.className = "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white border-l-2 border-transparent hover:border-accent-500 transition-all text-left group";
            btn.innerHTML = `<div class="w-2 h-2 rounded-full bg-gray-500 group-hover:bg-accent-500 transition-colors"></div>${data.name}`;
            btn.onclick = () => {
                showSection('dashboard');
                loadClientDashboard(data.name, 'Initializing', data.goal || 'General Purpose', data.fileCount || 0);
            };
            clientList.appendChild(btn);
        });
        
        if(!document.getElementById('clientsArea').classList.contains('hidden')) loadClientsPage();
        if(!document.getElementById('recordingsArea').classList.contains('hidden')) loadRecordingsPage();
    });
}

// --- CLIENTS PAGE LOGIC ---
function loadClientsPage() {
    const grid = document.getElementById('clientsGrid');
    grid.innerHTML = '';
    allClientsCache.forEach(client => {
        const isLakhu = client.name === "Lakhu Teleservices";
        const status = isLakhu ? "Active" : "Initializing";
        const statusColor = isLakhu ? "text-success bg-success/10 border-success/20" : "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
        const progress = isLakhu ? 100 : 0;

        const card = document.createElement('div');
        card.className = "glass-panel p-6 rounded-xl hover:border-accent-500/50 transition-colors cursor-pointer group";
        card.onclick = () => {
             showSection('dashboard');
             loadClientDashboard(client.name, status, client.goal, client.fileCount || (isLakhu ? 523 : 0));
        };
        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div class="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-accent-500 group-hover:bg-accent-600 group-hover:text-white transition-all"><i class="fa-solid fa-building"></i></div>
                <span class="px-2 py-1 rounded text-xs font-medium border ${statusColor}">${status}</span>
            </div>
            <h3 class="text-lg font-bold text-white mb-1">${client.name}</h3>
            <p class="text-sm text-gray-400 mb-4 line-clamp-2">${client.goal || 'Enterprise Voice Model'}</p>
            <div class="space-y-3">
                <div class="flex justify-between text-xs text-gray-500"><span>Training Progress</span><span>${progress}%</span></div>
                <div class="w-full bg-gray-800 rounded-full h-1.5"><div class="bg-accent-500 h-1.5 rounded-full" style="width: ${progress}%"></div></div>
                <div class="flex justify-between items-center pt-2 border-t border-gray-800">
                    <span class="text-xs text-gray-400"><i class="fa-solid fa-microphone mr-1"></i> ${client.fileCount || (isLakhu ? 523 : 0)} recs</span>
                    <span class="text-xs text-accent-500 group-hover:translate-x-1 transition-transform">Manage <i class="fa-solid fa-arrow-right ml-1"></i></span>
                </div>
            </div>`;
        grid.appendChild(card);
    });
}

// --- RECORDINGS PAGE LOGIC ---
function loadRecordingsPage() {
    const tbody = document.getElementById('recordingsTableBody');
    tbody.innerHTML = '';

    allClientsCache.forEach(client => {
        const count = client.fileCount || (client.name === "Lakhu Teleservices" ? 5 : 0);
        const isLakhu = client.name === "Lakhu Teleservices";
        const displayCount = Math.min(count, 5); 
        
        for(let i=1; i<=displayCount; i++) {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-800/30 transition-colors group";
            
            const fileName = isLakhu ? `sample_call_0${i}.wav` : `upload_${client.name.replace(/\s/g,'_').toLowerCase()}_${i}.wav`;
            const date = new Date().toLocaleDateString();
            const size = (Math.random() * (5 - 1) + 1).toFixed(1) + " MB";
            const status = Math.random() > 0.8 ? "Noise Detected" : "Clean";
            const statusClass = status === "Clean" ? "text-success" : "text-warning";
            
            const sentiments = ['Neutral', 'Happy', 'Frustrated'];
            const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
            const sentimentColor = sentiment === 'Happy' ? 'text-green-400' : (sentiment === 'Frustrated' ? 'text-red-400' : 'text-gray-400');
            const qaScore = Math.floor(Math.random() * (100 - 80) + 80);

            tr.innerHTML = `
                <td class="p-4 text-white font-mono text-xs flex items-center gap-2">
                    <i class="fa-solid fa-file-audio text-gray-500"></i> 
                    <div>${fileName} <div class="text-[10px] text-gray-500 hidden group-hover:block cursor-pointer text-accent-500 underline" onclick="toggleTranscript(this)">View Transcript</div></div>
                </td>
                <td class="p-4 text-gray-300">${client.name}</td>
                <td class="p-4"><span class="text-xs font-medium ${sentimentColor}">${sentiment}</span></td>
                <td class="p-4 text-gray-300 font-mono">${qaScore}/100</td>
                <td class="p-4 ${statusClass}">${status}</td>
                <td class="p-4">
                    <button class="text-gray-400 hover:text-white mr-2"><i class="fa-solid fa-play"></i></button>
                    <button class="text-gray-400 hover:text-white"><i class="fa-solid fa-download"></i></button>
                </td>
            `;
            // Transcript Row
            const transcriptRow = document.createElement('tr');
            transcriptRow.className = "hidden bg-gray-900/50";
            transcriptRow.innerHTML = `
                <td colspan="6" class="p-4 text-xs text-gray-400 font-mono border-l-2 border-accent-500">
                    <strong class="text-accent-500">Transcript:</strong> "Hello, I am calling from Lakhu Teleservices regarding your pending payment. Is this a good time to talk?"
                </td>
            `;
            
            tbody.appendChild(tr);
            tbody.appendChild(transcriptRow);
        }
    });
    
    if(tbody.children.length === 0) tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-gray-500">No recordings found.</td></tr>`;
}

function toggleTranscript(el) {
    const row = el.closest('tr').nextElementSibling;
    row.classList.toggle('hidden');
}

function exportData() {
    alert("Generating CSV Report... \nIncludes: File Metadata, Sentiment Analysis, and QA Scores.");
}

// --- ADD CLIENT FORM ---
document.getElementById('addClientForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const name = document.getElementById('newClientName').value;
    const recs = document.getElementById('newClientRecs').value;
    const limit = document.getElementById('newClientLimit').value;
    const goal = document.getElementById('newClientGoal').value;
    const fileInput = document.getElementById('newClientFiles');
    const fileCount = fileInput.files.length;

    if (fileCount > 0) {
        document.getElementById('uploadProgress').classList.remove('hidden');
        const bar = document.getElementById('uploadBar');
        const percent = document.getElementById('uploadPercent');
        for(let i=0; i<=100; i+=10) {
            bar.style.width = i + '%';
            percent.innerText = i + '%';
            await new Promise(r => setTimeout(r, 50));
        }
    }

    const submitBtn = document.getElementById('submitClientBtn');
    submitBtn.innerText = "Saving...";
    
    try {
        const clientsRef = collection(db, 'artifacts', appId, 'users', currentUser.uid, 'clients');
        await addDoc(clientsRef, {
            name: name, recordingsNeeded: recs || 0, usageLimit: limit || 0, goal: goal, fileCount: fileCount, createdAt: serverTimestamp(), status: 'initializing'
        });
        document.getElementById('addClientForm').reset();
        document.getElementById('uploadProgress').classList.add('hidden');
        document.getElementById('uploadPlaceholder').classList.remove('hidden');
        document.getElementById('fileCountDisplay').classList.add('hidden');
        closeModal('addClientModal');
    } catch (error) {
        console.error("Error adding client: ", error);
        alert("Failed to save client.");
    } finally {
        submitBtn.innerText = "Create Client";
    }
});

// --- DASHBOARD LOADER (Deep Stats) ---
function loadClientDashboard(clientName, status, goal = "Customer Information & Urgency Handling", fileCount = 0) {
    currentClient = clientName;
    const isLakhu = clientName === "Lakhu Teleservices";

    // 1. Update Header & Meta
    const headerName = document.getElementById('headerClientName');
    if (headerName) headerName.innerText = clientName + " Outbound";
    
    const mainName = document.getElementById('mainClientName');
    if (mainName) mainName.innerText = clientName;
    
    const modalTitle = document.getElementById('modalClientNameScript');
    if (modalTitle) modalTitle.innerText = clientName;

    const goalDisplay = document.getElementById('clientGoalDisplay');
    if (goalDisplay) goalDisplay.innerHTML = `<i class="fa-solid fa-bullseye text-accent-500 mr-1"></i> Goal: ${goal}`;
    
    // 2. Update Main Status Badge
    const statusEl = document.getElementById('mainClientStatus');
    if (statusEl) {
        statusEl.innerText = status;
        if (status === 'Initializing') {
            statusEl.className = "px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-500 border border-yellow-500/30";
        } else {
            statusEl.className = "px-2 py-0.5 rounded text-xs font-medium bg-success/20 text-success border border-success/30";
        }
    }

    // 3. Update All Dashboard Widgets Explicitly
    const elProgress = document.getElementById('statProgress');
    const elProgressText = document.getElementById('statProgressText');
    const elScripts = document.getElementById('statScripts');
    const elUsage = document.getElementById('statUsage');
    const elBotStatus = document.getElementById('statBotStatus');
    const elLatency = document.getElementById('statLatency');
    const elBotPanel = document.getElementById('botStatusPanel');
    const elClientMeta = document.getElementById('clientMeta');

    if (status === 'Initializing') {
        // --- NEW CLIENT STATE ---
        if(elProgress) elProgress.innerText = "0%";
        if(elProgressText) elProgressText.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing Recordings`;
        
        if(elScripts) elScripts.innerText = "0";
        if(elUsage) elUsage.innerText = "0h";
        
        if(elBotStatus) elBotStatus.innerText = "Training...";
        if(elLatency) elLatency.innerText = "--";
        
        if(elBotPanel) {
            elBotPanel.classList.remove('border-l-success');
            elBotPanel.classList.add('border-l-yellow-500');
        }
        
        if(elClientMeta) elClientMeta.innerText = `Training Queue • ${fileCount} Uploads Pending • v0.1-alpha`;

        // Render Sub-components
        renderScripts(true); 
        renderUploadedFiles(fileCount);
        renderIntegrations(false); // Forced false
        renderLiveCall(false); // Forced false

    } else {
        // --- ACTIVE CLIENT (LAKHU) STATE ---
        if(elProgress) elProgress.innerText = "100%";
        if(elProgressText) elProgressText.innerHTML = `<i class="fa-solid fa-check-circle"></i> Model Ready`;
        
        if(elScripts) elScripts.innerText = "4"; 
        if(elUsage) elUsage.innerText = "124h";
        
        if(elBotStatus) elBotStatus.innerText = "Bot Ready";
        if(elLatency) elLatency.innerText = "45ms";
        
        if(elBotPanel) {
            elBotPanel.classList.remove('border-l-yellow-500');
            elBotPanel.classList.add('border-l-success');
        }
        
        if(elClientMeta) elClientMeta.innerText = "Enterprise Voice Model • Hindi/English Hybrid • v3.2-stable";

        // Render Sub-components
        renderDefaultFiles();
        renderScripts(false);
        renderIntegrations(true); // Forced true for Lakhu
        renderLiveCall(true); // Forced true for Lakhu
    }
}

// --- Feature 4: Dynamic Integrations (Deterministic) ---
function renderIntegrations(isActive) {
    const grid = document.getElementById('integrationsGrid');
    if(!grid) return;
    
    if(!isActive) {
        grid.innerHTML = `<div class="col-span-3 text-xs text-center text-gray-500 py-4 border border-dashed border-gray-800 rounded-lg">Integrations will unlock after training is complete.</div>`;
        return;
    }

    // Hardcoded stable state for "Lakhu"
    grid.innerHTML = `
        <div class="p-3 bg-gray-800/50 rounded border border-gray-700 flex items-center gap-3">
            <i class="fa-brands fa-salesforce text-blue-400 text-xl"></i>
            <div><p class="text-xs text-white">Salesforce</p><p class="text-[10px] text-success">Connected</p></div>
        </div>
        <div class="p-3 bg-gray-800/50 rounded border border-gray-700 flex items-center gap-3 cursor-pointer hover:bg-gray-800" onclick="toggleIntegration(this)">
            <i class="fa-brands fa-hubspot text-orange-500 text-xl"></i>
            <div><p class="text-xs text-white">HubSpot</p><p class="text-[10px] text-gray-500">Paused</p></div>
        </div>
        <div class="p-3 bg-gray-800/50 rounded border border-gray-700 flex items-center gap-3">
            <i class="fa-brands fa-whatsapp text-green-500 text-xl"></i>
            <div><p class="text-xs text-white">WhatsApp</p><p class="text-[10px] text-success">Active</p></div>
        </div>
    `;
}

function toggleIntegration(el) {
    const status = el.querySelector('p:last-child');
    if(status.innerText === 'Paused') {
        status.innerText = 'Active';
        status.className = 'text-[10px] text-success';
    } else {
        status.innerText = 'Paused';
        status.className = 'text-[10px] text-gray-500';
    }
}

// --- Feature 5: Live Call Monitor ---
function renderLiveCall(isActive) {
    const card = document.getElementById('liveCallCard');
    if(!card) return;

    if(!isActive) {
        card.innerHTML = `<div class="p-8 text-center text-gray-500 text-xs">Model offline. No active calls.</div>`;
        return;
    }

    // Deterministic state for active client (Simulated active call)
    card.className = "glass-panel rounded-xl overflow-hidden border-l-2 border-l-red-500";
    card.innerHTML = `
        <div class="p-3 bg-red-500/10 flex justify-between items-center">
            <span class="text-xs text-red-400 font-bold uppercase animate-pulse">● Live Call</span>
            <span class="text-xs text-gray-400">00:${Math.floor(Math.random()*50)+10}</span>
        </div>
        <div class="p-4">
            <p class="text-sm text-white font-medium mb-1">+91 98*** **${Math.floor(Math.random()*1000)}</p>
            <p class="text-xs text-gray-400 mb-3">Intent: <span class="text-accent-400">Payment Inquiry</span></p>
            <button onclick="listenIn()" class="w-full py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-xs text-white border border-gray-600 flex items-center justify-center gap-2">
                <i class="fa-solid fa-headphones"></i> Listen In
            </button>
        </div>
    `;
}

function listenIn() {
    alert("Connecting to secure SIP stream...\n(Audio would play here in production)");
}

// --- Feature 1: Knowledge Base Logic ---
let mockDocs = [
    { name: "Product_Manual_v2.pdf", size: "1.2 MB", date: "2 days ago", status: "Indexed", color: "text-success", bg: "bg-success/10" },
    { name: "Refund_Policy_2025.txt", size: "14 KB", date: "5 mins ago", status: "Processing", color: "text-yellow-500", bg: "bg-yellow-500/10" }
];

function loadKnowledgeBase() {
    const grid = document.getElementById('knowledgeGrid');
    if(!grid) return;
    grid.innerHTML = '';
    
    mockDocs.forEach(doc => {
        const div = document.createElement('div');
        div.className = "glass-panel p-5 rounded-xl border border-gray-700 hover:border-accent-500/50 transition-colors";
        div.innerHTML = `
            <div class="flex items-start justify-between mb-4">
                <i class="fa-solid ${doc.name.endsWith('pdf') ? 'fa-file-pdf text-red-400' : 'fa-file-lines text-blue-400'} text-3xl"></i>
                <span class="text-xs ${doc.bg} ${doc.color} px-2 py-1 rounded">${doc.status}</span>
            </div>
            <h3 class="text-white font-medium truncate">${doc.name}</h3>
            <p class="text-xs text-gray-500 mt-1">${doc.size} • Added ${doc.date}</p>
        `;
        grid.appendChild(div);
    });
}

function addDocument() {
    // Simulate adding a doc
    mockDocs.unshift({ name: "New_Upload_" + Math.floor(Math.random()*100) + ".pdf", size: "0.5 MB", date: "Just now", status: "Scanning...", color: "text-blue-400", bg: "bg-blue-500/10" });
    loadKnowledgeBase();
}

// --- Feature 10: Settings Logic ---
function regenerateApiKey() {
    const input = document.getElementById('apiKeyInput');
    const newKey = "sk_live_" + Math.random().toString(36).substr(2, 18);
    input.value = newKey;
    alert("New Production Key Generated. Previous key revoked.");
}

function renderScripts(isNew) {
    const container = document.getElementById('scriptsContainer');
    if(isNew) {
        currentScripts = []; 
        container.innerHTML = `<div class="col-span-2 border border-dashed border-gray-700 rounded-lg p-6 text-center"><i class="fa-solid fa-wand-magic-sparkles text-gray-600 text-xl mb-2"></i><p class="text-gray-400 text-sm">AI is generating conversation flows...</p><p class="text-gray-600 text-xs">Based on uploaded recordings and goal.</p></div>`;
    } else {
        currentScripts = [
            { name: "Mahatvapurn Jankari", type: "Info Call", status: "ready" },
            { name: "Last Date hai", type: "Urgency", status: "ready" },
            { name: "Chalu Ya Band", type: "Status Check", status: "ready" },
            { name: "Band ho chuka hai", type: "Closed Status", status: "ready" },
            { name: "Payment Integration", type: "Collections", status: "dev" }
        ];
        let html = '';
        currentScripts.forEach(script => {
            const statusColor = script.status === 'ready' ? 'text-success' : 'text-yellow-500';
            const iconClass = script.status === 'ready' ? 'fa-check' : 'fa-code';
            html += `<div class="script-badge p-3 rounded-lg bg-gray-800/50 border border-gray-700 flex items-center justify-between"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded bg-gray-700 flex items-center justify-center text-accent-400"><i class="fa-solid fa-scroll"></i></div><div><p class="text-sm font-medium text-white">${script.name}</p><p class="text-xs text-gray-500">${script.type}</p></div></div><div class="flex items-center gap-1.5 ${statusColor} text-xs font-medium border border-current rounded px-1.5 py-0.5 opacity-80"><i class="fa-solid ${iconClass}"></i> ${script.status === 'ready' ? 'Ready' : 'Dev'}</div></div>`;
        });
        container.innerHTML = html;
    }
}

function renderDefaultFiles() {
    document.getElementById('fileList').innerHTML = `<div class="p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer group transition-colors"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded bg-indigo-900/50 text-indigo-400 flex items-center justify-center text-xs font-mono border border-indigo-500/20">PTH</div><div class="flex-1 min-w-0"><p class="text-sm font-medium text-white truncate">lakhu_outbound_v3.pth</p><p class="text-xs text-gray-500">Trained Model • 245MB</p></div><button class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white"><i class="fa-solid fa-download"></i></button></div></div><p class="text-xs font-semibold text-gray-500 px-3 py-2 uppercase mt-2">Recent Recordings</p><div class="p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer group transition-colors"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded bg-gray-800 text-gray-400 flex items-center justify-center text-xs"><i class="fa-solid fa-file-audio"></i></div><div class="flex-1 min-w-0"><p class="text-sm font-medium text-gray-300 truncate">sample_call_04.wav</p><p class="text-xs text-gray-500">Lakhu • 1.2MB</p></div><span class="text-xs bg-success/10 text-success px-1.5 py-0.5 rounded border border-success/20">Clean</span></div></div>`;
}

function renderUploadedFiles(count) {
    const list = document.getElementById('fileList');
    if(count === 0) {
        list.innerHTML = `<p class="text-xs text-gray-500 text-center py-4">No assets uploaded.</p>`;
        document.getElementById('currentRecs').innerText = "0 Samples";
    } else {
        let html = `<p class="text-xs font-semibold text-gray-500 px-3 py-2 uppercase">Uploaded Batch (${count})</p>`;
        for(let i=1; i<=Math.min(count, 5); i++) {
            html += `<div class="p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer group transition-colors"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded bg-gray-800 text-gray-400 flex items-center justify-center text-xs"><i class="fa-solid fa-file-audio"></i></div><div class="flex-1 min-w-0"><p class="text-sm font-medium text-gray-300 truncate">recording_upload_${i}.wav</p><p class="text-xs text-gray-500">Pending Processing</p></div><span class="text-xs bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/20">Queue</span></div></div>`;
        }
        list.innerHTML = html;
        document.getElementById('currentRecs').innerText = count + " Samples";
    }
}

// --- Testing Modal Logic ---
function initiateTestingFlow() {
    const btn = document.getElementById('startTestBtn');
    const originalContent = btn.innerHTML;
    btn.classList.add('btn-loading');
    btn.innerHTML = 'Fetching Scripts...';
    setTimeout(() => {
        btn.classList.remove('btn-loading');
        btn.innerHTML = originalContent;
        openModal('testingModal');
        populateScriptSelection();
    }, 800);
}

function populateScriptSelection() {
    const list = document.getElementById('scriptSelectionList');
    list.innerHTML = '';
    let scriptsToShow = currentScripts.length > 0 ? currentScripts : [
        { name: "General Inquiry (Default)", type: "Untrained Flow", status: "ready" },
        { name: "Greeting & Handoff", type: "Untrained Flow", status: "ready" }
    ];
    scriptsToShow.forEach(script => {
        const isReady = script.status === 'ready';
        const statusColor = isReady ? 'bg-green-500' : 'bg-yellow-500';
        const cursorClass = isReady ? 'cursor-pointer hover:bg-gray-800 hover:border-gray-500' : 'cursor-not-allowed opacity-60 bg-gray-900/50';
        const div = document.createElement('div');
        div.className = `p-3 rounded-lg border border-gray-700 transition-all flex justify-between items-center group ${cursorClass}`;
        div.innerHTML = `<div class="flex items-center gap-3"><div class="w-2 h-2 rounded-full ${statusColor}"></div><div><p class="text-sm font-medium text-white group-hover:text-accent-400">${script.name}</p><p class="text-xs text-gray-500">${script.type}</p></div></div>${isReady ? '<i class="fa-regular fa-circle text-gray-600 group-hover:text-accent-500"></i>' : '<span class="text-xs text-yellow-500 font-mono">[DEV]</span>'}`;
        if(isReady) {
            div.onclick = function() {
                Array.from(list.children).forEach(c => { if(!c.classList.contains('cursor-not-allowed')) { c.classList.remove('bg-gray-800', 'border-accent-500'); const icon = c.querySelector('i'); if(icon) { icon.classList.replace('fa-circle-check', 'fa-circle'); icon.classList.remove('text-accent-500'); } } });
                div.classList.add('bg-gray-800', 'border-accent-500');
                const icon = div.querySelector('i');
                icon.classList.replace('fa-circle', 'fa-circle-check');
                icon.classList.add('text-accent-500');
                selectedTestScript = script.name;
                const nextBtn = document.getElementById('scriptNextBtn');
                nextBtn.disabled = false;
                nextBtn.classList.remove('bg-gray-800', 'text-gray-500', 'cursor-not-allowed');
                nextBtn.classList.add('bg-accent-600', 'text-white', 'hover:bg-accent-500');
                nextBtn.innerText = "Continue to Phone Number";
            }
        }
        list.appendChild(div);
    });
}

function runTestSequence() {
    const phone = document.getElementById('testPhone').value;
    if(!phone || phone.length < 10) { alert("Please enter a valid phone number."); return; }
    
    // Feature 2 Logic: Deduct Cost
    creditBalance -= 0.50; 
    updateCostWidget();

    const btn = document.getElementById('runTestBtn');
    const originalBtnText = btn.innerHTML;
    btn.disabled = true;
    btn.classList.add('btn-loading');
    btn.innerHTML = 'Starting Simulation...';
    setTimeout(() => {
        btn.classList.remove('btn-loading');
        btn.innerHTML = originalBtnText;
        btn.disabled = false;
        document.getElementById('testStep1').classList.add('hidden');
        document.getElementById('testStep2').classList.remove('hidden');
        const terminal = document.getElementById('terminalOutput');
        terminal.innerHTML = ''; 
        const steps = [
            { msg: `> Initializing Session for: ${selectedTestScript}`, delay: 200, color: 'text-accent-400' },
            { msg: `> Connecting to +91 ${phone}...`, delay: 800 },
            { msg: `> Loading script logic nodes... [OK]`, delay: 1500 },
            { msg: `> Verifying intent triggers...`, delay: 2200 },
            { msg: `> [SUCCESS] Audio Stream #992 Active`, delay: 3000, color: 'text-green-400' },
            { msg: `> Dialing out...`, delay: 3800 },
        ];
        steps.forEach(step => { setTimeout(() => { const line = document.createElement('div'); line.className = `terminal-line ${step.color || ''}`; line.innerText = step.msg; terminal.appendChild(line); terminal.scrollTop = terminal.scrollHeight; }, step.delay); });
        setTimeout(() => {
            document.getElementById('testStep2').classList.add('hidden');
            document.getElementById('testStep3').classList.remove('hidden');
            document.getElementById('confirmPhone').innerText = "+91 " + phone;
            document.getElementById('successScriptDisplay').innerText = selectedTestScript;
            const hours = 1;
            const mins = Math.floor(Math.random() * (15 - 10 + 1) + 10); 
            document.getElementById('dynamicTime').innerText = `${hours} hour ${mins} min`;
        }, 4500);
    }, 1200);
}

// --- Helpers exposed to Window ---
function openModal(id) {
    const modal = document.getElementById(id);
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); modal.querySelector('div').classList.remove('scale-95'); modal.querySelector('div').classList.add('scale-100'); }, 10);
    if(id === 'testingModal') {
        document.getElementById('testStep0').classList.remove('hidden');
        document.getElementById('testStep1').classList.add('hidden');
        document.getElementById('testStep2').classList.add('hidden');
        document.getElementById('testStep3').classList.add('hidden');
        document.getElementById('testPhone').value = '';
        const nextBtn = document.getElementById('scriptNextBtn');
        nextBtn.disabled = true;
        nextBtn.classList.add('bg-gray-800', 'text-gray-500', 'cursor-not-allowed');
        nextBtn.classList.remove('bg-accent-600', 'text-white', 'hover:bg-accent-500');
        nextBtn.innerText = "Select a Ready Script";
    }
}
function closeModal(id) { const modal = document.getElementById(id); modal.classList.add('opacity-0'); modal.querySelector('div').classList.remove('scale-100'); modal.querySelector('div').classList.add('scale-95'); setTimeout(() => { modal.classList.add('hidden'); }, 300); }
function goToPhoneInput() { document.getElementById('testStep0').classList.add('hidden'); document.getElementById('testStep1').classList.remove('hidden'); document.getElementById('selectedScriptNameDisplay').innerText = selectedTestScript; }
function backToScripts() { document.getElementById('testStep1').classList.add('hidden'); document.getElementById('testStep0').classList.remove('hidden'); }
function updateFileCount(input) { const count = input.files.length; document.getElementById('uploadPlaceholder').classList.add('hidden'); document.getElementById('fileCountDisplay').classList.remove('hidden'); document.getElementById('fileCountNum').innerText = count; }

document.addEventListener('DOMContentLoaded', () => {
    updateCostWidget(); // Init cost
    const ctx = document.getElementById('recordingsChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
    new Chart(ctx, { type: 'line', data: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [{ label: 'Recordings', data: [12, 19, 3, 5, 2, 30, 45], borderColor: '#3B82F6', backgroundColor: gradient, borderWidth: 2, tension: 0.4, pointBackgroundColor: '#1F2937', fill: true }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { display: false }, x: { display: false } } } });
    const container = document.getElementById('liveLogs');
    const p = document.createElement('p');
    p.className = "text-gray-400";
    p.innerHTML = `<span class="text-blue-500">[SYSTEM]</span> Dashboard loaded. Ready for input.`;
    container.appendChild(p);
});

// --- EXPOSE TO WINDOW ---
window.loadClientDashboard = loadClientDashboard;
window.openModal = openModal;
window.closeModal = closeModal;
window.initiateTestingFlow = initiateTestingFlow;
window.runTestSequence = runTestSequence;
window.populateScriptSelection = populateScriptSelection;
window.goToPhoneInput = goToPhoneInput;
window.backToScripts = backToScripts;
window.updateFileCount = updateFileCount;
window.showSection = showSection;
window.toggleTranscript = toggleTranscript;
window.exportData = exportData;
window.toggleIntegration = toggleIntegration;
window.listenIn = listenIn;
window.addDocument = addDocument;
window.regenerateApiKey = regenerateApiKey;
window.updateModel = updateModel;
