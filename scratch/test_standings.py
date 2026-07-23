import requests

url = "https://site.api.espn.com/apis/v2/sports/soccer/eng.1/standings"
res = requests.get(url, headers={"User-Agent": "Mozilla"}, timeout=10)
if res.status_code == 200:
    data = res.json()
    children = data.get("children", [])
    if children:
        entries = children[0].get("standings", {}).get("entries", [])
        if entries:
            print("First entry keys:", entries[0].keys())
            print("First entry sample:")
            import pprint
            pprint.pprint(entries[0])
else:
    print("Error:", res.status_code)
