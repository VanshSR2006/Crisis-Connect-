import sqlite3

db = sqlite3.connect("crisis_connect.db")

users = db.execute(
    "SELECT id, name, email, role FROM users"
).fetchall()

for user in users:
    print(user)

db.close()