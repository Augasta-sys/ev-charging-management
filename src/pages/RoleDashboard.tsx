import { useAuth } from "../context/AuthContext";

function RoleDashboard() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f9fc] p-6">
      <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-xl">
        <div className="mb-4 text-6xl">⚡</div>

        <h1 className="text-3xl font-bold text-[#172033]">
          Welcome to EV Charge Hub
        </h1>

        <p className="mt-4 text-gray-500">
          Logged in as
        </p>

        <p className="mt-1 text-xl font-semibold text-[#0066FF]">
          {user?.name}
        </p>

        <div className="mt-5 inline-block rounded-full bg-blue-50 px-5 py-2 text-sm font-semibold capitalize text-blue-600">
          {user?.role}
        </div>

        <p className="mt-6 text-sm text-gray-400">
          Your {user?.role} dashboard will be built next.
        </p>
      </div>
    </div>
  );
}

export default RoleDashboard;