import "../global.css";
import { Stack } from "expo-router";
import Toast from "react-native-toast-message";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <Stack screenOptions={{ headerShown: false }} />
          <Toast />
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}