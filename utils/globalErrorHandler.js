// Catches JS errors that happen OUTSIDE React's render phase — event handlers
// (onPress, onChangeText), async code, promises — which a React error boundary
// cannot catch (boundaries only catch errors thrown *during render*).
// ErrorUtils is a React Native global, injected by the runtime — no import needed.
if (typeof ErrorUtils !== 'undefined') {
  const defaultHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error, isFatal) => {
    // console.error → logcat under the ReactNativeJS tag, visible with:
    // adb logcat *:S ReactNative:V ReactNativeJS:V AndroidRuntime:E
    console.error(
      `[GlobalError] ${isFatal ? 'FATAL' : 'non-fatal'}:`,
      error?.message || error,
      error?.stack
    );
    defaultHandler(error, isFatal);
  });
}