from app import create_app

app = create_app()
with app.app_context():
    print("\n--- ACTIVE ROUTES LIST ---")
    for rule in app.url_map.iter_rules():
        print(f"Endpoint: {rule.endpoint:30} Path: {rule}")
    print("--------------------------\n")
