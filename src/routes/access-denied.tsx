import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/access-denied")({
  component: AccessDenied,
});

function AccessDenied() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow flex items-center justify-center px-4 pt-24 pb-12">
        <div className="glass-effect max-w-lg w-full p-8 rounded-xl shadow-lg text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">
            You are not authorized to access this link.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-md"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}
