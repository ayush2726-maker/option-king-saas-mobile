from pathlib import Path

APP = Path("App.js")
MARKER = "OKAI-INAPP-OTA-DISABLED-V2"
START = "function OtaStatusBanner() {"
END = "// ── Main App ──────────────────────────────────────────────"


def main():
    text = APP.read_text(encoding="utf-8")
    if MARKER in text:
        print(f"{MARKER} already installed")
        return

    start = text.find(START)
    if start < 0:
        raise SystemExit("OtaStatusBanner start not found")
    end = text.find(END, start)
    if end < 0:
        raise SystemExit("Main App marker not found after OtaStatusBanner")

    replacement = '''// OKAI-INAPP-OTA-DISABLED-V2\n// In-app Expo update polling is intentionally disabled. Production OTA is\n// published by CI; the installed Expo runtime may apply it on a normal cold\n// start without this component polling/downloading while the app is running.\nfunction OtaStatusBanner() {\n  return null;\n}\n\n'''

    text = text[:start] + replacement + text[end:]
    APP.write_text(text, encoding="utf-8")
    print(f"Installed {MARKER}")


if __name__ == "__main__":
    main()
