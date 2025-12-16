"use client";

import React from 'react';

type Props = { children: React.ReactNode };

type State = { hasError: boolean };

export class SilentErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // eslint-disable-next-line no-console
    console.error('[SilentErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      // Render nothing to avoid demo-disrupting overlays; errors logged to console
      return null;
    }
    return this.props.children;
  }
}


