let state = {
    matches: null,
    standings: null,
    arsenalMatches: null
};

document.addEventListener("DOMContentLoaded", () => {
    // Initial fetch
    refreshData().then(() => {
        setupEventListeners();
        setInterval(refreshData, 60000); // Auto-refresh every minute
    });
});

async function refreshData() {
    try {
        const [scheduleRes, standingsRes, arsenalScheduleRes] = await Promise.all([
            fetch("/epl/api/schedule"),
            fetch("/epl/api/standings"),
            fetch("/epl/api/arsenal/schedule")
        ]);

        if (scheduleRes.ok) {
            const scheduleData = await scheduleRes.json();
            state.matches = scheduleData.matches || [];
            renderSchedule();
        }

        if (standingsRes.ok) {
            const standingsData = await standingsRes.json();
            state.standings = standingsData.standings || [];
            renderStandings();
        }

        if (arsenalScheduleRes.ok) {
            const arsenalScheduleData = await arsenalScheduleRes.json();
            state.arsenalMatches = arsenalScheduleData.matches || [];
            renderArsenalSchedule();
        }
        
        return true;
    } catch (e) {
        console.error("Lỗi lấy dữ liệu từ ESPN API:", e);
        showToast("Lỗi kết nối máy chủ", "error");
        return false;
    }
}

function setupEventListeners() {
    // Manual Refresh button
    const refreshBtn = document.getElementById("btn-refresh");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", async () => {
            refreshBtn.disabled = true;
            refreshBtn.querySelector("i").className = "fa-solid fa-spinner fa-spin text-purple";
            const success = await refreshData();
            if (success) {
                showToast("Đã cập nhật dữ liệu mới nhất!", "success");
            }
            refreshBtn.disabled = false;
            refreshBtn.querySelector("i").className = "fa-solid fa-rotate text-purple";
        });
    }

    // Bottom Navigation Tabs
    const navItems = document.querySelectorAll(".bottom-nav .nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const targetTab = item.dataset.tab;
            if (!targetTab) return;
            
            document.querySelectorAll(".tab-content").forEach(content => {
                content.classList.add("hidden");
            });
            
            const activeContent = document.getElementById(targetTab);
            if (activeContent) {
                activeContent.classList.remove("hidden");
            }
            
            navItems.forEach(btn => btn.classList.remove("active"));
            item.classList.add("active");
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;
    
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        background: rgba(20, 13, 33, 0.95);
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 10px 16px;
        border-radius: 12px;
        font-size: 0.75rem;
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        transition: all 0.3s ease;
    `;
    
    let icon = '<i class="fa-solid fa-circle-check" style="color:var(--green)"></i>';
    if (type === "error") {
        icon = '<i class="fa-solid fa-triangle-exclamation" style="color:var(--red)"></i>';
    }
    
    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px)";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function renderSchedule() {
    const container = document.getElementById("schedule-container");
    if (!container) return;

    if (!state.matches || state.matches.length === 0) {
        container.innerHTML = `<div class="loading-state">Không có trận đấu nào diễn ra lúc này.</div>`;
        return;
    }

    // Group matches by kickoff date (YYYY-MM-DD)
    const groups = {};
    state.matches.forEach(m => {
        const dateObj = new Date(m.kickoff);
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        const dayOfWeekNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
        const dayOfWeek = dayOfWeekNames[dateObj.getDay()];
        
        const dateStr = `${dayOfWeek}, ngày ${day}/${month}/${year}`;
        if (!groups[dateStr]) {
            groups[dateStr] = [];
        }
        groups[dateStr].push(m);
    });

    let html = "";
    for (const [dateStr, matches] of Object.entries(groups)) {
        html += `
            <div class="date-group-header" style="margin: 20px 0 10px 4px; font-size: 0.85rem; font-weight: 800; text-transform: uppercase; color: var(--green); letter-spacing: 0.05em; display: flex; align-items: center; gap: 8px;">
                <i class="fa-regular fa-calendar-days" style="color:var(--green)"></i> ${dateStr}
            </div>
        `;
        matches.forEach(m => {
            let statusBadge = "";
            if (m.finished) {
                statusBadge = `<span class="badge badge-muted">Kết thúc</span>`;
            } else if (m.status_name === "STATUS_IN_PROGRESS" || m.status_name === "STATUS_HALFTIME") {
                statusBadge = `<span class="badge badge-danger animate-pulse"><i class="fa-solid fa-play"></i> ${m.display_clock}</span>`;
            } else {
                const dateObj = new Date(m.kickoff);
                const hours = String(dateObj.getHours()).padStart(2, '0');
                const minutes = String(dateObj.getMinutes()).padStart(2, '0');
                statusBadge = `<span class="badge badge-green">${hours}:${minutes}</span>`;
            }

            html += `
                <div class="match-card glass-card animate-fade-in">
                    <div class="match-body">
                        <div class="team-section home">
                            <span class="team-name">${m.teamA}</span>
                            <img class="team-logo" src="${m.teamA_logo || '/static/img/logo.png'}" alt="${m.teamA}">
                        </div>
                        <div class="score-section">
                            <div class="match-status-center">
                                ${statusBadge}
                            </div>
                            <div class="score-display">
                                ${m.finished || m.status_name.includes("PROGRESS") || m.status_name.includes("HALFTIME") ? `
                                    <span class="score-number">${m.scoreA}</span>
                                    <span class="score-separator">-</span>
                                    <span class="score-number">${m.scoreB}</span>
                                ` : `
                                    <span class="score-pending" style="color:var(--text-muted); font-size:1.1rem; letter-spacing:2px;">- - -</span>
                                `}
                            </div>
                        </div>
                        <div class="team-section away">
                            <img class="team-logo" src="${m.teamB_logo || '/static/img/logo.png'}" alt="${m.teamB}">
                            <span class="team-name">${m.teamB}</span>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    container.innerHTML = html;
}

function renderStandings() {
    const tbody = document.getElementById("standings-tbody");
    if (!tbody) return;

    if (!state.standings || state.standings.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="loading-td">Không tìm thấy dữ liệu bảng xếp hạng.</td></tr>`;
        return;
    }

    let html = "";
    state.standings.forEach(s => {
        html += `
            <tr>
                <td class="col-rank">${s.rank}</td>
                <td class="col-team">
                    <div class="team-cell">
                        <img class="team-cell-logo" src="${s.logo || '/static/img/logo.png'}" alt="${s.team}">
                        <span class="team-cell-name">${s.team}</span>
                    </div>
                </td>
                <td class="col-stat">${s.played}</td>
                <td class="col-stat">${s.won}</td>
                <td class="col-stat">${s.drawn}</td>
                <td class="col-stat">${s.lost}</td>
                <td class="col-stat hidable">${s.gf}</td>
                <td class="col-stat hidable">${s.ga}</td>
                <td class="col-stat">${s.gd > 0 ? '+' + s.gd : s.gd}</td>
                <td class="col-pts">${s.points}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
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

function renderArsenalSchedule() {
    const container = document.getElementById("arsenal-matches");
    if (!container) return;

    if (!state.arsenalMatches || state.arsenalMatches.length === 0) {
        container.innerHTML = `<div class="loading-state">Không tìm thấy lịch thi đấu nào cho Arsenal.</div>`;
        return;
    }

    const groups = {};
    state.arsenalMatches.forEach(m => {
        const dateObj = new Date(m.kickoff);
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        const dayOfWeekNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
        const dayOfWeek = dayOfWeekNames[dateObj.getDay()];
        
        const dateStr = `${dayOfWeek}, ngày ${day}/${month}/${year}`;
        if (!groups[dateStr]) {
            groups[dateStr] = [];
        }
        groups[dateStr].push(m);
    });

    let html = "";
    for (const [dateStr, matches] of Object.entries(groups)) {
        html += `
            <div class="date-group-header" style="margin: 20px 0 10px 4px; font-size: 0.85rem; font-weight: 800; text-transform: uppercase; color: #ef0107; letter-spacing: 0.05em; display: flex; align-items: center; gap: 8px;">
                <i class="fa-regular fa-calendar-days" style="color:#ef0107"></i> ${dateStr}
            </div>
        `;
        matches.forEach(m => {
            let statusBadge = "";
            if (m.finished) {
                statusBadge = `<span class="badge badge-muted">Kết thúc</span>`;
            } else if (m.status_name === "STATUS_IN_PROGRESS" || m.status_name === "STATUS_HALFTIME") {
                statusBadge = `<span class="badge badge-danger animate-pulse"><i class="fa-solid fa-play"></i> ${m.display_clock}</span>`;
            } else {
                const dateObj = new Date(m.kickoff);
                const hours = String(dateObj.getHours()).padStart(2, '0');
                const minutes = String(dateObj.getMinutes()).padStart(2, '0');
                statusBadge = `<span class="badge badge-green" style="background-color:rgba(239,1,7,0.15); color:#ef0107; border:1px solid rgba(239,1,7,0.2);">${hours}:${minutes}</span>`;
            }

            html += `
                <div class="match-card glass-card animate-fade-in" style="border-left: 3px solid #ef0107;">
                    <div class="match-body">
                        <div class="team-section home">
                            <span class="team-name" style="${m.teamA.includes('Arsenal') ? 'color:#ef0107;' : ''}">${m.teamA}</span>
                            <img class="team-logo" src="${m.teamA_logo || '/static/img/logo.png'}" alt="${m.teamA}">
                        </div>
                        <div class="score-section">
                            <div class="match-status-center">
                                ${statusBadge}
                            </div>
                            <div class="score-display">
                                ${m.finished || m.status_name.includes("PROGRESS") || m.status_name.includes("HALFTIME") ? `
                                    <span class="score-number">${m.scoreA}</span>
                                    <span class="score-separator">-</span>
                                    <span class="score-number">${m.scoreB}</span>
                                ` : `
                                    <span class="score-pending" style="color:var(--text-muted); font-size:1.1rem; letter-spacing:2px;">- - -</span>
                                `}
                            </div>
                        </div>
                        <div class="team-section away">
                            <img class="team-logo" src="${m.teamB_logo || '/static/img/logo.png'}" alt="${m.teamB}">
                            <span class="team-name" style="${m.teamB.includes('Arsenal') ? 'color:#ef0107;' : ''}">${m.teamB}</span>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    container.innerHTML = html;
}


