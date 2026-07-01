import os
import requests
from flask import jsonify, render_template
from . import wc2026_bp

STAGE_NAMES = {
    "group-stage": "Vòng bảng",
    "round-of-32": "Vòng 32",
    "round-of-16": "Vòng 1/16",
    "quarterfinals": "Tứ Kết",
    "semifinals": "Bán Kết",
    "3rd-place-match": "Tranh Hạng 3",
    "final": "Chung Kết"
}

@wc2026_bp.route('/')
def index():
    return render_template("wc2026/index.html")

@wc2026_bp.route('/api/data', methods=['GET'])
def api_get_data():
    """
    Fetches live scores directly from ESPN's scoreboard API,
    parses them into the schema expected by the frontend.
    """
    url = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=150"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            return jsonify({"matches": [], "error": f"ESPN returned status code {response.status_code}"})
        data = response.json()
    except Exception as e:
        return jsonify({"matches": [], "error": f"Network error calling ESPN: {str(e)}"})

    events = data.get("events", [])
    matches = []

    for event in events:
        espn_id = event.get("id")
        if not espn_id:
            continue

        comp = event.get("competitions", [{}])[0]
        competitors = comp.get("competitors", [])
        if len(competitors) < 2:
            continue

        # Home vs Away
        home_comp = next((c for c in competitors if c.get("homeAway") == "home"), competitors[0])
        away_comp = next((c for c in competitors if c.get("homeAway") == "away"), competitors[1])

        teamA_name = home_comp.get("team", {}).get("displayName", "Home Team")
        teamA_logo = home_comp.get("team", {}).get("logo", "")
        teamA_score = int(home_comp.get("score", 0))

        teamB_name = away_comp.get("team", {}).get("displayName", "Away Team")
        teamB_logo = away_comp.get("team", {}).get("logo", "")
        teamB_score = int(away_comp.get("score", 0))

        kickoff = event.get("date", "")
        status_desc = event.get("status", {}).get("type", {})
        status_name = status_desc.get("name", "")
        completed = status_desc.get("completed", False) or status_name == "STATUS_FINAL"

        stage_slug = event.get("season", {}).get("slug", "group-stage")
        shootoutA = None
        shootoutB = None
        if "shootoutScore" in home_comp and home_comp["shootoutScore"] is not None:
            try:
                shootoutA = int(home_comp["shootoutScore"])
            except ValueError:
                pass
        if "shootoutScore" in away_comp and away_comp["shootoutScore"] is not None:
            try:
                shootoutB = int(away_comp["shootoutScore"])
            except ValueError:
                pass

        match_data = {
            "id": f"m_{espn_id}",
            "espn_id": espn_id,
            "teamA": teamA_name,
            "teamA_logo": teamA_logo,
            "teamB": teamB_name,
            "teamB_logo": teamB_logo,
            "scoreA": teamA_score,
            "scoreB": teamB_score,
            "finished": completed,
            "kickoff": kickoff,
            "stage": stage_slug,
            "stage_vn": STAGE_NAMES.get(stage_slug, "Vòng bảng"),
            "locked": True
        }
        if shootoutA is not None:
            match_data["shootoutA"] = shootoutA
        if shootoutB is not None:
            match_data["shootoutB"] = shootoutB

        matches.append(match_data)

    # Sort matches by kickoff time
    matches.sort(key=lambda m: m.get("kickoff", ""))

    return jsonify({
        "matches": matches,
        "players": [],
        "leaderboard": [],
        "predictions": [],
        "total_fund": 0,
        "current_time": "",
        "needs_pin_change": False
    })
