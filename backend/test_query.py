import sqlite3
import time

db_path = "/app/music_manager.db"
conn = sqlite3.connect(db_path, timeout=10.0)
cursor = conn.cursor()

print("Testing queries...")

start = time.time()
cursor.execute("SELECT COUNT(*) FROM tracks")
track_count = cursor.fetchone()[0]
print(f"Tracks: {track_count} (took {time.time() - start:.2f}s)")

start = time.time()
cursor.execute("SELECT COUNT(*) FROM albums")
album_count = cursor.fetchone()[0]
print(f"Albums: {album_count} (took {time.time() - start:.2f}s)")

start = time.time()
cursor.execute("SELECT COUNT(DISTINCT artist_id) FROM albums")
artist_count = cursor.fetchone()[0]
print(f"Artists: {artist_count} (took {time.time() - start:.2f}s)")

start = time.time()
cursor.execute("SELECT SUM(duration_seconds) FROM tracks")
total_duration = cursor.fetchone()[0]
print(f"Total duration: {total_duration} (took {time.time() - start:.2f}s)")

start = time.time()
cursor.execute("SELECT AVG(bit_rate) FROM tracks")
avg_bitrate = cursor.fetchone()[0]
print(f"Avg bitrate: {avg_bitrate} (took {time.time() - start:.2f}s)")

conn.close()
print("All queries completed successfully!")
