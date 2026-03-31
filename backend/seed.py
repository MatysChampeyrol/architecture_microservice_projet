import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from supabase import create_client
from config.config import get_settings

USERS = [
    {"first_name": "Admin", "last_name": "Un", "email": "admin1@projet.com", "password": "Admin1234!", "role": "admin"},
    {"first_name": "Admin", "last_name": "Deux", "email": "admin2@projet.com", "password": "Admin1234!", "role": "admin"},
    {"first_name": "User", "last_name": "Un", "email": "user1@projet.com", "password": "User1234!", "role": "user"},
    {"first_name": "User", "last_name": "Deux", "email": "user2@projet.com", "password": "User1234!", "role": "user"},
    {"first_name": "User", "last_name": "Trois", "email": "user3@projet.com", "password": "User1234!", "role": "user"},
]


def main():
    settings = get_settings()
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

    for user in USERS:
        try:
            res = supabase.auth.sign_up({
                "email": user["email"],
                "password": user["password"],
                "options": {
                    "data": {
                        "first_name": user["first_name"],
                        "last_name": user["last_name"],
                        "role": user["role"]
                    }
                }
            })
            if res.user:
                print(f"Created: {user['email']}")
            else:
                print(f"Error: {user['email']}")
        except Exception as e:
            print(f"Already exists or error: {user['email']} - {e}")


if __name__ == "__main__":
    main()
