import os
import requests
from dotenv import load_dotenv

load_dotenv()

class TxLINE:
    def __init__(self):
        self.base_url = os.getenv("TXLINE_API_URL")
        self.jwt = os.getenv("TXLINE_JWT")
        self.api_token = os.getenv("TXLINE_API_TOKEN")
        self.headers = {
            "Authorization": f"Bearer {self.jwt}",
            "X-Api-Token": self.api_token
        }
    
    def get_fixtures(self, competition_id=None):
        """Get fixtures snapshot. Use competition_id=72 for World Cup."""
        url = f"{self.base_url}/fixtures/snapshot"
        if competition_id:
            url += f"?competitionId={competition_id}"
        response = requests.get(url, headers=self.headers)
        return response.json()
    
    def get_odds(self, fixture_id):
        """Get odds snapshot for a specific fixture."""
        url = f"{self.base_url}/odds/snapshot/{fixture_id}"
        response = requests.get(url, headers=self.headers)
        return response.json()
    
    def get_scores(self, fixture_id):
        """Get scores snapshot for a specific fixture."""
        url = f"{self.base_url}/scores/snapshot/{fixture_id}"
        response = requests.get(url, headers=self.headers)
        return response.json()
