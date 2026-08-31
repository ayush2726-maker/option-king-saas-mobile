from pathlib import Path

APP = Path("App.js")
MARKER = "OKAI-OTA-SINGLE-CHECK-V1"

OLD = '''  useEffect(() => {\n    mountedRef.current = true;\n    checkOta(true);\n    const subscription = AppState.addEventListener("change", (state) => {\n      if (state === "active") checkOta(true);\n    });\n\n    return () => {\n      mountedRef.current = false;\n      subscription.remove();\n    };\n  }, []);\n'''

NEW = '''  // OKAI-OTA-SINGLE-CHECK-V1\n  // Check OTA only once per JS launch. Re-checking every time Android reports\n  // AppState=active can create repeated download/apply/relaunch behaviour on\n  // some devices and also makes the dashboard appear to restart.\n  useEffect(() => {\n    mountedRef.current = true;\n    const timer = setTimeout(() => {\n      if (mountedRef.current) checkOta(false);\n    }, 1500);\n\n    return () => {\n      mountedRef.current = false;\n      clearTimeout(timer);\n    };\n  }, []);\n'''


def main():
    text = APP.read_text(encoding="utf-8")
    if MARKER in text:
        print(f"{MARKER} already installed")
        return
    if OLD not in text:
        raise SystemExit("OTA AppState re-check block not found")
    text = text.replace(OLD, NEW, 1)
    APP.write_text(text, encoding="utf-8")
    print(f"Installed {MARKER}")


if __name__ == "__main__":
    main()
