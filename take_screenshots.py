import subprocess
import time
import os
import sys
import http.server
import socketserver
import threading

PORT = 4173
DIST_DIR = os.path.abspath('dist')
CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
OUTPUT_DIR = r'C:\Users\jeo20\.gemini\antigravity\brain\75a8d1e2-b51e-4169-94c1-20816edfed92'

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST_DIR, **kwargs)

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        httpd.serve_forever()

def capture():
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    time.sleep(2)

    url = f"http://localhost:{PORT}/#control"
    desktop_png = os.path.join(OUTPUT_DIR, "screenshot_desktop.png")
    mobile_png = os.path.join(OUTPUT_DIR, "screenshot_mobile.png")

    # Desktop screenshot
    print("Capturing Desktop screenshot...")
    cmd_desktop = [
        CHROME_PATH,
        "--headless",
        "--disable-gpu",
        "--no-sandbox",
        "--hide-scrollbars",
        "--window-size=1280,1400",
        "--virtual-time-budget=3000",
        f"--screenshot={desktop_png}",
        url
    ]
    subprocess.run(cmd_desktop, check=True)
    print(f"Desktop screenshot saved to {desktop_png}")

    # Mobile screenshot
    print("Capturing Mobile screenshot...")
    cmd_mobile = [
        CHROME_PATH,
        "--headless",
        "--disable-gpu",
        "--no-sandbox",
        "--hide-scrollbars",
        "--window-size=390,844",
        "--virtual-time-budget=3000",
        "--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
        f"--screenshot={mobile_png}",
        url
    ]
    subprocess.run(cmd_mobile, check=True)
    print(f"Mobile screenshot saved to {mobile_png}")

if __name__ == '__main__':
    capture()
