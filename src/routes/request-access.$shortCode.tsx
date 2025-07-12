import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

export const Route = createFileRoute("/request-access/$shortCode")({
  component: RequestAccess,
});

function RequestAccess() {
  const { shortCode } = Route.useParams();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const {
    mutate: requestAccess,
    status,
    error,
  } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/request-access/${shortCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to request access.");
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Verification email sent!");
      setSubmitted(true);
      setEmail("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Something went wrong.");
    },
  });

  const isLoading = status === "pending";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    requestAccess();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-effect max-w-lg w-full p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-white mb-4 text-center">
          Protected Link
        </h1>
        <p className="text-gray-300 mb-6 text-center">
          This link is protected and requires email verification.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-white mb-1"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              placeholder="your@email.com"
              className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isLoading || submitted}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || submitted}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin w-4 h-4 mr-2" />
                Sending...
              </>
            ) : submitted ? (
              "Email Sent"
            ) : (
              "Request Access"
            )}
          </button>

          {status === "error" && (
            <p className="text-sm text-red-400 mt-2 text-center">
              {error instanceof Error ? error.message : "An error occurred"}
            </p>
          )}
        </form>

        <p className="text-sm text-gray-400 mt-6 text-center">
          You’ll receive a verification email if you are authorized.
        </p>
      </div>
    </div>
  );
}
