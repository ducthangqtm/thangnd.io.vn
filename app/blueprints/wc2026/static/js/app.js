// --- GLOBAL APP STATE ---
let state = {
    data: null, // full API payload
    countdownInterval: null
};

// --- INIT APP ---
document.addEventListener("DOMContentLoaded", () => {
    // Load initial data
    refreshData().then(() => {
        setupEventListeners();
        startCountdownTimer();
        
        // Poll for updates every 60 seconds
        setInterval(refreshData, 60000);
    });
});

// --- API FETCH HELPERS ---
async function refreshData() {
    try {
        const response = await fetch("/wc2026/api/data");
        if (!response.ok) {
            throw new Error("Cannot fetch data");
        }
        const newData = await response.json();
        
        // Only redraw if data changed
        if (state.data && JSON.stringify(state.data.matches) === JSON.stringify(newData.matches)) {
            return true;
        }
        
        state.data = newData;
        
        // Render UI
        renderStandings();
        renderBracket();
        renderSchedule();
        
        return true;
    } catch (e) {
        console.error("Error refreshing data:", e);
        showToast("Lỗi kết nối máy chủ", "error");
        return false;
    }
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    // Manual Refresh button
    const refreshBtn = document.getElementById("btn-refresh");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", async () => {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-cyan"></i>';
            const success = await refreshData();
            if (success) {
                showToast("Đã cập nhật dữ liệu mới nhất!", "success");
            }
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<i class="fa-solid fa-rotate text-cyan"></i>';
        });
    }

    // Bottom Navigation Tabs
    const navItems = document.querySelectorAll(".bottom-nav .nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const targetTab = item.dataset.tab;
            if (!targetTab) return;
            
            // Hide all tab contents
            document.querySelectorAll(".tab-content").forEach(content => {
                content.classList.add("hidden");
            });
            
            // Show target tab content
            const activeContent = document.getElementById(targetTab);
            if (activeContent) {
                activeContent.classList.remove("hidden");
            }
            
            // Toggle active classes on nav buttons
            navItems.forEach(btn => btn.classList.remove("active"));
            item.classList.add("active");
            
            // Scroll to top of window when switching tabs
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // Schedule Sub-Tabs
    const scheduleSubtabs = document.querySelectorAll(".schedule-subtab");
    scheduleSubtabs.forEach(btn => {
        btn.addEventListener("click", () => {
            const target = btn.dataset.subtab;
            document.querySelectorAll(".schedule-subcontent").forEach(c => c.classList.add("hidden"));
            document.getElementById(target)?.classList.remove("hidden");
            scheduleSubtabs.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
        });
    });
}

// --- TOAST SYSTEM ---
function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;
    
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    let icon = '<i class="fa-solid fa-circle-check"></i>';
    if (type === "error") {
        icon = '<i class="fa-solid fa-triangle-exclamation"></i>';
    }
    
    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(50px)";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// --- TIMER LOOP ---
function startCountdownTimer() {
    if (state.countdownInterval) clearInterval(state.countdownInterval);
    
    state.countdownInterval = setInterval(() => {
        const now = new Date();
        document.querySelectorAll("[data-kickoff]").forEach(el => {
            const kickoffStr = el.dataset.kickoff;
            const kickoffDate = new Date(kickoffStr);
            const timeDiff = kickoffDate.getTime() - now.getTime();
            
            if (timeDiff <= 0) {
                el.className = "badge badge-green";
                el.innerHTML = '<i class="fa-solid fa-play"></i> Đang đá';
                el.removeAttribute("data-kickoff");
            } else {
                const hours = Math.floor(timeDiff / (1000 * 60 * 60));
                const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                
                if (hours < 1) {
                    el.className = "match-countdown badge-danger animate-pulse";
                    el.innerHTML = `<i class="fa-solid fa-clock"></i> ${minutes}p`;
                } else if (hours < 24) {
                    el.className = "match-countdown";
                    el.innerHTML = `<i class="fa-solid fa-clock"></i> ${hours}h ${minutes}p`;
                } else {
                    const days = Math.floor(hours / 24);
                    const remHours = hours % 24;
                    el.className = "match-countdown text-muted";
                    el.innerHTML = `<i class="fa-solid fa-clock"></i> ${days}d ${remHours}h`;
                }
            }
        });
    }, 10000);
}

function formatKickoffTime(isoStr) {
    try {
        const date = new Date(isoStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        const dayOfWeekNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
        const dayOfWeek = dayOfWeekNames[date.getDay()];
        
        return `${hours}:${minutes} - ${dayOfWeek}, ${day}/${month}`;
    } catch (e) {
        return isoStr;
    }
}

// --- TRANSLATE COUNTRY NAMES TO VIETNAMESE ---
const TRANSLATED_NAMES = {
    "South Africa": "Nam Phi",
    "Canada": "Canada",
    "Morocco": "Ma-rốc",
    "Brazil": "Brazil",
    "Japan": "Nhật Bản",
    "Germany": "Đức",
    "Paraguay": "Paraguay",
    "France": "Pháp",
    "Argentina": "Argentina",
    "Mexico": "Mexico",
    "United States": "Mỹ", "USA": "Mỹ",
    "England": "Anh",
    "Portugal": "Bồ Đào Nha",
    "Spain": "Tây Ban Nha",
    "Belgium": "Bỉ",
    "Netherlands": "Hà Lan",
    "Croatia": "Croatia",
    "South Korea": "Hàn Quốc",
    "Senegal": "Senegal",
    "Poland": "Ba Lan",
    "Switzerland": "Thụy Sĩ",
    "Uruguay": "Uruguay",
    "Ecuador": "Ecuador",
    "Qatar": "Qatar",
    "Iran": "Iran",
    "Wales": "Wales",
    "Australia": "Úc",
    "Denmark": "Đan Mạch",
    "Tunisia": "Tunisia",
    "Saudi Arabia": "Ả Rập Xê Út",
    "Costa Rica": "Costa Rica",
    "Cameroon": "Cameroon",
    "Serbia": "Serbia",
    "Ghana": "Ghana",
    "Ivory Coast": "Bờ Biển Ngà",
    "Norway": "Na Uy",
    "Sweden": "Thụy Điển",
    "Congo DR": "CHDC Congo", "Congo": "Congo",
    "Bosnia-Herzegovina": "Bosnia & Herz.",
    "Austria": "Áo",
    "Algeria": "Algeria",
    "Egypt": "Ai Cập",
    "Cape Verde": "Cape Verde",
    "Colombia": "Colombia",
    "Czechia": "Cộng hòa Séc",
    "Haiti": "Haiti",
    "Scotland": "Scotland",
    "Turkey": "Thổ Nhĩ Kỳ"
};

function translateTeamName(name) {
    if (!name) return "None";
    const nameLower = name.trim().toLowerCase();
    if (nameLower.includes("winner") || nameLower.includes("runner") || nameLower.includes("place") || nameLower.includes("tbd") || nameLower.includes("match") || nameLower.includes("loser")) {
        return "None";
    }
    return TRANSLATED_NAMES[name] || name;
}


// --- RENDER SYMMETRICAL KNOCKOUT BRACKET ---
function renderBracket() {
    if (!state.data || !state.data.matches) return;
    const treeWrapper = document.getElementById("bracket-tree-wrapper");
    if (!treeWrapper) return;
    
    let treeInner = document.getElementById("bracket-tree-inner");
    if (!treeInner) {
        treeInner = document.createElement("div");
        treeInner.id = "bracket-tree-inner";
        treeInner.className = "bracket-tree-inner";
        treeWrapper.innerHTML = "";
        treeWrapper.appendChild(treeInner);
    } else {
        treeInner.innerHTML = "";
    }
    
    const matches = state.data.matches;
    
    // Map matches to their IDs for easy lookup
    const matchesMap = {};
    matches.forEach(m => {
        if (m && m.id) {
            matchesMap[m.id] = m;
        }
    });

    // Helper to resolve ordered match IDs to actual match objects
    const resolveMatches = (ids) => ids.map(id => matchesMap[id]).filter(Boolean);

    // Symmetrical Columns config based on bracket connection trees
    const leftCols = [
        { name: "Vòng 32 (Trái)", matches: resolveMatches(["m_760489", "m_760492", "m_760486", "m_760488", "m_760496", "m_760497", "m_760494", "m_760493"]) },
        { name: "Vòng 16 (Trái)", matches: resolveMatches(["m_760503", "m_760502", "m_760506", "m_760507"]) },
        { name: "Tứ Kết (Trái)", matches: resolveMatches(["m_760510", "m_760511"]) },
        { name: "Bán Kết (Trái)", matches: resolveMatches(["m_760514"]) }
    ];

    const centerCol = { name: "Chung Kết", matches: resolveMatches(["m_760517", "m_760516"]) };

    const rightCols = [
        { name: "Bán Kết (Phải)", matches: resolveMatches(["m_760515"]) },
        { name: "Tứ Kết (Phải)", matches: resolveMatches(["m_760512", "m_760513"]) },
        { name: "Vòng 16 (Phải)", matches: resolveMatches(["m_760504", "m_760505", "m_760509", "m_760508"]) },
        { name: "Vòng 32 (Phải)", matches: resolveMatches(["m_760487", "m_760490", "m_760491", "m_760495", "m_760500", "m_760499", "m_760498", "m_760501"]) }
    ];

    // Helper to generate HTML for a match card
    function createMatchCardHtml(m) {
        const isFinished = m.finished;
        let scoreA = isFinished ? m.scoreA : "";
        let scoreB = isFinished ? m.scoreB : "";
        
        if (isFinished && m.shootoutA !== undefined && m.shootoutB !== undefined) {
            scoreA += ` (${m.shootoutA})`;
            scoreB += ` (${m.shootoutB})`;
        }
        
        const isWinnerA = isFinished && (m.scoreA > m.scoreB || (m.scoreA === m.scoreB && m.shootoutA !== undefined && m.shootoutA > m.shootoutB));
        const isWinnerB = isFinished && (m.scoreB > m.scoreA || (m.scoreA === m.scoreB && m.shootoutB !== undefined && m.shootoutB > m.shootoutA));
        
        let logoA = m.teamA_logo;
        let logoB = m.teamB_logo;
        
        if (!logoA || logoA === "") {
            const foundMatch = matches.find(gm => (gm.teamA === m.teamA && gm.teamA_logo) || (gm.teamB === m.teamA && gm.teamB_logo));
            if (foundMatch) {
                logoA = foundMatch.teamA === m.teamA ? foundMatch.teamA_logo : foundMatch.teamB_logo;
            }
        }
        if (!logoB || logoB === "") {
            const foundMatch = matches.find(gm => (gm.teamA === m.teamB && gm.teamA_logo) || (gm.teamB === m.teamB && gm.teamB_logo));
            if (foundMatch) {
                logoB = foundMatch.teamA === m.teamB ? foundMatch.teamA_logo : foundMatch.teamB_logo;
            }
        }

        const displayNameA = translateTeamName(m.teamA);
        const displayNameB = translateTeamName(m.teamB);
        const isPlaceholderA = displayNameA === "None";
        const isPlaceholderB = displayNameB === "None";

        let timeStr = "--:--";
        let dateStr = "--/--";
        if (m.kickoff) {
            try {
                const date = new Date(m.kickoff);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                timeStr = `${hours}:${minutes}`;
                dateStr = `${day}/${month}`;
            } catch (e) {
                // Keep default placeholders
            }
        }

        return `
            <div class="bracket-match-card">
                <div class="bracket-team-row-h ${isWinnerA ? 'winner' : ''}">
                    <div class="bracket-flag-name-h">
                        <img src="${logoA}" onerror="this.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'" class="bracket-flag-s" alt="${m.teamA}">
                        <span class="bracket-name-s ${isPlaceholderA ? 'placeholder-slot' : ''}" title="${m.teamA}">${displayNameA}</span>
                    </div>
                    <div class="bracket-score-s">${scoreA}</div>
                </div>
                <div class="bracket-team-row-h ${isWinnerB ? 'winner' : ''}">
                    <div class="bracket-flag-name-h">
                        <img src="${logoB}" onerror="this.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'" class="bracket-flag-s" alt="${m.teamB}">
                        <span class="bracket-name-s ${isPlaceholderB ? 'placeholder-slot' : ''}" title="${m.teamB}">${displayNameB}</span>
                    </div>
                    <div class="bracket-score-s">${scoreB}</div>
                </div>
            </div>
        `;
    }

    // Render Left Columns
    leftCols.forEach(col => {
        const column = document.createElement("div");
        column.className = "bracket-column animate-fade-in";
        
        col.matches.forEach(m => {
            const temp = document.createElement("div");
            temp.innerHTML = createMatchCardHtml(m);
            column.appendChild(temp.firstElementChild);
        });
        treeInner.appendChild(column);
    });

    // Render Center Column (Finals + Trophy)
    const centerColumn = document.createElement("div");
    centerColumn.className = "bracket-column center-column animate-fade-in";

    // Add Trophy placeholder
    const trophy = document.createElement("div");
    trophy.className = "trophy-wrapper";
    trophy.innerHTML = `
        <i class="fa-solid fa-trophy"></i>
        <div class="winner-label">FIFA World Cup 2026</div>
    `;
    centerColumn.appendChild(trophy);

    centerCol.matches.forEach(m => {
        const temp = document.createElement("div");
        temp.innerHTML = createMatchCardHtml(m);
        centerColumn.appendChild(temp.firstElementChild);
    });
    treeInner.appendChild(centerColumn);

    // Render Right Columns
    rightCols.forEach(col => {
        const column = document.createElement("div");
        column.className = "bracket-column animate-fade-in";
        
        col.matches.forEach(m => {
            const temp = document.createElement("div");
            temp.innerHTML = createMatchCardHtml(m);
            column.appendChild(temp.firstElementChild);
        });
        treeInner.appendChild(column);
    });
}

// --- CALCULATE GROUP STANDINGS ---
function calculateGroupStandings() {
    if (!state.data || !state.data.matches) return [];

    const groupMatches = state.data.matches.filter(m => m.stage === "group-stage");

    // Group teams by connected components
    const adj = {};
    groupMatches.forEach(m => {
        if (!adj[m.teamA]) adj[m.teamA] = new Set();
        if (!adj[m.teamB]) adj[m.teamB] = new Set();
        adj[m.teamA].add(m.teamB);
        adj[m.teamB].add(m.teamA);
    });

    const visited = new Set();
    const groups = [];

    const sortedTeams = Object.keys(adj).sort();
    sortedTeams.forEach(t => {
        if (!visited.has(t)) {
            const groupTeams = [t];
            visited.add(t);
            adj[t].forEach(n => {
                if (!visited.has(n)) {
                    groupTeams.push(n);
                    visited.add(n);
                }
            });
            groups.push(groupTeams);
        }
    });

    function getGroupLetter(teamsList) {
        const representatives = {
            "Mexico": "A",
            "Canada": "B",
            "Brazil": "C",
            "United States": "D", "USA": "D",
            "Germany": "E",
            "Japan": "F",
            "Belgium": "G",
            "Spain": "H",
            "France": "I",
            "Argentina": "J",
            "Portugal": "K",
            "England": "L"
        };
        for (let t of teamsList) {
            if (representatives[t]) {
                return representatives[t];
            }
        }
        return null;
    }

    const standings = groups.map((teams, index) => {
        const groupLetter = getGroupLetter(teams) || String.fromCharCode(65 + index);

        const teamStats = teams.map(teamName => {
            const stats = {
                name: teamName,
                logo: "",
                played: 0,
                won: 0,
                drawn: 0,
                lost: 0,
                gf: 0,
                ga: 0,
                gd: 0,
                pts: 0
            };

            const matchWithLogo = groupMatches.find(m => m.teamA === teamName || m.teamB === teamName);
            if (matchWithLogo) {
                stats.logo = matchWithLogo.teamA === teamName ? matchWithLogo.teamA_logo : matchWithLogo.teamB_logo;
            }

            groupMatches.forEach(m => {
                if (!m.finished) return;
                
                if (m.teamA === teamName) {
                    stats.played++;
                    stats.gf += m.scoreA;
                    stats.ga += m.scoreB;
                    if (m.scoreA > m.scoreB) {
                        stats.won++;
                        stats.pts += 3;
                    } else if (m.scoreA === m.scoreB) {
                        stats.drawn++;
                        stats.pts += 1;
                    } else {
                        stats.lost++;
                    }
                } else if (m.teamB === teamName) {
                    stats.played++;
                    stats.gf += m.scoreB;
                    stats.ga += m.scoreA;
                    if (m.scoreB > m.scoreA) {
                        stats.won++;
                        stats.pts += 3;
                    } else if (m.scoreA === m.scoreB) {
                        stats.drawn++;
                        stats.pts += 1;
                    } else {
                        stats.lost++;
                    }
                }
            });

            stats.gd = stats.gf - stats.ga;
            return stats;
        });

        teamStats.sort((a, b) => {
            if (b.pts !== a.pts) return b.pts - a.pts;
            if (b.gd !== a.gd) return b.gd - a.gd;
            if (b.gf !== a.gf) return b.gf - a.gf;
            return a.name.localeCompare(b.name, 'vi');
        });

        return {
            groupName: `Bảng ${groupLetter}`,
            teams: teamStats
        };
    });

    standings.sort((a, b) => a.groupName.localeCompare(b.groupName));
    return standings;
}

// --- RENDER TEAM STANDINGS ---
function renderStandings() {
    if (!state.data) return;
    
    const container = document.getElementById("standings-container");
    if (!container) return;
    container.innerHTML = "";
    
    const standings = calculateGroupStandings();
    
    standings.forEach(group => {
        const card = document.createElement("div");
        card.className = "card glass-card group-standings-card animate-fade-in";
        
        let teamRowsHtml = "";
        group.teams.forEach((t, idx) => {
            const gdSign = t.gd > 0 ? "+" : "";
            
            let rankHtml = `<span class="rank-badge">${idx + 1}</span>`;
            if (idx === 0) rankHtml = `<span class="rank-badge rank-1"><i class="fa-solid fa-crown"></i></span>`;
            else if (idx === 1) rankHtml = `<span class="rank-badge rank-2">2</span>`;
            else if (idx === 2) rankHtml = `<span class="rank-badge rank-3">3</span>`;
            
            const teamDisplayName = translateTeamName(t.name);
            
            teamRowsHtml += `
                <tr>
                    <td class="text-center">${rankHtml}</td>
                    <td class="team-name-cell">
                        <img src="${t.logo}" onerror="this.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'" class="team-logo-small" alt="${t.name}">
                        <span class="team-display-name">${teamDisplayName}</span>
                    </td>
                    <td class="text-center">${t.played}</td>
                    <td class="text-center">${gdSign}${t.gd}</td>
                    <td class="text-right table-pts-value" style="padding-right: 15px;">${t.pts}</td>
                </tr>
            `;
        });
        
        card.innerHTML = `
            <div class="card-header">
                <h2><i class="fa-solid fa-trophy text-gold"></i> ${group.groupName}</h2>
            </div>
            <div class="card-body no-padding">
                <table class="standings-table">
                    <thead>
                        <tr>
                            <th class="text-center" style="width: 35px;">#</th>
                            <th>Đội tuyển</th>
                            <th class="text-center" style="width: 50px;">Trận</th>
                            <th class="text-center" style="width: 50px;">H.Số</th>
                            <th class="text-right" style="width: 50px; padding-right: 15px;">Điểm</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${teamRowsHtml}
                    </tbody>
                </table>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// --- RENDER SCHEDULE LIST ---
function renderSchedule() {
    if (!state.data || !state.data.matches) return;
    
    // Map teams to group names using current standings
    const standings = calculateGroupStandings();
    const teamToGroupMap = {};
    standings.forEach(g => {
        g.teams.forEach(t => {
            teamToGroupMap[t.name] = g.groupName;
        });
    });
    
    const matches = [...state.data.matches];
    
    // Separate Group Stage and Knockout matches
    const groupMatches = matches.filter(m => m.stage === "group-stage");
    const knockoutMatches = matches.filter(m => m.stage !== "group-stage");
    
    // 1. Group Stage sorting: sort by Group letter/name, then by kickoff date/time
    groupMatches.sort((a, b) => {
        const grA = teamToGroupMap[a.teamA] || "Bảng Z";
        const grB = teamToGroupMap[b.teamA] || "Bảng Z";
        if (grA !== grB) {
            return grA.localeCompare(grB);
        }
        return new Date(a.kickoff) - new Date(b.kickoff);
    });
    
    // 2. Knockout sorting: unfinished first (sorted by kickoff), finished last (sorted by kickoff)
    knockoutMatches.sort((a, b) => {
        if (a.finished !== b.finished) {
            return a.finished ? 1 : -1;
        }
        return new Date(a.kickoff) - new Date(b.kickoff);
    });
    
    // Build HTML content helper
    const createMatchHtml = (m) => {
        const isFinished = m.finished;
        const scoreA = isFinished ? m.scoreA : "-";
        const scoreB = isFinished ? m.scoreB : "-";
        
        let shootoutHtml = "";
        if (isFinished && m.shootoutA !== undefined && m.shootoutB !== undefined) {
            shootoutHtml = `<span class="badge badge-danger" style="font-size: 0.6rem; margin-top: 4px;">Pen: ${m.shootoutA}-${m.shootoutB}</span>`;
        }
        
        const formattedTime = formatKickoffTime(m.kickoff);
        const displayNameA = translateTeamName(m.teamA);
        const displayNameB = translateTeamName(m.teamB);
        
        return `
            <div class="match-card animate-fade-in ${isFinished ? 'match-played' : ''}">
                <div class="match-card-header">
                    <span class="badge badge-purple">${m.stage_vn}</span>
                    <span class="match-time-label">${formattedTime}</span>
                </div>
                <div class="match-vs-container">
                    <div class="match-team team-a">
                        <img src="${m.teamA_logo}" onerror="this.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'" class="match-team-flag">
                        <span class="match-team-name">${displayNameA}</span>
                    </div>
                    <div class="match-score-center">
                        <span class="score-display">
                            <span>${scoreA}</span>
                            <span class="score-divider">:</span>
                            <span>${scoreB}</span>
                        </span>
                        ${shootoutHtml}
                    </div>
                    <div class="match-team team-b">
                        <img src="${m.teamB_logo}" onerror="this.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'" class="match-team-flag">
                        <span class="match-team-name">${displayNameB}</span>
                    </div>
                </div>
            </div>
        `;
    };
    
    // Render Group Stage matches into sub-group container
    const groupContainer = document.getElementById("sub-group");
    const koContainer = document.getElementById("sub-knockout");
    if (groupContainer) groupContainer.innerHTML = "";
    if (koContainer) koContainer.innerHTML = "";

    if (groupContainer && groupMatches.length > 0) {
        let currentGroup = "";
        groupMatches.forEach(m => {
            const grName = teamToGroupMap[m.teamA] || "Chưa xác định";
            if (grName !== currentGroup) {
                currentGroup = grName;
                const subHeader = document.createElement("div");
                subHeader.className = "schedule-group-subheader";
                subHeader.innerHTML = `<h4>${currentGroup}</h4>`;
                groupContainer.appendChild(subHeader);
            }
            const matchEl = document.createElement("div");
            matchEl.innerHTML = createMatchHtml(m);
            groupContainer.appendChild(matchEl.firstElementChild);
        });
    }

    // Render Knockout matches into sub-knockout container
    if (koContainer && knockoutMatches.length > 0) {
        knockoutMatches.forEach(m => {
            const matchEl = document.createElement("div");
            matchEl.innerHTML = createMatchHtml(m);
            koContainer.appendChild(matchEl.firstElementChild);
        });
    }
}
