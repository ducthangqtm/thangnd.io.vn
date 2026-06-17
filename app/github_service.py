import time
import requests

GITHUB_USERNAME = "ducthangqtm"
CACHE_EXPIRY = 3600  # 1 hour
_cache = {
    "repos": None,
    "last_fetched": 0
}

def get_github_repositories():
    now = time.time()
    if _cache["repos"] is not None and (now - _cache["last_fetched"]) < CACHE_EXPIRY:
        return _cache["repos"]
    
    url = f"https://api.github.com/users/{GITHUB_USERNAME}/repos?sort=updated&per_page=50"
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Flask-Portfolio-App"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            repos = response.json()
            # Lọc các repository công khai, không phải fork
            filtered_repos = []
            for r in repos:
                if not r.get("fork", False) and not r.get("private", False):
                    filtered_repos.append({
                        "name": r.get("name"),
                        "description": r.get("description") or "Dự án cá nhân / mã nguồn mở.",
                        "html_url": r.get("html_url"),
                        "stargazers_count": r.get("stargazers_count", 0),
                        "language": r.get("language") or "Python",
                        "forks_count": r.get("forks_count", 0)
                    })
            # Sắp xếp theo số sao giảm dần
            filtered_repos.sort(key=lambda x: x["stargazers_count"], reverse=True)
            # Lấy top 6 dự án nổi bật nhất
            result = filtered_repos[:6]
            _cache["repos"] = result
            _cache["last_fetched"] = now
            return result
    except Exception as e:
        print(f"Error fetching GitHub repos: {e}")
        if _cache["repos"] is not None:
            return _cache["repos"]
            
    return []
