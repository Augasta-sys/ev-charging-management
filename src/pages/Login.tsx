import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BatteryCharging,
  Eye,
  EyeOff,
  Zap,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      const loggedInUser = await login(
        email,
        password
      );

      navigate(`/${loggedInUser.role}/dashboard`);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to login"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#07111F] text-white">
      {/* Background Glow */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full bg-[#22D3EE]/10 blur-[100px]" />

      <div className="pointer-events-none absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-[#8B5CF6]/10 blur-[100px]" />

      {/* Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Floating dots */}
      <div className="absolute left-[8%] top-[22%] h-1.5 w-1.5 animate-pulse rounded-full bg-[#22D3EE]" />

      <div className="absolute left-[28%] bottom-[18%] h-1.5 w-1.5 animate-pulse rounded-full bg-[#8B5CF6]" />

      <div className="absolute right-[18%] top-[18%] h-1.5 w-1.5 animate-pulse rounded-full bg-[#22D3EE]" />

      <div className="absolute right-[8%] bottom-[22%] h-1.5 w-1.5 animate-pulse rounded-full bg-[#22D3EE]" />

      {/* Header */}
      <header className="absolute left-0 right-0 top-0 z-30">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-5 sm:h-[72px] sm:px-8 lg:px-10">
          {/* Logo */}
          <Link
            to="/login"
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#22D3EE] to-[#8B5CF6] shadow-lg shadow-cyan-500/20 sm:h-10 sm:w-10">
              <Zap
                size={19}
                fill="currentColor"
                className="text-white"
              />
            </div>

            <div>
              <p className="text-sm font-bold tracking-[0.1em] sm:text-base">
                EV CHARGE
                <span className="text-[#22D3EE]">
                  HUB
                </span>
              </p>

              <p className="hidden text-[9px] uppercase tracking-[0.25em] text-slate-500 sm:block">
                Smart Energy
              </p>
            </div>
          </Link>

          {/* Network */}
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] text-slate-400 backdrop-blur-xl sm:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />
            Network Online
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="relative z-10 flex h-full items-center justify-center px-4 pt-16 sm:px-6 sm:pt-[72px]">
        <div className="mx-auto grid w-full max-w-[1250px] items-center gap-6 lg:grid-cols-[1fr_420px] xl:gap-14">
          {/* LEFT - 3D Charger */}
          <section className="hidden h-[calc(100vh-110px)] min-h-[450px] items-center justify-center lg:flex">
            <div className="relative flex h-[min(72vh,540px)] w-[min(44vw,540px)] items-center justify-center">
              {/* Rings */}
              <div className="absolute h-[88%] w-[88%] rounded-full border border-[#22D3EE]/10" />

              <div className="absolute h-[72%] w-[72%] rounded-full border border-[#8B5CF6]/10" />

              <div className="absolute h-[56%] w-[56%] rounded-full border border-[#22D3EE]/10" />

              <div className="absolute h-[80%] w-[80%] animate-[spin_18s_linear_infinite] rounded-full border border-dashed border-[#22D3EE]/35" />

              {/* Ground Glow */}
              <div className="absolute bottom-[8%] h-16 w-64 rounded-full bg-[#22D3EE]/20 blur-3xl" />

              {/* Charger */}
              <div className="relative z-10 flex h-[60%] w-[34%] min-w-[160px] max-w-[200px] -rotate-6 flex-col items-center rounded-[32px] border border-white/15 bg-gradient-to-br from-[#18283D] via-[#101D31] to-[#07111F] p-4 shadow-[0_35px_90px_rgba(0,0,0,0.55),0_0_50px_rgba(34,211,238,0.12)]">
                {/* Top */}
                <div className="absolute -top-5 h-7 w-16 rounded-t-xl border border-white/10 bg-[#16263D]" />

                {/* Screen */}
                <div className="mt-6 flex h-28 w-full flex-col items-center justify-center rounded-2xl border border-[#22D3EE]/20 bg-[#07111F] shadow-inner">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />

                    <span className="text-[8px] uppercase tracking-[0.18em] text-[#22D3EE]">
                      Charging
                    </span>
                  </div>

                  <div className="text-3xl font-bold">
                    82
                    <span className="text-lg text-[#22D3EE]">
                      %
                    </span>
                  </div>

                  <p className="mt-1 text-[8px] text-slate-500">
                    Battery Level
                  </p>
                </div>

                {/* Energy */}
                <div className="mt-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#22D3EE]/30 bg-[#22D3EE]/5 shadow-[0_0_30px_rgba(34,211,238,0.15)]">
                  <Zap
                    size={27}
                    className="text-[#22D3EE]"
                    fill="currentColor"
                  />
                </div>

                {/* Indicator */}
                <div className="mt-auto flex gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE]/50" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE]/20" />
                </div>
              </div>

              {/* Energy Card */}
              <div className="absolute right-[2%] top-[14%] z-20 rounded-2xl border border-white/10 bg-[#0B1628]/90 px-4 py-3 shadow-xl backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#22D3EE]/10">
                    <BatteryCharging
                      size={18}
                      className="text-[#22D3EE]"
                    />
                  </div>

                  <div>
                    <p className="text-[9px] text-slate-500">
                      Energy Delivered
                    </p>

                    <p className="text-sm font-semibold">
                      24.8 kWh
                    </p>
                  </div>
                </div>
              </div>

              {/* Speed Card */}
              <div className="absolute bottom-[14%] left-[2%] z-20 rounded-2xl border border-white/10 bg-[#0B1628]/90 px-4 py-3 shadow-xl backdrop-blur-xl">
                <p className="text-[9px] text-slate-500">
                  Charging Speed
                </p>

                <div className="mt-0.5 flex items-end gap-1">
                  <span className="text-xl font-bold">
                    150
                  </span>

                  <span className="mb-0.5 text-[10px] text-[#22D3EE]">
                    kW
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT - Login */}
<section
  className="
    login-scroll
    flex max-h-[calc(100vh-90px)]
    items-center justify-center
    overflow-y-auto
    pb-8 pt-0
    lg:items-start
    lg:justify-end
    lg:pt-4
  "
>
            <div className="w-full max-w-[420px]">
              {/* Heading */}
              <div className="mb-4 sm:mb-5">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#22D3EE]">
                  Welcome Back
                </p>

                <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                  Charge smarter.
                  <span className="block bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] bg-clip-text text-transparent">
                    Drive farther.
                  </span>
                </h1>

                <p className="mt-1.5 text-xs leading-5 text-slate-500 sm:text-sm">
                  Manage stations, bookings, vehicles and
                  charging sessions from one platform.
                </p>
              </div>

              {/* Card */}
              <div className="rounded-[24px] border border-white/10 bg-[#0B1628]/90 p-5 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-6">
                <form
                  onSubmit={handleSubmit}
                  className="space-y-3"
                >
                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1.5 block text-xs font-medium text-slate-300"
                    >
                      Email Address
                    </label>

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      placeholder="you@example.com"
                      required
                      className="h-10 w-full rounded-xl border border-white/10 bg-[#07111F] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#22D3EE] focus:ring-4 focus:ring-[#22D3EE]/10"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label
                        htmlFor="password"
                        className="text-xs font-medium text-slate-300"
                      >
                        Password
                      </label>

                      <Link
                        to="/forgot-password"
                        className="text-[11px] font-medium text-[#22D3EE] transition hover:text-white"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <div className="relative">
                      <input
                        id="password"
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        value={password}
                        onChange={(event) =>
                          setPassword(event.target.value)
                        }
                        placeholder="Enter your password"
                        required
                        className="h-10 w-full rounded-xl border border-white/10 bg-[#07111F] px-4 pr-11 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#22D3EE] focus:ring-4 focus:ring-[#22D3EE]/10"
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

                  {/* Error */}
                 {error && (
  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
    {error}
  </div>
)}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative mt-1 h-9 w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] text-sm font-semibold text-white shadow-lg shadow-cyan-500/10 transition duration-300 hover:-translate-y-0.5 hover:shadow-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="relative z-10">
                      {isLoading
                        ? "Connecting..."
                        : "⚡  Sign In"}
                    </span>

                    <span className="absolute inset-0 -translate-x-full bg-white/15 transition-transform duration-500 group-hover:translate-x-0" />
                  </button>
                </form>

                {/* Sign Up */}
                <p className="mt-4 text-center text-xs text-slate-500">
                  Don't have an account?{" "}
                  <Link
                    to="/signup"
                    className="font-semibold text-[#22D3EE] transition hover:text-white"
                  >
                    Sign up
                  </Link>
                </p>

                {/* Footer */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10" />

                  <span className="text-[8px] uppercase tracking-[0.18em] text-slate-600">
                    Secure Access
                  </span>

                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <div className="mt-2 flex items-center justify-center gap-2 text-[9px] text-slate-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />
                  EV network operational
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default Login;