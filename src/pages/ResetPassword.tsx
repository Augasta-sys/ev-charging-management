import { useState, type SyntheticEvent } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Zap,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import api from "../services/api";

function ResetPassword() {
  const navigate = useNavigate();

  const [email] = useState(
    () => sessionStorage.getItem("reset_email") ?? ""
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (
    event: SyntheticEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!email) {
      setError(
        "Password reset session has expired. Please request a new reset link."
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await api.get("/users", {
        params: {
          email,
        },
      });

      const user = response.data.find(
        (item: { email: string }) =>
          item.email.toLowerCase() === email.toLowerCase()
      );

      if (!user) {
        setError("No account was found with this email.");
        return;
      }

      await api.patch(`/users/${user.id}`, {
        password,
      });

      sessionStorage.removeItem("reset_email");

      navigate("/login", {
        replace: true,
        state: {
          message:
            "Password updated successfully. Please login with your new password.",
        },
      });
    } catch (err) {
      console.error(err);

      setError(
        "Unable to reset your password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#07111F] text-white">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#22D3EE]/10 blur-[120px]" />

        <div className="absolute -bottom-40 -right-40 h-[450px] w-[450px] rounded-full bg-[#8B5CF6]/10 blur-[130px]" />

        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#22D3EE]/5 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="absolute left-0 right-0 top-0 z-20">
        <div className="flex h-16 items-center justify-between px-4 sm:px-7 lg:px-10">
          <Link
            to="/login"
            className="group flex items-center gap-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#22D3EE] to-[#8B5CF6] shadow-[0_0_22px_rgba(34,211,238,0.2)] transition group-hover:scale-105">
              <Zap
                size={19}
                fill="currentColor"
                className="text-white"
              />
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-bold leading-none text-white">
                EV Charge
                <span className="text-[#22D3EE]">Hub</span>
              </p>

              <p className="mt-1 text-[8px] uppercase tracking-[0.2em] text-slate-500">
                Smart Charging
              </p>
            </div>
          </Link>

          <Link
            to="/login"
            className="text-xs font-medium text-slate-400 transition hover:text-[#22D3EE] sm:text-sm"
          >
            Back to
            <span className="ml-1 font-semibold text-[#22D3EE]">
              Login
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="relative flex h-full items-center justify-center px-4 pt-16">
        <div className="w-full max-w-md">
          <div className="rounded-[26px] border border-[#1E334D] bg-[#0B1628]/95 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8">
            {/* Icon */}
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#22D3EE]/20 to-[#8B5CF6]/20">
              <LockKeyhole
                size={22}
                className="text-[#22D3EE]"
              />
            </div>

            {/* Heading */}
            <h1 className="text-2xl font-bold text-white">
              Reset Password
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Create a new password for your EV Charge Hub
              account.
            </p>

            {/* Error */}
            {error && (
              <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs leading-5 text-red-400">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-4"
            >
              {/* Email */}
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
                  />

                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="h-12 w-full rounded-xl border border-[#1E334D] bg-[#101D31] pl-11 pr-4 text-sm text-slate-400 outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  New Password
                </label>

                <div className="relative">
                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Minimum 8 characters"
                    className="h-12 w-full rounded-xl border border-[#1E334D] bg-[#101D31] px-4 pr-11 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#22D3EE]/60 focus:ring-2 focus:ring-[#22D3EE]/10"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (previous) => !previous
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-[#22D3EE]"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Confirm New Password
                </label>

                <div className="relative">
                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    placeholder="Repeat your new password"
                    className="h-12 w-full rounded-xl border border-[#1E334D] bg-[#101D31] px-4 pr-11 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#22D3EE]/60 focus:ring-2 focus:ring-[#22D3EE]/10"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (previous) => !previous
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-[#22D3EE]"
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] text-sm font-bold text-white shadow-[0_10px_30px_rgba(34,211,238,0.15)] transition hover:scale-[1.01] hover:shadow-[0_10px_35px_rgba(34,211,238,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading
                  ? "Updating Password..."
                  : "Update Password"}

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
                className="font-semibold text-[#22D3EE] transition hover:text-white"
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

export default ResetPassword;