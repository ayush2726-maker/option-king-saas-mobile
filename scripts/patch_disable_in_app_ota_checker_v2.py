from pathlib import Path

APP = Path("App.js")
MARKER = "OKAI-INAPP-OTA-DISABLED-V3"
START = "function OtaStatusBanner() {"
DASHBOARD = "// ── Dashboard Screen ──────────────────────────────────────"


def main():
    text = APP.read_text(encoding="utf-8")
    if MARKER in text:
        print(f"{MARKER} already installed")
        return

    start = text.find(START)
    if start < 0:
        raise SystemExit("OtaStatusBanner start not found")
    end = text.find(DASHBOARD, start)
    if end < 0:
        raise SystemExit("Dashboard Screen marker not found after OtaStatusBanner")

    replacement = '''// OKAI-INAPP-OTA-DISABLED-V3\n// In-app Expo update polling is intentionally disabled. Keep DashboardScreen\n// and all following application code intact; replace only OtaStatusBanner.\nfunction OtaStatusBanner() {\n  return null;\n}\n\n\n'''

    text = text[:start] + replacement + text[end:]
    APP.write_text(text, encoding="utf-8")

    if "function DashboardScreen(" not in text:
        raise SystemExit("Safety check failed: DashboardScreen missing after patch")
    if "function InnerApp()" not in text:
        raise SystemExit("Safety check failed: InnerApp missing after patch")

    print(f"Installed {MARKER}; DashboardScreen preserved")


if __name__ == "__main__":
    main()
