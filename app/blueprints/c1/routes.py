import os
import requests
from flask import jsonify, render_template, request
from . import c1_bp

@c1_bp.route('/')
def index():
    return render_template("c1/index.html")

from app.utils import get_cached_data

@c1_bp.route('/api/standings', methods=['GET'])
def api_get_standings():
    """
    Fetches the Champions League standings/table from ESPN API.
    """
    def fetch_standings():
        url = "https://site.api.espn.com/apis/v2/sports/soccer/uefa.champions/standings"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code != 200:
                return {"standings": [], "error": f"ESPN returned status code {response.status_code}"}
            data = response.json()
        except Exception as e:
            return {"standings": [], "error": f"Network error calling ESPN: {str(e)}"}

        standings_list = []
        children = data.get("children", [])
        if children:
            for child in children:
                standings_data = child.get("standings", {}).get("entries", [])
                group_name = child.get("name", "")
                
                for entry in standings_data:
                    team_info = entry.get("team", {})
                    stats = entry.get("stats", [])
                    
                    def get_stat(name):
                        for s in stats:
                            if s.get("name") == name:
                                return s.get("value")
                        return 0

                    standings_list.append({
                        "rank": int(get_stat("rank")),
                        "team": team_info.get("displayName", ""),
                        "logo": team_info.get("logos", [{}])[0].get("href", "") if team_info.get("logos") else "",
                        "played": int(get_stat("gamesPlayed")),
                        "won": int(get_stat("wins")),
                        "drawn": int(get_stat("ties")),
                        "lost": int(get_stat("losses")),
                        "gf": int(get_stat("pointsFor")),
                        "ga": int(get_stat("pointsAgainst")),
                        "gd": int(get_stat("pointDifferential")),
                        "points": int(get_stat("points")),
                        "group": group_name
                    })
        return {"standings": standings_list}

    result = get_cached_data("c1_standings", fetch_standings, expiry_seconds=60)
    return jsonify(result)

@c1_bp.route('/api/schedule', methods=['GET'])
def api_get_schedule():
    """
    Fetches the Champions League matches from ESPN API.
    """
    date_param = request.args.get("date", "20260801-20270601")
    limit = request.args.get("limit", "100")
    cache_key = f"c1_schedule_{date_param}_{limit}"

    def fetch_schedule():
        url = f"https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard?limit={limit}"
        if date_param:
            url += f"&dates={date_param}"
            
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code != 200:
                return {"matches": [], "error": f"ESPN returned status code {response.status_code}"}
            data = response.json()
        except Exception as e:
            return {"matches": [], "error": f"Network error calling ESPN: {str(e)}"}

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
            display_clock = event.get("status", {}).get("type", {}).get("detail", "")

            matches.append({
                "id": f"m_{espn_id}",
                "espn_id": espn_id,
                "teamA": teamA_name,
                "teamA_logo": teamA_logo,
                "teamB": teamB_name,
                "teamB_logo": teamB_logo,
                "scoreA": teamA_score,
                "scoreB": teamB_score,
                "finished": completed,
                "status_name": status_name,
                "display_clock": display_clock,
                "kickoff": kickoff
            })

        matches.sort(key=lambda m: m.get("kickoff", ""))
        return {"matches": matches}

    result = get_cached_data(cache_key, fetch_schedule, expiry_seconds=60)
    return jsonify(result)

@c1_bp.route('/api/arsenal/schedule', methods=['GET'])
def api_get_arsenal_schedule():
    """
    Returns only Arsenal matches in Champions League.
    """
    def fetch_arsenal_schedule():
        url = "https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard?dates=20260801-20270601&limit=150"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code != 200:
                return {"matches": [], "error": f"ESPN returned status code {response.status_code}"}
            data = response.json()
        except Exception as e:
            return {"matches": [], "error": f"Network error calling ESPN: {str(e)}"}

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

            is_arsenal_playing = False
            for c in competitors:
                if c.get("team", {}).get("id") == "359" or "Arsenal" in c.get("team", {}).get("displayName", ""):
                    is_arsenal_playing = True
                    break

            if not is_arsenal_playing:
                continue

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
            display_clock = event.get("status", {}).get("type", {}).get("detail", "")

            matches.append({
                "id": f"m_{espn_id}",
                "espn_id": espn_id,
                "teamA": teamA_name,
                "teamA_logo": teamA_logo,
                "teamB": teamB_name,
                "teamB_logo": teamB_logo,
                "scoreA": teamA_score,
                "scoreB": teamB_score,
                "finished": completed,
                "status_name": status_name,
                "display_clock": display_clock,
                "kickoff": kickoff
            })

        matches.sort(key=lambda m: m.get("kickoff", ""))
        return {"matches": matches}

    result = get_cached_data("c1_arsenal_schedule", fetch_arsenal_schedule, expiry_seconds=60)
    return jsonify(result)
