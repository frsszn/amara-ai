#!/usr/bin/env python3
"""Generate bcrypt password hash for seeding users."""
import sys
import bcrypt


def main():
    if len(sys.argv) < 2:
        print("Usage: python generate_password_hash.py <password>")
        sys.exit(1)

    password = sys.argv[1]
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    print(f"Password: {password}")
    print(f"Hash: {hashed}")
    print(f"\nSQL INSERT:")
    print(f"'{hashed}'")


if __name__ == "__main__":
    main()
