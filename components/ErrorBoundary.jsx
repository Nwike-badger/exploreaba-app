import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AlertTriangle, RotateCcw } from 'lucide-react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // console.error → logcat under ReactNativeJS, same filter as above.
    console.error('[ErrorBoundary] Caught render error:', error, errorInfo?.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    try {
      router.replace('/');
    } catch {
      // Fine if the router isn't ready — the state reset alone still
      // gives the tree a fresh render attempt.
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView className="flex-1 bg-white">
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View className="flex-1 items-center justify-center px-8 py-16">
              <View className="w-16 h-16 bg-red-50 rounded-full items-center justify-center mb-5">
                <AlertTriangle size={28} color="#ef4444" />
              </View>
              <Text className="text-xl font-black text-gray-900 mb-2 text-center">
                Something went wrong
              </Text>
              <Text className="text-sm text-gray-500 mb-6 text-center leading-relaxed">
                An unexpected error occurred. Tap below to return to the home screen.
              </Text>
              <Pressable
                onPress={this.handleReset}
                className="bg-gray-900 rounded-xl px-6 py-3.5 flex-row items-center gap-2"
              >
                <RotateCcw size={16} color="#fff" />
                <Text className="text-white font-bold text-sm">Go to Home</Text>
              </Pressable>

              {__DEV__ && this.state.error ? (
                <Text className="text-[10px] text-gray-400 mt-6 text-center px-4">
                  {String(this.state.error?.message || this.state.error)}
                </Text>
              ) : null}
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;