import { useState, type SyntheticEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import api from "../services/api";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async (
  event: SyntheticEvent<HTMLFormElement>
) => {
    event.preventDefault();

    setError("");

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await api.get("/users", {
        params: {
          email: trimmedEmail,
        },
      });

      const user = response.data.find(
        (item: { email: string }) =>
          item.email.toLowerCase() === trimmedEmail
      );

      if (!user) {
        setError(
          "No account was found with this email address."
        );
        return;
      }

      sessionStorage.setItem(
        "reset_email",
        trimmedEmail
      );

      navigate("/reset-password");
    } catch (err) {
      console.error(err);
      setError(
        "Unable to verify the email. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="fixed inset-0 overflow-y-auto bg-[#07111F] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#22D3EE]/10 blur-[140px]" />

        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-[#8B5CF6]/10 blur-[140px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link
          to="/login"
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#22D3EE] to-[#8B5CF6] shadow-[0_0_25px_rgba(34,211,238,0.2)]">
            <Zap
              size={21}
              fill="currentColor"
              className="text-white"
            />
          </div>

          <div>
            <p className="text-sm font-bold">
              EV Charge
              <span className="text-[#22D3EE]">
                Hub
              </span>
            </p>

            <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">
              Smart Charging
            </p>
          </div>
        </Link>

        <Link
          to="/login"
          className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-[#22D3EE]"
        >
          <ArrowLeft size={16} />
          Back to Login
        </Link>
      </header>

      {/* Content */}
      <div className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="rounded-[28px] border border-[#1E334D] bg-[#0B1628]/95 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8">
            {/* Icon */}
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#22D3EE]/20 to-[#8B5CF6]/20">
              <ShieldCheck
                size={27}
                className="text-[#22D3EE]"
              />
            </div>

            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              Forgot your password?
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Enter the email address associated with your
              account. We'll help you reset your password.
            </p>

            {error && (
              <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-5"
            >
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="you@example.com"
                    className="h-12 w-full rounded-xl border border-[#1E334D] bg-[#101D31] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#22D3EE]/60 focus:ring-2 focus:ring-[#22D3EE]/10"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] text-sm font-bold text-white shadow-[0_10px_30px_rgba(34,211,238,0.15)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading
                  ? "Checking..."
                  : "Continue"}

                {!isLoading && (
                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500">
              Remember your password?{" "}
              <Link
                to="/login"
                className="font-semibold text-[#22D3EE] hover:text-white"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default ForgotPassword;