import type { FallbackProps } from 'react-error-boundary';

export const MainErrorFallback = ({
  error,
  resetErrorBoundary,
}: FallbackProps) => {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-gray-50 text-gray-900">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-sm text-gray-600">{message}</p>
      <button
        onClick={resetErrorBoundary}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 cursor-pointer"
      >
        Try again
      </button>
    </div>
  );
};
