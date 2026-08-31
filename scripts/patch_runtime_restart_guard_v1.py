from pathlib import Path

APP = Path('App.js')
MARKER = 'OKAI-RUNTIME-RESTART-GUARD-V1'
OLD_START = '// ── Global crash catcher (temporary debug tool) ──────────────'
OLD_END = '// ── Colors ──────────────────────────────────────────────'


def main():
    text = APP.read_text(encoding='utf-8')
    if MARKER in text:
        print(f'{MARKER} already installed')
        return

    start = text.find(OLD_START)
    end = text.find(OLD_END, start)
    if start < 0 or end < 0:
        raise SystemExit('Global crash catcher block not found')

    replacement = '''// OKAI-RUNTIME-RESTART-GUARD-V1\n// Production JS errors must not delegate to React Native's default fatal\n// handler, because that handler can terminate/relaunch the Android process and\n// make the app look like it is continuously restarting. ErrorBoundary remains\n// responsible for render errors; async/global JS errors are logged here.\nif (typeof ErrorUtils !== "undefined" && ErrorUtils.setGlobalHandler) {\n  const __defaultHandler = ErrorUtils.getGlobalHandler ? ErrorUtils.getGlobalHandler() : null;\n  ErrorUtils.setGlobalHandler((error, isFatal) => {\n    try {\n      console.log("OKAI_GLOBAL_RUNTIME_ERROR", {\n        fatal: !!isFatal,\n        message: String(error && error.message ? error.message : error),\n        stack: String(error && error.stack ? error.stack : "").slice(0, 1200),\n      });\n    } catch (_) {}\n\n    // In development keep the normal RN redbox/debug behaviour. In production\n    // do not call the default JS fatal handler; it may kill/relaunch the app.\n    if (__DEV__ && __defaultHandler) {\n      __defaultHandler(error, isFatal);\n    }\n  });\n}\n\n'''

    text = text[:start] + replacement + text[end:]
    text = text.replace('import * as Updates from "expo-updates";\n', '')
    text = text.replace('  BackHandler, Linking, AppState, DeviceEventEmitter\n', '  BackHandler, Linking, DeviceEventEmitter\n')

    if 'function DashboardScreen(' not in text:
        raise SystemExit('Safety check failed: DashboardScreen missing')
    if 'function InnerApp()' not in text:
        raise SystemExit('Safety check failed: InnerApp missing')
    if 'function OtaStatusBanner()' not in text:
        raise SystemExit('Safety check failed: OtaStatusBanner missing')

    APP.write_text(text, encoding='utf-8')
    print(f'Installed {MARKER}')


if __name__ == '__main__':
    main()
