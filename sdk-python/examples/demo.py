from txbob import TxLINE
import json

client = TxLINE()

print("📊 Fetching World Cup fixtures (competitionId=72)...")
fixtures = client.get_fixtures(competition_id=72)
print(json.dumps(fixtures, indent=2)[:500])

print("\n📈 Fetching odds for Spain vs Argentina (fixtureId=18257739)...")
odds = client.get_odds(18257739)
print(json.dumps(odds, indent=2)[:500])

print("\n📊 Fetching scores for Spain vs Argentina...")
scores = client.get_scores(18257739)
print(json.dumps(scores, indent=2)[:500])
