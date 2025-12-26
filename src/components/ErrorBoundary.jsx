import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 border border-destructive/50 rounded-lg bg-destructive/10 text-destructive space-y-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-6 h-6" />
            <h2 className="text-lg font-semibold">Something went wrong</h2>
          </div>
          <p className="text-sm opacity-90">{this.state.error?.message}</p>
          <Button 
            variant="outline" 
            className="border-destructive/50 hover:bg-destructive/20"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
