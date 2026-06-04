import React from 'react';

interface State { hasError: boolean; }

/**
 * Bungkus ChatWidget supaya error di dalamnya tidak men-crash seluruh halaman
 * (mencegah white screen ketika diakses customer).
 */
export class ChatErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Log untuk debugging tanpa menjatuhkan UI
    console.error('[ChatWidget] runtime error:', error, info);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
