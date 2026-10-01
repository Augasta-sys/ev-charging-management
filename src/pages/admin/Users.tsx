import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type SyntheticEvent,
  type MouseEvent,
} from "react";
import {
  Activity,
  Check,
  ChevronDown,
  Edit3,
  Mail,
  MoreVertical,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users as UsersIcon,
  UserX,
  X,
} from "lucide-react";

import api from "../../services/api";
import type { User, UserRole, UserStatus } from "../../types";

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  assignedStationId: string;
}

const nameRegex = /^[A-Za-z ]+$/;
const phoneRegex = /^[0-9]{10}$/;
const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

const sanitizeName = (value: string) =>
  value.replace(/[^A-Za-z ]/g, "");

const sanitizePhone = (value: string) =>
  value.replace(/\D/g, "").slice(0, 10);

const getNextUserId = (users: User[]) => {
  const highestId = users.reduce((highest, user) => {
    const match = user.id.match(/^USR(\d+)$/);

    if (!match) {
      return highest;
    }

    return Math.max(highest, Number(match[1]));
  }, 0);

  return `USR${String(highestId + 1).padStart(3, "0")}`;
};

const getRoleLabel = (role: UserRole) => {
  switch (role) {
    case "admin":
      return "Admin";

    case "manager":
      return "Station Manager";

    case "staff":
      return "Staff";

    case "customer":
      return "Customer";

    default:
      return role;
  }
};

const getRoleClasses = (role: UserRole) => {
  switch (role) {
    case "admin":
      return "border-violet-400/20 bg-violet-400/10 text-violet-300";

    case "manager":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";

    case "staff":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";

    case "customer":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    default:
      return "border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)]";
  }
};

const getStatusClasses = (status: UserStatus) => {
  if (status === "Active") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  return "border-red-400/20 bg-red-400/10 text-red-300";
};

function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [roleFilter, setRoleFilter] = useState<
    "all" | UserRole
  >("all");

  const [statusFilter, setStatusFilter] = useState<
    "all" | UserStatus
  >("all");

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] =
    useState<User | null>(null);

  const [openMenu, setOpenMenu] =
    useState<string | null>(null);

  const [formData, setFormData] =
    useState<UserFormData>({
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "customer",
      status: "Active",
      assignedStationId: "",
    });

  useEffect(() => {
    void fetchUsers();
  }, []);

  /* Lock background scrolling when menu/modal is open */
  useEffect(() => {
    if (!showModal && !openMenu) {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      return;
    }

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow =
      document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow =
        originalHtmlOverflow;
    };
  }, [showModal, openMenu]);

  /* Close menu when clicking outside */
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenu(null);
    };

    if (openMenu) {
      document.addEventListener(
        "click",
        handleClickOutside,
      );
    }

    return () => {
      document.removeEventListener(
        "click",
        handleClickOutside,
      );
    };
  }, [openMenu]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const response =
        await api.get<User[]>("/users");

      setUsers(response.data);
    } catch (error) {
      console.error(
        "Failed to fetch users:",
        error,
      );

      alert("Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const query =
      searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.name
          .toLowerCase()
          .includes(query) ||
        user.email
          .toLowerCase()
          .includes(query) ||
        user.id
          .toLowerCase()
          .includes(query);

      const matchesRole =
        roleFilter === "all" ||
        user.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        user.status === statusFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [
    users,
    searchTerm,
    roleFilter,
    statusFilter,
  ]);

  const totalUsers = users.length;

  const activeUsers = users.filter(
    (user) => user.status === "Active",
  ).length;

  const inactiveUsers = users.filter(
    (user) => user.status === "Inactive",
  ).length;

  const adminCount = users.filter(
    (user) => user.role === "admin",
  ).length;

  const customerCount = users.filter(
    (user) => user.role === "customer",
  ).length;

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "customer",
      status: "Active",
      assignedStationId: "",
    });
  };

  const openAddModal = () => {
    setEditingUser(null);
    resetForm();
    setOpenMenu(null);
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);

    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      role: user.role,
      status: user.status,
      assignedStationId:
        user.assignedStationId || "",
    });

    setOpenMenu(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    resetForm();
  };

  const handleChange = (
    field: keyof UserFormData,
    value: string,
  ) => {
    let updatedValue = value;

    if (field === "name") {
      updatedValue = sanitizeName(value);
    }

    if (field === "phone") {
      updatedValue = sanitizePhone(value);
    }

    if (field === "email") {
      updatedValue = value
        .toLowerCase()
        .replace(/\s/g, "");
    }

    setFormData((previous) => ({
      ...previous,
      [field]: updatedValue,
    }));
  };

  const handleSubmit = async (
    event: SyntheticEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const name = formData.name.trim();
    const email =
      formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();
    const password =
      formData.password.trim();

    if (!name) {
      alert("Please enter the user's name.");
      return;
    }

    if (!nameRegex.test(name)) {
      alert(
        "Name can contain only letters and spaces.",
      );
      return;
    }

    if (!email) {
      alert("Please enter the user's email.");
      return;
    }

    if (!emailRegex.test(email)) {
      alert(
        "Please enter a valid lowercase email address.",
      );
      return;
    }

    if (!phone) {
      alert("Please enter a phone number.");
      return;
    }

    if (!phoneRegex.test(phone)) {
      alert(
        "Phone number must contain exactly 10 digits.",
      );
      return;
    }

    if (!editingUser && !password) {
      alert("Please enter a password.");
      return;
    }

    if (!editingUser && password.length < 8) {
      alert(
        "Password must contain at least 8 characters.",
      );
      return;
    }

    try {
      setSaving(true);

      if (editingUser) {
        const updateData: Partial<UserFormData> = {
          name,
          email,
          phone,
          role: formData.role,
          status: formData.status,
          assignedStationId:
            formData.assignedStationId.trim(),
        };

        if (password) {
          updateData.password = password;
        }

        const response =
          await api.patch<User>(
            `/users/${editingUser.id}`,
            updateData,
          );

        setUsers((previous) =>
          previous.map((user) =>
            user.id === editingUser.id
              ? response.data
              : user,
          ),
        );
      } else {
        const emailExists = users.some(
          (user) =>
            user.email.toLowerCase() ===
            email,
        );

        if (emailExists) {
          alert(
            "A user with this email already exists.",
          );
          return;
        }

        const newId =
          getNextUserId(users);

        const response =
          await api.post<User>("/users", {
            id: newId,
            name,
            email,
            phone,
            password,
            role: formData.role,
            status: formData.status,
            assignedStationId:
              formData.assignedStationId.trim(),
            createdDate:
              new Date().toISOString(),
          });

        setUsers((previous) => [
          ...previous,
          response.data,
        ]);
      }

      closeModal();
    } catch (error) {
      console.error(
        "Failed to save user:",
        error,
      );

      alert("Unable to save the user.");
    } finally {
      setSaving(false);
    }
  };

  const toggleUserStatus = async (
    user: User,
  ) => {
    const newStatus: UserStatus =
      user.status === "Active"
        ? "Inactive"
        : "Active";

    try {
      const response =
        await api.patch<User>(
          `/users/${user.id}`,
          {
            status: newStatus,
          },
        );

      setUsers((previous) =>
        previous.map((item) =>
          item.id === user.id
            ? response.data
            : item,
        ),
      );

      setOpenMenu(null);
    } catch (error) {
      console.error(
        "Failed to update user status:",
        error,
      );

      alert(
        "Unable to update user status.",
      );
    }
  };

  const deleteUser = async (user: User) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete ${user.name}?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/users/${user.id}`,
      );

      setUsers((previous) =>
        previous.filter(
          (item) =>
            item.id !== user.id,
        ),
      );

      setOpenMenu(null);
    } catch (error) {
      console.error(
        "Failed to delete user:",
        error,
      );

      alert("Unable to delete the user.");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="w-full min-w-0 max-w-full space-y-5 overflow-x-hidden sm:space-y-6">
      {/* HEADER */}
      <section
        className="
          relative w-full max-w-full overflow-hidden rounded-2xl
          border border-[var(--border-primary)]
          bg-gradient-to-br
          from-[var(--card-bg)]
          via-[var(--bg-secondary)]
          to-[var(--bg-tertiary)]
          p-4 shadow-xl shadow-black/20
          sm:p-6 lg:p-7
        "
      >
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative flex min-w-0 flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 sm:h-11 sm:w-11">
                <UsersIcon className="h-5 w-5 text-cyan-400" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400 sm:text-xs">
                  Administration
                </p>

                <h1 className="mt-1 truncate text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                  User Management
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-xs leading-5 text-[var(--text-primary)] sm:text-sm sm:leading-6">
              Manage system users, roles, account
              status and access permissions from
              one place.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 text-sm font-bold text-[#06111D] shadow-lg shadow-cyan-400/10 transition hover:bg-cyan-300 active:scale-[0.98] sm:h-11 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>
        </div>
      </section>

      {/* SUMMARY */}
      <section className="grid w-full min-w-0 grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <SummaryCard
          icon={UsersIcon}
          label="Total Users"
          value={totalUsers}
          description="All registered users"
          iconClass="text-cyan-400"
          iconBg="bg-cyan-400/10"
        />

        <SummaryCard
          icon={UserCheck}
          label="Active Users"
          value={activeUsers}
          description="Currently active"
          iconClass="text-emerald-400"
          iconBg="bg-emerald-400/10"
        />

        <SummaryCard
          icon={UserX}
          label="Inactive Users"
          value={inactiveUsers}
          description="Currently inactive"
          iconClass="text-red-400"
          iconBg="bg-red-400/10"
        />

        <SummaryCard
          icon={ShieldCheck}
          label="Administrators"
          value={adminCount}
          description={`${customerCount} customers`}
          iconClass="text-violet-400"
          iconBg="bg-violet-400/10"
        />
      </section>

      {/* FILTERS */}
      <section className="w-full min-w-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-3 shadow-xl shadow-black/10 sm:p-5">
        <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-primary)]" />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value,
                )
              }
              placeholder="Search by name, email or user ID..."
              className="
                h-11 w-full min-w-0 rounded-xl
                border border-[var(--border-primary)]
                bg-[var(--bg-secondary)]
                pl-11 pr-4 text-sm
                text-[var(--text-primary)]
                outline-none
                placeholder:text-[var(--text-primary)]
                transition
                focus:border-cyan-400/40
              "
            />
          </div>

          <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3 xl:flex">
            <FilterSelect
              value={roleFilter}
              onChange={(value) =>
                setRoleFilter(
                  value as
                    | "all"
                    | UserRole,
                )
              }
              options={[
                {
                  value: "all",
                  label: "All Roles",
                },
                {
                  value: "admin",
                  label: "Admin",
                },
                {
                  value: "manager",
                  label: "Manager",
                },
                {
                  value: "staff",
                  label: "Staff",
                },
                {
                  value: "customer",
                  label: "Customer",
                },
              ]}
            />

            <FilterSelect
              value={statusFilter}
              onChange={(value) =>
                setStatusFilter(
                  value as
                    | "all"
                    | UserStatus,
                )
              }
              options={[
                {
                  value: "all",
                  label: "All Status",
                },
                {
                  value: "Active",
                  label: "Active",
                },
                {
                  value: "Inactive",
                  label: "Inactive",
                },
              ]}
            />

            {(searchTerm ||
              roleFilter !== "all" ||
              statusFilter !== "all") && (
              <button
                type="button"
                onClick={clearFilters}
                className="
                  col-span-2 inline-flex h-11
                  items-center justify-center gap-2
                  rounded-xl
                  border border-[var(--border-primary)]
                  bg-[var(--bg-tertiary)]
                  px-4 text-sm font-medium
                  text-[var(--text-primary)]
                  transition
                  hover:border-cyan-400/20
                  hover:bg-cyan-400/5
                  hover:text-cyan-400
                  xl:col-span-1
                "
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* USER LIST */}
      <section className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-xl shadow-black/10">
        <div className="flex min-w-0 flex-col gap-2 border-b border-[var(--border-primary)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              All Users
            </h2>

            <p className="mt-1 text-xs text-[var(--text-primary)]">
              Showing{" "}
              {filteredUsers.length} of{" "}
              {users.length} users
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-2 text-xs text-[var(--text-primary)]">
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
            Live user data
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            hasFilters={
              Boolean(searchTerm) ||
              roleFilter !== "all" ||
              statusFilter !== "all"
            }
            onClear={clearFilters}
            onAdd={openAddModal}
          />
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden w-full min-w-0 overflow-hidden md:block">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-left">
                    <th className="w-[23%] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] lg:px-5">
                      User
                    </th>

                    <th className="w-[25%] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] lg:px-5">
                      Contact
                    </th>

                    <th className="w-[18%] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] lg:px-5">
                      Role
                    </th>

                    <th className="w-[13%] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] lg:px-5">
                      Station
                    </th>

                    <th className="w-[13%] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] lg:px-5">
                      Status
                    </th>

                    <th className="w-[8%] px-3 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] lg:px-5">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--border-primary)]">
                  {filteredUsers.map((user) => (
                    <DesktopUserRow
                      key={user.id}
                      user={user}
                      openMenu={openMenu}
                      setOpenMenu={setOpenMenu}
                      openEditModal={
                        openEditModal
                      }
                      toggleUserStatus={
                        toggleUserStatus
                      }
                      deleteUser={deleteUser}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="block divide-y divide-[var(--border-primary)] md:hidden">
              {filteredUsers.map((user) => (
                <MobileUserCard
                  key={user.id}
                  user={user}
                  openMenu={openMenu}
                  setOpenMenu={setOpenMenu}
                  openEditModal={
                    openEditModal
                  }
                  toggleUserStatus={
                    toggleUserStatus
                  }
                  deleteUser={deleteUser}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-black/70 p-3 backdrop-blur-sm sm:p-4"
          onClick={closeModal}
        >
          <div
            className="
              scrollbar-hidden
              max-h-[calc(100dvh-24px)]
              w-full max-w-2xl
              overflow-y-auto overflow-x-hidden
              rounded-2xl
              border border-[var(--border-primary)]
              bg-[var(--card-bg)]
              shadow-2xl shadow-black/50
              sm:max-h-[calc(100dvh-32px)]
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* MODAL HEADER */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border-primary)] bg-[var(--card-bg)] px-4 py-4 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10">
                  {editingUser ? (
                    <Edit3 className="h-5 w-5 text-cyan-400" />
                  ) : (
                    <UserPlus className="h-5 w-5 text-cyan-400" />
                  )}
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-[var(--text-primary)] sm:text-lg">
                    {editingUser
                      ? "Edit User"
                      : "Add New User"}
                  </h2>

                  <p className="truncate text-xs text-[var(--text-primary)]">
                    {editingUser
                      ? "Update user information and access"
                      : "Create a new system user"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="
                  flex h-9 w-9 shrink-0
                  items-center justify-center
                  rounded-lg
                  text-[var(--text-primary)]
                  transition
                  hover:bg-[var(--bg-tertiary)]
                  hover:text-cyan-400
                "
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-5">
                {/* NAME */}
                <FormField
                  label="Full Name"
                  required
                >
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(event) =>
                      handleChange(
                        "name",
                        event.target.value,
                      )
                    }
                    placeholder="Enter full name"
                    autoComplete="name"
                    className="
                      h-11 w-full rounded-xl
                      border border-[var(--border-primary)]
                      bg-[var(--input-bg)]
                      px-4 text-sm
                      text-[var(--input-text)]
                      outline-none
                      placeholder:text-[var(--text-primary)]
                      focus:border-cyan-400/40
                    "
                  />
                </FormField>

                {/* EMAIL */}
                <FormField
                  label="Email Address"
                  required
                >
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) =>
                      handleChange(
                        "email",
                        event.target.value,
                      )
                    }
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="
                      h-11 w-full rounded-xl
                      border border-[var(--border-primary)]
                      bg-[var(--input-bg)]
                      px-4 text-sm
                      text-[var(--input-text)]
                      outline-none
                      placeholder:text-[var(--text-primary)]
                      focus:border-cyan-400/40
                    "
                  />
                </FormField>

                {/* PHONE */}
                <FormField
                  label="Phone Number"
                  required
                >
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(event) =>
                      handleChange(
                        "phone",
                        event.target.value,
                      )
                    }
                    placeholder="10-digit phone number"
                    autoComplete="tel"
                    className="
                      h-11 w-full rounded-xl
                      border border-[var(--border-primary)]
                      bg-[var(--input-bg)]
                      px-4 text-sm
                      text-[var(--input-text)]
                      outline-none
                      placeholder:text-[var(--text-primary)]
                      focus:border-cyan-400/40
                    "
                  />
                </FormField>

                {/* PASSWORD */}
                <FormField
                  label={
                    editingUser
                      ? "New Password"
                      : "Password"
                  }
                  required={!editingUser}
                >
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(event) =>
                      handleChange(
                        "password",
                        event.target.value,
                      )
                    }
                    placeholder={
                      editingUser
                        ? "Leave blank to keep current"
                        : "Minimum 8 characters"
                    }
                    autoComplete="new-password"
                    className="
                      h-11 w-full rounded-xl
                      border border-[var(--border-primary)]
                      bg-[var(--input-bg)]
                      px-4 text-sm
                      text-[var(--input-text)]
                      outline-none
                      placeholder:text-[var(--text-primary)]
                      focus:border-cyan-400/40
                    "
                  />
                </FormField>

                {/* ROLE */}
                <FormField label="Role" required>
                  <SelectField
                    value={formData.role}
                    onChange={(value) =>
                      handleChange(
                        "role",
                        value,
                      )
                    }
                    options={[
                      {
                        value: "customer",
                        label: "Customer",
                      },
                      {
                        value: "staff",
                        label: "Staff",
                      },
                      {
                        value: "manager",
                        label: "Station Manager",
                      },
                      {
                        value: "admin",
                        label: "Admin",
                      },
                    ]}
                  />
                </FormField>

                {/* STATUS */}
                <FormField
                  label="Status"
                  required
                >
                  <SelectField
                    value={formData.status}
                    onChange={(value) =>
                      handleChange(
                        "status",
                        value,
                      )
                    }
                    options={[
                      {
                        value: "Active",
                        label: "Active",
                      },
                      {
                        value: "Inactive",
                        label: "Inactive",
                      },
                    ]}
                  />
                </FormField>

                {/* STATION */}
                <FormField label="Assigned Station">
                  <input
                    type="text"
                    value={
                      formData.assignedStationId
                    }
                    onChange={(event) =>
                      handleChange(
                        "assignedStationId",
                        event.target.value,
                      )
                    }
                    placeholder="Example: ST001"
                    className="
                      h-11 w-full rounded-xl
                      border border-[var(--border-primary)]
                      bg-[var(--input-bg)]
                      px-4 text-sm
                      text-[var(--input-text)]
                      outline-none
                      placeholder:text-[var(--text-primary)]
                      focus:border-cyan-400/40
                    "
                  />
                </FormField>

                {/* INFO */}
                <div className="flex items-start gap-3 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.04] p-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />

                  <p className="text-xs leading-5 text-[var(--text-primary)]">
                    User permissions are determined
                    by the selected role. Admin users
                    have full system access.
                  </p>
                </div>
              </div>

              {/* FOOTER */}
              <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-[var(--border-primary)] bg-[var(--card-bg)] px-4 py-4 sm:flex-row sm:justify-end sm:px-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="
                    h-11 rounded-xl
                    border border-[var(--border-primary)]
                    bg-[var(--bg-tertiary)]
                    px-5 text-sm font-semibold
                    text-[var(--text-primary)]
                    transition
                    hover:bg-[var(--bg-secondary)]
                    hover:text-cyan-400
                    disabled:opacity-50
                  "
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 text-sm font-bold text-[#06111D] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#06111D]/30 border-t-[#06111D]" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      {editingUser
                        ? "Save Changes"
                        : "Create User"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* DESKTOP USER ROW                                                           */
/* -------------------------------------------------------------------------- */

interface UserActionProps {
  user: User;
  openMenu: string | null;
  setOpenMenu: (
    value: string | null,
  ) => void;
  openEditModal: (user: User) => void;
  toggleUserStatus: (user: User) => void;
  deleteUser: (user: User) => void;
}

function DesktopUserRow({
  user,
  openMenu,
  setOpenMenu,
  openEditModal,
  toggleUserStatus,
  deleteUser,
}: UserActionProps) {
  return (
    <tr className="transition hover:bg-[var(--bg-secondary)]">
      {/* USER */}
      <td className="max-w-0 px-4 py-4 lg:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/10 bg-gradient-to-br from-cyan-400/10 to-violet-500/10 text-sm font-bold text-cyan-400">
            {getInitials(user.name)}
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-semibold text-[var(--text-primary)]"
              title={user.name}
            >
              {user.name}
            </p>

            <p className="mt-1 truncate text-xs text-[var(--text-primary)]">
              {user.id}
            </p>
          </div>
        </div>
      </td>

      {/* CONTACT */}
      <td className="max-w-0 px-4 py-4 lg:px-5">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--text-primary)]" />

            <span
              className="min-w-0 truncate text-sm text-[var(--text-primary)]"
              title={user.email}
            >
              {user.email}
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 shrink-0 text-[var(--text-primary)]" />

            <span className="truncate text-xs text-[var(--text-primary)]">
              {user.phone || "No phone"}
            </span>
          </div>
        </div>
      </td>

      {/* ROLE */}
      <td className="max-w-0 px-4 py-4 lg:px-5">
        <span
          className={`inline-flex max-w-full truncate whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${getRoleClasses(
            user.role,
          )}`}
          title={getRoleLabel(user.role)}
        >
          {getRoleLabel(user.role)}
        </span>
      </td>

      {/* STATION */}
      <td className="max-w-0 px-4 py-4 lg:px-5">
        <span
          className="block truncate text-sm text-[var(--text-primary)]"
          title={
            user.assignedStationId ||
            "All stations"
          }
        >
          {user.assignedStationId ||
            "All stations"}
        </span>
      </td>

      {/* STATUS */}
      <td className="px-4 py-4 lg:px-5">
        <span
          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
            user.status,
          )}`}
        >
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              user.status === "Active"
                ? "bg-emerald-400"
                : "bg-red-400"
            }`}
          />

          {user.status === "Active"
            ? "Active"
            : "Inactive"}
        </span>
      </td>

      {/* ACTIONS */}
      <td className="relative px-3 py-4 text-right lg:px-5">
        <ActionMenu
          user={user}
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          openEditModal={openEditModal}
          toggleUserStatus={
            toggleUserStatus
          }
          deleteUser={deleteUser}
        />
      </td>
    </tr>
  );
}

/* -------------------------------------------------------------------------- */
/* MOBILE USER CARD                                                           */
/* -------------------------------------------------------------------------- */

function MobileUserCard({
  user,
  openMenu,
  setOpenMenu,
  openEditModal,
  toggleUserStatus,
  deleteUser,
}: UserActionProps) {
  return (
    <div className="relative p-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/10 bg-gradient-to-br from-cyan-400/10 to-violet-500/10 text-sm font-bold text-cyan-400">
          {getInitials(user.name)}
        </div>

        <div className="min-w-0 flex-1 pr-8">
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
            {user.name}
          </p>

          <p className="mt-1 truncate text-xs text-[var(--text-primary)]">
            {user.id}
          </p>

          <div className="mt-3 flex min-w-0 items-center gap-2">
            <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--text-primary)]" />

            <span className="truncate text-xs text-[var(--text-primary)]">
              {user.email}
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 shrink-0 text-[var(--text-primary)]" />

            <span className="text-xs text-[var(--text-primary)]">
              {user.phone || "No phone"}
            </span>
          </div>
        </div>

        <div className="absolute right-4 top-4">
          <ActionMenu
            user={user}
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
            openEditModal={openEditModal}
            toggleUserStatus={
              toggleUserStatus
            }
            deleteUser={deleteUser}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold ${getRoleClasses(
            user.role,
          )}`}
        >
          {getRoleLabel(user.role)}
        </span>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-semibold ${getStatusClasses(
            user.status,
          )}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              user.status === "Active"
                ? "bg-emerald-400"
                : "bg-red-400"
            }`}
          />

          {user.status}
        </span>

        <span className="rounded-full border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-1 text-[10px] text-[var(--text-primary)]">
          {user.assignedStationId ||
            "All stations"}
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ACTION MENU                                                                */
/* -------------------------------------------------------------------------- */

function ActionMenu({
  user,
  openMenu,
  setOpenMenu,
  openEditModal,
  toggleUserStatus,
  deleteUser,
}: UserActionProps) {
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);

  const handleMenuToggle = (
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();

    if (openMenu === user.id) {
      setOpenMenu(null);
      return;
    }

    const buttonRect =
      event.currentTarget.getBoundingClientRect();

    /*
     * Position the menu above the button.
     * The menu is fixed to the viewport, so it will not
     * be clipped by the table or card container.
     */
    const menuHeight = 150;
    const gap = 8;

    let top =
      buttonRect.top -
      menuHeight -
      gap;

    /*
     * If there isn't enough room above,
     * place it below the button.
     */
    if (top < 8) {
      top =
        buttonRect.bottom + gap;
    }

    setMenuPosition({
      top,
      right:
        window.innerWidth -
        buttonRect.right,
    });

    setOpenMenu(user.id);
  };

  return (
    <>
      <button
        type="button"
        aria-label={`Actions for ${user.name}`}
        onClick={handleMenuToggle}
        className="
          inline-flex h-9 w-9
          items-center justify-center
          rounded-lg
          border border-[var(--border-primary)]
          bg-[var(--bg-tertiary)]
          text-[var(--text-primary)]
          transition
          hover:border-cyan-400/20
          hover:bg-cyan-400/10
          hover:text-cyan-400
        "
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {openMenu === user.id &&
        menuPosition && (
          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              position: "fixed",
              top: `${menuPosition.top}px`,
              right: `${menuPosition.right}px`,
            }}
            className="
              z-[9999] w-44 overflow-hidden
              rounded-xl
              border border-[var(--border-primary)]
              bg-[var(--card-bg)]
              p-1.5
              shadow-2xl shadow-black/60
            "
          >
            <button
              type="button"
              onClick={() =>
                openEditModal(user)
              }
              className="
                flex w-full items-center gap-3
                rounded-lg px-3 py-2.5
                text-left text-sm
                text-[var(--text-primary)]
                transition
                hover:bg-[var(--bg-tertiary)]
                hover:text-cyan-400
              "
            >
              <Edit3 className="h-4 w-4 text-cyan-400" />
              Edit User
            </button>

            <button
              type="button"
              onClick={() =>
                toggleUserStatus(user)
              }
              className="
                flex w-full items-center gap-3
                rounded-lg px-3 py-2.5
                text-left text-sm
                text-[var(--text-primary)]
                transition
                hover:bg-[var(--bg-tertiary)]
                hover:text-cyan-400
              "
            >
              {user.status === "Active" ? (
                <>
                  <UserX className="h-4 w-4 text-amber-400" />
                  Deactivate
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 text-emerald-400" />
                  Activate
                </>
              )}
            </button>

            <div className="my-1 border-t border-[var(--border-primary)]" />

            <button
              type="button"
              onClick={() =>
                deleteUser(user)
              }
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-400 transition hover:bg-red-400/10 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
              Delete User
            </button>
          </div>
        )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* SUMMARY CARD                                                               */
/* -------------------------------------------------------------------------- */

interface SummaryCardProps {
  icon: typeof UsersIcon;
  label: string;
  value: number;
  description: string;
  iconClass: string;
  iconBg: string;
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
  iconClass,
  iconBg,
}: SummaryCardProps) {
  return (
    <div
      className="
        min-w-0 rounded-2xl
        border border-[var(--border-primary)]
        bg-[var(--card-bg)]
        p-3 shadow-lg shadow-black/10
        transition
        hover:border-[var(--border-secondary)]
        sm:p-5
      "
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[9px] font-semibold uppercase tracking-wider text-[var(--text-primary)] sm:text-xs">
            {label}
          </p>

          <p className="mt-2 text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
            {value}
          </p>

          <p className="mt-1 truncate text-[9px] text-[var(--text-primary)] sm:text-xs">
            {description}
          </p>
        </div>

        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${iconBg}`}
        >
          <Icon
            className={`h-4 w-4 sm:h-5 sm:w-5 ${iconClass}`}
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FILTER SELECT                                                              */
/* -------------------------------------------------------------------------- */

interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
}

function FilterSelect({
  value,
  onChange,
  options,
}: FilterSelectProps) {
  return (
    <div className="relative min-w-0 sm:min-w-[150px]">
      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="
          h-11 w-full appearance-none
          rounded-xl
          border border-[var(--border-primary)]
          bg-[var(--input-bg)]
          px-3 pr-9
          text-xs text-[var(--input-text)]
          outline-none
          focus:border-cyan-400/40
          sm:px-4 sm:text-sm
        "
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-primary)]" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FORM FIELD                                                                 */
/* -------------------------------------------------------------------------- */

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: ReactNode;
}

function FormField({
  label,
  required = false,
  children,
}: FormFieldProps) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-[var(--text-primary)]">
        {label}

        {required && (
          <span className="ml-1 text-cyan-400">
            *
          </span>
        )}
      </span>

      {children}
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/* SELECT FIELD                                                               */
/* -------------------------------------------------------------------------- */

interface SelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
}

function SelectField({
  value,
  onChange,
  options,
}: SelectFieldProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="
          h-11 w-full appearance-none
          rounded-xl
          border border-[var(--border-primary)]
          bg-[var(--input-bg)]
          px-4 pr-10
          text-sm text-[var(--input-text)]
          outline-none
          focus:border-cyan-400/40
        "
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-primary)]" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* LOADING                                                                    */
/* -------------------------------------------------------------------------- */

function LoadingState() {
  return (
    <div className="flex min-h-[280px] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--border-primary)] border-t-cyan-400" />

        <p className="text-sm text-[var(--text-primary)]">
          Loading users...
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* EMPTY                                                                      */
/* -------------------------------------------------------------------------- */

interface EmptyStateProps {
  hasFilters: boolean;
  onClear: () => void;
  onAdd: () => void;
}

function EmptyState({
  hasFilters,
  onClear,
  onAdd,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-5 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
        <UsersIcon className="h-6 w-6 text-[var(--text-primary)]" />
      </div>

      <h3 className="mt-4 text-base font-semibold text-[var(--text-primary)]">
        {hasFilters
          ? "No users found"
          : "No users available"}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--text-primary)]">
        {hasFilters
          ? "Try changing your search or filter criteria."
          : "Create your first user to get started."}
      </p>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="
              h-10 rounded-xl
              border border-[var(--border-primary)]
              px-4 text-sm font-semibold
              text-[var(--text-primary)]
              hover:bg-[var(--bg-tertiary)]
              hover:text-cyan-400
            "
          >
            Clear Filters
          </button>
        )}

        {!hasFilters && (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 text-sm font-bold text-[#06111D] hover:bg-cyan-300"
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${
    parts[parts.length - 1][0]
  }`.toUpperCase();
}

export default Users;