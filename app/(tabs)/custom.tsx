// The "Custom" tab never actually renders this — its tabPress listener in
// _layout.tsx redirects to the /custom flow. This just lets Expo Router
// register the tab slot.
export default function CustomTabPlaceholder() {
  return null;
}