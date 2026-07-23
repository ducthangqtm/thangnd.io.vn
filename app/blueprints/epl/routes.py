import os
import requests
from flask import jsonify, render_template, request
from . import epl_bp

@epl_bp.route('/')
def index():
    return render_template("epl/index.html")

@epl_bp.route('/api/standings', methods=['GET'])
def api_get_standings():
    """
    Fetches the Premier League standings from ESPN API.
    """
    url = "https://site.api.espn.com/apis/v2/sports/soccer/eng.1/standings"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            return jsonify({"standings": [], "error": f"ESPN returned status code {response.status_code}"})
        data = response.json()
    except Exception as e:
        return jsonify({"standings": [], "error": f"Network error calling ESPN: {str(e)}"})

    standings_list = []
    # Parse ESPN standings format
    children = data.get("children", [])
    if children:
        standings_data = children[0].get("standings", {}).get("entries", [])
        for entry in standings_data:
            team_info = entry.get("team", {})
            stats = entry.get("stats", [])
            
            # Helper to get specific stat
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
                "points": int(get_stat("points"))
            })
            
    return jsonify({"standings": standings_list})

@epl_bp.route('/api/schedule', methods=['GET'])
def api_get_schedule():
    """
    Fetches the Premier League matches from ESPN API.
    """
    # ESPN Scoreboard API defaults to current matches
    # We can also support passing a date or week parameter
    date_param = request.args.get("date", "20260801-20270601")
    limit = request.args.get("limit", "100")
    
    url = f"https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard?limit={limit}"
    if date_param:
        url += f"&dates={date_param}"
        
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
        
        # Current game time (e.g. 45' or FT)
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

    # Sort matches by kickoff time
    matches.sort(key=lambda m: m.get("kickoff", ""))

    return jsonify({"matches": matches})

@epl_bp.route('/api/arsenal/schedule', methods=['GET'])
def api_get_arsenal_schedule():
    """
    Returns only Arsenal matches from the schedule.
    """
    url = "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard?dates=20260801-20270601&limit=150"
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

        # Check if Arsenal (Team ID 359) is playing
        is_arsenal_playing = False
        for c in competitors:
            if c.get("team", {}).get("id") == "359" or "Arsenal" in c.get("team", {}).get("displayName", ""):
                is_arsenal_playing = True
                break

        if not is_arsenal_playing:
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
    return jsonify({"matches": matches})

@epl_bp.route('/api/arsenal/roster', methods=['GET'])
def api_get_arsenal_roster():
    """
    Fetches the Arsenal squad/roster from ESPN.
    """
    url = "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/teams/359/roster"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            return jsonify({"roster": [], "error": f"ESPN returned status code {response.status_code}"})
        data = response.json()
    except Exception as e:
        return jsonify({"roster": [], "error": f"Network error calling ESPN: {str(e)}"})

    athletes = data.get("athletes", [])
    
    # We will group by position category (Goalkeeper, Defender, Midfielder, Forward)
    categories = {
        "Goalkeeper": [],
        "Defender": [],
        "Midfielder": [],
        "Forward": []
    }
    
    for a in athletes:
        pos_type = a.get("position", {}).get("displayName", "Other")
        
        # Normalize positions
        if "Goalkeeper" in pos_type:
            pos_key = "Goalkeeper"
        elif "Defender" in pos_type:
            pos_key = "Defender"
        elif "Midfielder" in pos_type:
            pos_key = "Midfielder"
        elif "Forward" in pos_type or "Striker" in pos_type or "Winger" in pos_type:
            pos_key = "Forward"
        else:
            pos_key = "Midfielder" # Fallback

        categories[pos_key].append({
            "id": a.get("id"),
            "name": a.get("displayName"),
            "jersey": a.get("jersey", "-"),
            "position": pos_type,
            "age": a.get("age"),
            "nationality": a.get("citizenship", ""),
            "height": a.get("displayHeight", ""),
            "weight": a.get("displayWeight", "")
        })

    return jsonify({"roster": categories})

