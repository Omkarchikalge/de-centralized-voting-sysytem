// Global state
let currentAccount = null;
let elections = [];
let votes = {};
let authLevel = 0; // 0: none, 1: wallet, 2: biometric, 3: 2FA
let encryptionKey = null;
let currentTheme = 'light';

// Chart instances map
const charts = {};

// Initialize the app
document.addEventListener('DOMContentLoaded', function () {
    initializeTheme();
    initializeAnimations();
    loadFromStorage();
    updateUI();
    updateStats();
    updateBlockchainStatus(currentAccount ? 'online' : 'offline');
    setupThemeToggle();
    setupEventListeners();
});

// Theme management
function initializeTheme() {
    const savedTheme = localStorage.getItem('decentralvote_theme') || 'light';
    currentTheme = savedTheme;
    document.documentElement.setAttribute('data-theme', currentTheme);
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('decentralvote_theme', currentTheme);

    // Add theme transition animation
    document.body.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    setTimeout(() => {
        document.body.style.transition = '';
    }, 500);

    showNotification(`Switched to ${currentTheme} mode! 🎨`, 'info');
}

function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', toggleTheme);
}

// Initialize animations and interactions
function initializeAnimations() {
    // Staggered card animations
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });

    // Header click animation
    const header = document.querySelector('.header');
    if (header) {
        header.addEventListener('click', () => {
            header.style.transform = 'scale(0.98)';
            setTimeout(() => {
                header.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    header.style.transform = '';
                }, 200);
            }, 100);
            showNotification('🎉 Welcome to DecentralVote!', 'info');
        });
    }

    // Footer interaction
    const footer = document.querySelector('.footer');
    if (footer) {
        footer.addEventListener('click', () => {
            const icons = footer.querySelectorAll('.footer-icon');
            icons.forEach((icon, index) => {
                setTimeout(() => {
                    icon.style.transform = 'scale(1.5) rotate(360deg)';
                    setTimeout(() => {
                        icon.style.transform = '';
                    }, 600);
                }, index * 100);
            });
            showNotification('🚀 Thanks for using DecentralVote!', 'success');
        });
    }
}

// Setup event listeners
function setupEventListeners() {
    // Wallet connection
    const connectBtn = document.getElementById('connectWallet');
    if (connectBtn) connectBtn.addEventListener('click', connectWallet);

    // Authentication buttons
    const bioBtn = document.getElementById('biometricAuth');
    if (bioBtn) bioBtn.addEventListener('click', biometricAuth);
    const twoFaBtn = document.getElementById('twoFactorAuth');
    if (twoFaBtn) twoFaBtn.addEventListener('click', twoFactorAuth);

    // Create election form
    const form = document.getElementById('createElectionForm');
    if (form) form.addEventListener('submit', createElection);
}

// Wallet connection simulation
async function connectWallet() {
    const button = document.getElementById('connectWallet');
    if (!button) return;
    button.disabled = true;
    button.textContent = 'Connecting...';

    try {
        // Simulate wallet connection
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Generate a mock wallet address
        currentAccount = '0x' + Math.random().toString(16).substr(2, 40);
        authLevel = 1;

        document.getElementById('walletInfo').classList.remove('hidden');
        document.getElementById('walletAddress').textContent = currentAccount.substr(0, 6) + '...' + currentAccount.substr(-4);

        button.textContent = '✅ Connected';
        showNotification('Wallet connected successfully! Please complete additional authentication.', 'success');
        updateAuthStatus();
        updateBlockchainStatus('online');
        loadFromStorage();  // reload elections from localStorage
        updateUI();         // rebuild the elections grid



    } catch (error) {
        showNotification('Failed to connect wallet', 'error');
        button.disabled = false;
        button.textContent = 'Connect Wallet';
    }
}

// Biometric authentication simulation
async function biometricAuth() {
    if (!currentAccount) {
        showNotification('Please connect wallet first', 'error');
        return;
    }

    const button = document.getElementById('biometricAuth');
    if (!button) return;
    button.disabled = true;
    button.textContent = '🔍 Scanning...';

    try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        authLevel = Math.max(authLevel, 2);
        button.textContent = '✅ Verified';
        showNotification('Biometric authentication successful!', 'success');
        updateAuthStatus();
        loadFromStorage();  // reload elections from localStorage
        updateUI();         // rebuild the elections grid

    } catch (error) {
        button.disabled = false;
        button.textContent = 'Biometric Auth';
        showNotification('Biometric authentication failed', 'error');
    }
}

// 2FA authentication simulation
async function twoFactorAuth() {
    if (authLevel < 2) {
        showNotification('Please complete biometric authentication first', 'error');
        return;
    }

    const code = prompt('Enter 6-digit 2FA code (use: 123456)');
    if (code !== '123456') {
        showNotification('Invalid 2FA code', 'error');
        return;
    }

    const button = document.getElementById('twoFactorAuth');
    if (!button) return;
    button.disabled = true;
    button.textContent = '🔐 Verifying...';

    try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        authLevel = 3;
        encryptionKey = generateEncryptionKey();
        button.textContent = '✅ 2FA Active';
        showNotification('Multi-signature authentication complete!', 'success');
        updateAuthStatus();
        loadFromStorage();  // reload elections from localStorage
        updateUI();         // rebuild the elections grid

    } catch (error) {
        button.disabled = false;
        button.textContent = '2FA Verify';
    }
}

// Update authentication status
function updateAuthStatus() {
    const status = document.getElementById('authStatus');
    if (!status) return;
    if (authLevel === 3) {
        status.textContent = '✓ Multi-Auth Verified';
        status.style.background = '#28a745';
    } else if (authLevel === 2) {
        status.textContent = '✓ Bio-Auth Only';
        status.style.background = '#ffc107';
        status.style.color = '#000';
    } else if (authLevel === 1) {
        status.textContent = '⚠ Wallet Only';
        status.style.background = '#dc3545';
    }
}

// Generate encryption key simulation
function generateEncryptionKey() {
    return 'enc_' + Math.random().toString(36).substr(2, 16);
}

// Create election form handler
function createElection(e) {
    e.preventDefault();

    if (authLevel < 3) {
        showNotification('Please complete full authentication (Wallet + Biometric + 2FA) to create elections', 'error');
        return;
    }

    const title = document.getElementById('electionTitle').value;
    const description = document.getElementById('electionDescription').value;
    const candidateInputs = document.querySelectorAll('#candidatesContainer input');

    const candidates = [];
    candidateInputs.forEach(input => {
        if (input.value.trim()) {
            candidates.push({
                name: input.value.trim(),
                votes: 0
            });
        }
    });

    if (candidates.length < 2) {
        showNotification('Please add at least 2 candidates', 'error');
        return;
    }

    // Simulate smart contract deployment
    showNotification('Deploying smart contract...', 'info');

    setTimeout(() => {
        // Create new election with blockchain features
        const election = {
            id: Date.now().toString(),
            title: title,
            description: description,
            candidates: candidates,
            creator: currentAccount,
            createdAt: new Date().toLocaleString(),
            totalVotes: 0,
            contractAddress: '0x' + Math.random().toString(16).substr(2, 40),
            blockHash: '0x' + Math.random().toString(16).substr(2, 64),
            encrypted: true,
            multiSigRequired: true
        };

        elections.push(election);
        saveToStorage();
        updateUI();
        updateStats();

        // Reset form
        document.getElementById('createElectionForm').reset();
        resetCandidateInputs();

        showNotification('Smart contract deployed! Election created successfully.', 'success');
    }, 2000);
}

// Add candidate input
function addCandidate() {
    const container = document.getElementById('candidatesContainer');
    const div = document.createElement('div');
    div.className = 'candidate-input';
    div.innerHTML = `
        <input type="text" placeholder="Candidate Name" required>
        <button type="button" class="remove-btn" onclick="removeCandidate(this)">Remove</button>
    `;
    container.appendChild(div);
}

// Remove candidate input
function removeCandidate(button) {
    const container = document.getElementById('candidatesContainer');
    if (container.children.length > 2) {
        button.parentElement.remove();
    } else {
        showNotification('At least 2 candidates are required', 'error');
    }
}

// Reset candidate inputs
function resetCandidateInputs() {
    const container = document.getElementById('candidatesContainer');
    container.innerHTML = `
        <div class="candidate-input">
            <input type="text" placeholder="Candidate Name" required>
            <button type="button" class="remove-btn" onclick="removeCandidate(this)">Remove</button>
        </div>
        <div class="candidate-input">
            <input type="text" placeholder="Candidate Name" required>
            <button type="button" class="remove-btn" onclick="removeCandidate(this)">Remove</button>
        </div>
    `;
}

// Vote for candidate with enhanced security
function vote(electionId, candidateIndex) {
    if (authLevel < 3) {
        showNotification('Please complete full authentication to vote', 'error');
        return;
    }

    const voteKey = `${electionId}-${currentAccount}`;
    if (votes[voteKey]) {
        showNotification('You have already voted in this election', 'error');
        return;
    }

    // Find the election
    const election = elections.find(e => e.id === electionId);
    if (!election) return;

    // Show voting process simulation
    showNotification('Encrypting vote...', 'info');

    setTimeout(() => {
        showNotification('Broadcasting to blockchain...', 'info');

        setTimeout(() => {
            // Record the encrypted vote
            election.candidates[candidateIndex].votes++;
            election.totalVotes++;

            // Store encrypted vote with additional metadata
            votes[voteKey] = {
                candidateIndex: candidateIndex,
                timestamp: new Date().toISOString(),
                blockHash: '0x' + Math.random().toString(16).substr(2, 64),
                encrypted: true,
                gasUsed: Math.floor(Math.random() * 50000) + 21000
            };

            saveToStorage();
            updateUI();
            updateStats();

            // update chart for this election immediately
            createOrUpdateChart(election);

            // Blockchain back online
            updateBlockchainStatus('online');

            // Generate mock transaction hash
            const txHash = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(20)), b => b.toString(16).padStart(2, '0')).join('');

            // Fill modal data
            document.getElementById('receiptElection').textContent = election.title;
            document.getElementById('receiptCandidate').textContent = election.candidates[candidateIndex].name;
            document.getElementById('receiptDate').textContent = new Date().toLocaleString();
            document.getElementById('receiptTxHash').textContent = txHash;

            // Show modal
            document.getElementById('receiptModal').classList.remove('hidden');

            // Handle download PDF
            document.getElementById('downloadReceipt').onclick = () => {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                doc.setFontSize(16);
                doc.text("Vote Confirmation Receipt", 20, 20);
                doc.setFontSize(12);
                doc.text(`Election: ${election.title}`, 20, 35);
                doc.text(`Voted For: ${election.candidates[candidateIndex].name}`, 20, 45);
                doc.text(`Date: ${new Date().toLocaleString()}`, 20, 55);
                doc.text(`Transaction Hash: ${txHash}`, 20, 65);
                doc.save(`vote_receipt_${Date.now()}.pdf`);
            };

            // Close modal
            document.getElementById('closeReceipt').onclick = () => {
                document.getElementById('receiptModal').classList.add('hidden');
            };

            // Final notification
            showNotification(`Vote encrypted and recorded on blockchain for ${election.candidates[candidateIndex].name}!`, 'success');
        }, 1000);
    }, 500);
}

// Update UI with enhanced blockchain features + chart canvas injection
function updateUI() {
    const container = document.getElementById('electionsContainer');

    if (elections.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No smart contracts deployed yet. Create the first election above!</p>';
        return;
    }

    container.innerHTML = elections.map(election => {
        const userVote = votes[`${election.id}-${currentAccount}`];
        const hasVoted = userVote !== undefined;

        return `
            <div class="election-card" data-election-id="${election.id}">
                <div class="election-title">${escapeHtml(election.title)}</div>
                <div class="election-description">${escapeHtml(election.description)}</div>
                
                <div style="background: #f0f8ff; padding: 10px; border-radius: 5px; margin: 15px 0; font-size: 0.85em;">
                    <strong>🔗 Smart Contract:</strong> ${election.contractAddress ? election.contractAddress.substr(0, 10) + '...' + election.contractAddress.substr(-6) : 'Deploying...'}
                    <br><strong>🔐 Security:</strong> Multi-Sig Required • End-to-End Encrypted
                </div>
                
                <div class="candidates-list">
                    ${election.candidates.map((candidate, index) => `
                        <div class="candidate-item">
                            <div class="candidate-name">
                                ${escapeHtml(candidate.name)}
                                ${userVote && userVote.candidateIndex === index ? ' ✅' : ''}
                            </div>
                            <div>
                                <span class="vote-count">${candidate.votes} votes</span>
                                <button class="vote-btn" 
                                        onclick="vote('${election.id}', ${index})"
                                        ${hasVoted || authLevel < 3 ? 'disabled' : ''}>
                                    ${hasVoted ? '🔒 Voted' : authLevel < 3 ? '🔐 Auth Required' : '🗳️ Vote'}
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Live chart for this election -->
                <div style="margin-top: 12px;">
                    <canvas id="chart-${election.id}" height="120"></canvas>
                </div>
                
                <div class="election-status">
                    <div>
                        <span class="total-votes">Total Votes: ${election.totalVotes}</span>
                        ${hasVoted ? `<br><small style="color: #28a745;">Block: ${userVote.blockHash ? userVote.blockHash.substr(0, 10) + '...' : 'Mining...'}</small>` : ''}
                    </div>
                    <span style="font-size: 0.9em; color: #666;">Created: ${election.createdAt}</span>
                </div>
            </div>
        `;
    }).join('');

    // After DOM is updated, create or update charts for each election
    elections.forEach(e => createOrUpdateChart(e));
}

// Create or update a Chart.js bar chart for an election
function createOrUpdateChart(election) {
    try {
        const canvasId = `chart-${election.id}`;
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // Prepare labels and data
        const labels = election.candidates.map(c => c.name);
        const data = election.candidates.map(c => c.votes);

        // If chart already exists, update data and return
        if (charts[election.id]) {
            const chart = charts[election.id];
            chart.data.labels = labels;
            chart.data.datasets[0].data = data;
            chart.update();
            return;
        }

        // Create a new chart
        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Votes',
                    data: data,
                    // let Chart.js choose default colors
                    backgroundColor: labels.map(() => undefined),
                    borderRadius: 8,
                    barThickness: 'flex'
                }]
            },
            options: {
                animation: { duration: 400 },
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: { maxRotation: 30, minRotation: 0 },
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true,
                        precision: 0,
                        ticks: { stepSize: 1 }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { mode: 'index', intersect: false }
                }
            }
        });

        charts[election.id] = chart;
    } catch (err) {
        console.error('Chart error', err);
    }
}

// Update stats
function updateStats() {
    const totalElections = elections.length;
    const totalVotes = elections.reduce((sum, election) => sum + election.totalVotes, 0);
    const activeElections = elections.length; // All elections are considered active in this demo

    document.getElementById('totalElections').textContent = totalElections;
    document.getElementById('totalVotes').textContent = totalVotes;
    document.getElementById('activeElections').textContent = activeElections;
}

function updateBlockchainStatus(status) {
    const statusEl = document.getElementById('blockchainStatus');
    if (!statusEl) return;

    statusEl.classList.remove('online', 'offline', 'processing');

    if (status === 'online') {
        statusEl.textContent = '🟢 Online';
        statusEl.classList.add('online');
    } else if (status === 'processing') {
        statusEl.textContent = '🟡 Processing...';
        statusEl.classList.add('processing');
    } else {
        statusEl.textContent = '🔴 Offline';
        statusEl.classList.add('offline');
    }
}



// Notification system
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Local storage functions
function saveToStorage() {
    localStorage.setItem('decentralvote_elections', JSON.stringify(elections));
    localStorage.setItem('decentralvote_votes', JSON.stringify(votes));
}

function loadFromStorage() {
    try {
        const storedElections = localStorage.getItem('decentralvote_elections');
        const storedVotes = localStorage.getItem('decentralvote_votes');

        if (storedElections) {
            elections = JSON.parse(storedElections);
        }
        if (storedVotes) {
            votes = JSON.parse(storedVotes);
        }
    } catch (error) {
        console.error('Error loading from storage:', error);
    }
}

// Demo data for testing
function loadDemoData() {
    elections = [
        {
            id: '1',
            title: 'University Student Council President',
            description: 'Choose the next president of the student council for the 2025-2026 academic year.',
            candidates: [
                { name: 'Alex Johnson', votes: 45 },
                { name: 'Sarah Chen', votes: 38 },
                { name: 'Michael Rodriguez', votes: 29 }
            ],
            creator: '0x1234...5678',
            createdAt: '2025-08-10, 10:30 AM',
            totalVotes: 112,
            contractAddress: '0x' + Math.random().toString(16).substr(2, 40),
            blockHash: '0x' + Math.random().toString(16).substr(2, 64),
            encrypted: true,
            multiSigRequired: true
        },
        {
            id: '2',
            title: 'Best Pizza Topping',
            description: 'Help us decide what pizza to order for the office party!',
            candidates: [
                { name: 'Pepperoni', votes: 23 },
                { name: 'Margherita', votes: 18 },
                { name: 'Hawaiian', votes: 12 },
                { name: 'Veggie Supreme', votes: 15 }
            ],
            creator: '0xabcd...efgh',
            createdAt: '2025-08-10, 2:15 PM',
            totalVotes: 68,
            contractAddress: '0x' + Math.random().toString(16).substr(2, 40),
            blockHash: '0x' + Math.random().toString(16).substr(2, 64),
            encrypted: true,
            multiSigRequired: true
        }
    ];
    saveToStorage();
    updateUI();
    updateStats();
    showNotification('Demo data loaded!', 'info');
}

// Add demo data button (for testing)
setTimeout(() => {
    if (elections.length === 0) {
        const demoBtn = document.createElement('button');
        demoBtn.textContent = '🎲 Load Demo Data';
        demoBtn.className = 'connect-btn';
        demoBtn.style.marginLeft = '10px';
        demoBtn.onclick = loadDemoData;
        const walletSection = document.querySelector('.wallet-section');
        if (walletSection) walletSection.appendChild(demoBtn);
    }
}, 2000);

// small helper to escape HTML when injecting user-entered strings
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"'`=\/]/g, function (s) {
        return ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        })[s];
    });
}
