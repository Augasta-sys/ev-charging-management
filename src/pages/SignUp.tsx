import { useState, type SyntheticEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Mail,
  Phone,
  User,
  Zap,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import api from "../services/api";

function SignUp() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (
    event: SyntheticEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setError("Please enter your full name.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!/^\d{10}$/.test(trimmedPhone)) {
      setError("Phone number must contain 10 digits.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsLoading(true);

      // Check whether email already exists
      const existingUsersResponse = await api.get("/users", {
        params: {
          email: trimmedEmail,
        },
      });

      const emailExists = existingUsersResponse.data.some(
        (user: { email: string }) =>
          user.email.toLowerCase() === trimmedEmail
      );

      if (emailExists) {
        setError("An account with this email already exists.");
        return;
      }

      // Get existing users
      const usersResponse = await api.get("/users");

      const customerCount =
        usersResponse.data.filter(
          (user: { role: string }) => user.role === "customer"
        ).length + 1;

      const newUser = {
        id: `USR${String(customerCount + 4).padStart(3, "0")}`,
        name: trimmedName,
        email: trimmedEmail,
        password,
        role: "customer",
        phone: trimmedPhone,
        status: "Active",
        createdDate: new Date().toISOString().split("T")[0],
      };

      // Create customer
      await api.post("/users", newUser);

      setSuccess(
        "Account created successfully! Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to create your account. Please make sure the server is running."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#07111F] text-white">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#22D3EE]/10 blur-[120px]" />

        <div className="absolute -bottom-40 -right-40 h-[450px] w-[450px] rounded-full bg-[#8B5CF6]/10 blur-[130px]" />

        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#22D3EE]/5 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="absolute left-0 right-0 top-0 z-30">
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
            Already have an account?
            <span className="ml-1 font-semibold text-[#22D3EE]">
              Login
            </span>
          </Link>
        </div>
      </header>

      {/* Main screen */}
      <div className="relative flex h-full items-center justify-center px-3 pb-3 pt-16 sm:px-5 sm:pb-4">
        <div className="grid h-full max-h-[calc(100vh-4.5rem)] w-full max-w-6xl items-center gap-5 lg:grid-cols-[0.9fr_1.1fr]">
         {/* Left 3D visual */}
          <div className="relative hidden h-full min-h-0 lg:flex lg:items-center lg:justify-center">
            {/* Rings */}
            <div className="absolute h-[390px] w-[390px] rounded-full border border-[#22D3EE]/10" />

            <div className="absolute h-[310px] w-[310px] rounded-full border border-[#8B5CF6]/10" />

            {/* Charger */}
            <div className="relative z-10 w-[220px]">
              <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-[#16263D] to-[#0B1628] p-4 shadow-[0_30px_70px_rgba(0,0,0,0.5),0_0_45px_rgba(34,211,238,0.08)]">
                <div className="rounded-[24px] border border-[#1E334D] bg-[#07111F] p-5">
                  {/* Display */}
                  <div className="mb-5 rounded-2xl border border-[#22D3EE]/20 bg-[#22D3EE]/5 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[8px] uppercase tracking-widest text-slate-500">
                        Charging
                      </span>

                      <span className="h-2 w-2 rounded-full bg-[#22D3EE] shadow-[0_0_10px_#22D3EE]" />
                    </div>

                    <div className="text-3xl font-bold text-[#22D3EE]">
                      82%
                    </div>

                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#1E334D]">
                      <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6]" />
                    </div>
                  </div>

                  {/* Charging port */}
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-8 border-[#16263D] bg-[#101D31] shadow-inner">
                    <div className="h-8 w-8 rounded-full bg-[#22D3EE] shadow-[0_0_25px_#22D3EE]" />
                  </div>

                  <div className="mt-5 text-center">
                    <p className="text-xs font-semibold text-white">
                      EV CHARGER
                    </p>

                    <p className="mt-1 text-[9px] text-slate-500">
                      Fast • Reliable • Smart
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Floating card 1 */}
            <div className="absolute left-0 top-[18%] rounded-2xl border border-[#1E334D] bg-[#0B1628]/90 p-3 shadow-xl backdrop-blur-xl">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#22D3EE]/10">
                  <Zap
                    size={17}
                    className="text-[#22D3EE]"
                  />
                </div>

                <div>
                  <p className="text-[9px] text-slate-500">
                    Clean Energy
                  </p>

                  <p className="text-xs font-bold text-white">
                    100% Smart
                  </p>
                </div>
              </div>
            </div>

            {/* Floating card 2 */}
            <div className="absolute bottom-[18%] right-0 rounded-2xl border border-[#1E334D] bg-[#0B1628]/90 p-3 shadow-xl z-50 backdrop-blur-xl">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8B5CF6]/10">
                  <CheckCircle2
                    size={17}
                    className="text-[#A78BFA]"
                  />
                </div>

                <div>
                  <p className="text-[9px] text-slate-500">
                    Stations
                  </p>

                  <p className="text-xs font-bold text-white">
                    Always Connected
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sign Up section */}
          <div className="flex h-full min-h-0 items-center justify-center lg:justify-end">
            <div className="w-full max-w-[570px]">
              <div className="rounded-[24px] border border-[#1E334D] bg-[#0B1628]/95 px-5 py-5 shadow-[0_25px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:px-7 sm:py-6">
                {/* Heading */}
                <div className="mb-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#22D3EE]/20 to-[#8B5CF6]/20">
                    <User
                      size={20}
                      className="text-[#22D3EE]"
                    />
                  </div>

                  <h1 className="text-xl font-bold text-white sm:text-2xl">
                    Create your account
                  </h1>

                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    Join EV Charge Hub and start your smart
                    charging journey.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                    {error}
                  </div>
                )}

                {/* Success */}
                {success && (
                  <div className="mb-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
                    {success}
                  </div>
                )}

                <form
                  onSubmit={handleSubmit}
                  className="space-y-3"
                >
                  {/* Name + Email */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Name */}
                    <div>
                      <label className="mb-1.5 block text-[11px] font-medium text-slate-400">
                        Full Name
                      </label>

                      <div className="relative">
                        <User
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                        />

                        <input
                          type="text"
                          value={name}
                          onChange={(e) =>
                            setName(e.target.value)
                          }
                          placeholder="Enter your name"
                          className="h-10 w-full rounded-xl border border-[#1E334D] bg-[#101D31] pl-10 pr-3 text-xs text-white outline-none transition placeholder:text-slate-600 focus:border-[#22D3EE]/60 focus:ring-2 focus:ring-[#22D3EE]/10"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="mb-1.5 block text-[11px] font-medium text-slate-400">
                        Email Address
                      </label>

                      <div className="relative">
                        <Mail
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                        />

                        <input
                          type="email"
                          value={email}
                          onChange={(e) =>
                            setEmail(e.target.value)
                          }
                          placeholder="you@example.com"
                          className="h-10 w-full rounded-xl border border-[#1E334D] bg-[#101D31] pl-10 pr-3 text-xs text-white outline-none transition placeholder:text-slate-600 focus:border-[#22D3EE]/60 focus:ring-2 focus:ring-[#22D3EE]/10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium text-slate-400">
                      Phone Number
                    </label>

                    <div className="relative">
                      <Phone
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                      />

                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) =>
                          setPhone(
                            e.target.value.replace(
                              /\D/g,
                              ""
                            )
                          )
                        }
                        placeholder="10 digit phone number"
                        maxLength={10}
                        className="h-10 w-full rounded-xl border border-[#1E334D] bg-[#101D31] pl-10 pr-3 text-xs text-white outline-none transition placeholder:text-slate-600 focus:border-[#22D3EE]/60 focus:ring-2 focus:ring-[#22D3EE]/10"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-medium text-slate-400">
                        Password
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
                          className="h-10 w-full rounded-xl border border-[#1E334D] bg-[#101D31] px-3 pr-10 text-xs text-white outline-none transition placeholder:text-slate-600 focus:border-[#22D3EE]/60 focus:ring-2 focus:ring-[#22D3EE]/10"
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
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm password */}
                    <div>
                      <label className="mb-1.5 block text-[11px] font-medium text-slate-400">
                        Confirm Password
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
                          placeholder="Repeat password"
                          className="h-10 w-full rounded-xl border border-[#1E334D] bg-[#101D31] px-3 pr-10 text-xs text-white outline-none transition placeholder:text-slate-600 focus:border-[#22D3EE]/60 focus:ring-2 focus:ring-[#22D3EE]/10"
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
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] text-xs font-bold text-white shadow-[0_10px_25px_rgba(34,211,238,0.15)] transition hover:scale-[1.01] hover:shadow-[0_10px_30px_rgba(34,211,238,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading
                      ? "Creating Account..."
                      : "Create Account"}

                    {!isLoading && (
                      <ArrowRight
                        size={16}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    )}
                  </button>
                </form>

                <p className="mt-4 text-center text-[11px] text-slate-500">
                  Already have an account?{" "}
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
        </div>
      </div>
    </main>
  );
}

export default SignUp;