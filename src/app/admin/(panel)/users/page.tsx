"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Plus, Pencil, Trash2, X, Check,
  ChevronLeft, ChevronRight, Shield, ShieldOff,
  ToggleLeft, ToggleRight, Crown, AlertCircle,
} from "lucide-react";
import * as adminService from "@/features/admin/api/adminService";
import type { AdminUser } from "@/features/admin/types/admin.types";
import toast from "react-hot-toast";

const PAGE_LIMIT = 20;

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${color}`}>
      {children}
    </span>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", email: "", password: "", dob: "" });
  const [mutating, setMutating] = useState(false);

  const fetchUsers = useCallback(async (page = 1, q = "") => {
    setLoading(true);
    try {
      const res = await adminService.getAllUsers({ page, limit: PAGE_LIMIT, search: q });
      const list: AdminUser[] = (res?.users ?? []).filter((u: AdminUser) => !u.isAdmin);
      setUsers(list);
      setTotalRecords(res?.pagination?.totalRecords ?? list.length);
      setTotalPages(res?.pagination?.totalPages ?? 1);
      setCurrentPage(page);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(1, search); }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(1, search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setMutating(true);
    try {
      await adminService.adminDeleteUser(deleteId);
      toast.success("User deleted");
      setDeleteId(null);
      fetchUsers(currentPage, search);
    } catch {
      toast.error("Delete failed");
    } finally {
      setMutating(false);
    }
  };

  const handleEdit = async () => {
    if (!editUser) return;
    setMutating(true);
    try {
      await adminService.adminEditUser(editUser._id, {
        username: editUser.username,
        email: editUser.email,
        dob: editUser.dob,
      });
      toast.success("User updated");
      setEditUser(null);
      fetchUsers(currentPage, search);
    } catch {
      toast.error("Update failed");
    } finally {
      setMutating(false);
    }
  };

  const handleAdd = async () => {
    setMutating(true);
    try {
      await adminService.adminRegister({ ...newUser, isAdmin: false });
      toast.success("User registered");
      setAddOpen(false);
      setNewUser({ username: "", email: "", password: "", dob: "" });
      fetchUsers(1, search);
    } catch {
      toast.error("Registration failed");
    } finally {
      setMutating(false);
    }
  };

  const handleToggleStatus = async (user: AdminUser) => {
    try {
      await adminService.changeSingleUserStatus(user._id, !user.status);
      toast.success(`User ${!user.status ? "activated" : "deactivated"}`);
      fetchUsers(currentPage, search);
    } catch {
      toast.error("Status update failed");
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--ap-text)] font-mono flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Users
          </h1>
          <p className="text-xs text-[var(--ap-text-3)] font-mono mt-0.5">{totalRecords} total users</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add User
        </motion.button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ap-text-3)]" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-xl text-[var(--ap-text)] placeholder-[var(--ap-text-3)] text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="space-y-px">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse bg-[var(--ap-surface-alt)]" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-[var(--ap-border)]">
                  {["#", "User", "Email", "Subscription", "Status", "Last Payment", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-mono font-semibold text-[var(--ap-text-2)] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ap-border)]">
                <AnimatePresence>
                  {users.map((user, idx) => (
                    <motion.tr
                      key={user._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-[var(--ap-hover)] transition-colors"
                    >
                      <td className="px-4 py-3 text-xs font-mono text-[var(--ap-text-3)]">
                        {(currentPage - 1) * PAGE_LIMIT + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {user.username?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--ap-text)] truncate">{user.username}</p>
                            <p className="text-[10px] text-[var(--ap-text-3)] font-mono">{user.dob ? new Date(user.dob).toLocaleDateString() : "-"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--ap-text-2)] font-mono">{user.email}</td>
                      <td className="px-4 py-3">
                        <Badge color="border-purple-500/30 text-purple-400 bg-purple-500/10">
                          {(user.subscriptionType ?? "basic").toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleToggleStatus(user)} className="transition-colors">
                          {user.status
                            ? <ToggleRight className="w-5 h-5 text-green-400" />
                            : <ToggleLeft className="w-5 h-5 text-[var(--ap-text-3)]" />
                          }
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--ap-text-3)] font-mono">
                        {user.lastPayment ? new Date(user.lastPayment).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setEditUser(user)}
                            className="p-1.5 rounded-lg bg-[var(--ap-surface-alt)] hover:bg-blue-500/20 text-[var(--ap-text-2)] hover:text-blue-400 transition-all"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(user._id)}
                            className="p-1.5 rounded-lg bg-[var(--ap-surface-alt)] hover:bg-red-500/20 text-[var(--ap-text-2)] hover:text-red-400 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {users.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-[var(--ap-text-3)] font-mono">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-[var(--ap-border)]">
            <span className="text-xs font-mono text-[var(--ap-text-3)]">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => fetchUsers(currentPage - 1, search)}
                className="p-1.5 rounded-lg bg-[var(--ap-surface-alt)] text-[var(--ap-text-2)] hover:bg-purple-600/20 hover:text-purple-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => fetchUsers(currentPage + 1, search)}
                className="p-1.5 rounded-lg bg-[var(--ap-surface-alt)] text-[var(--ap-text-2)] hover:bg-purple-600/20 hover:text-purple-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--ap-text)]">Delete User</h3>
                  <p className="text-xs text-[var(--ap-text-3)]">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-[var(--ap-text-2)] mb-6">Are you sure you want to permanently delete this user and all their data?</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2 rounded-xl bg-[var(--ap-surface-alt)] text-[var(--ap-text-2)] text-sm hover:bg-[var(--ap-hover)] transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={mutating}
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  {mutating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {editUser && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-[var(--ap-text)] flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-blue-400" />
                  Edit User
                </h3>
                <button onClick={() => setEditUser(null)} className="text-[var(--ap-text-3)] hover:text-[var(--ap-text)] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                {[
                  { label: "Username", key: "username", type: "text" },
                  { label: "Email", key: "email", type: "email" },
                  { label: "Date of Birth", key: "dob", type: "date" },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="block text-xs font-mono text-[var(--ap-text-2)] mb-1.5">{label}</label>
                    <input
                      type={type}
                      value={editUser[key as keyof AdminUser] as string ?? ""}
                      onChange={(e) => setEditUser({ ...editUser, [key]: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--ap-surface-alt)] border border-[var(--ap-border)] rounded-xl text-[var(--ap-text)] text-sm focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-5 pt-4 border-t border-[var(--ap-border)]">
                <button onClick={() => setEditUser(null)} className="flex-1 py-2 rounded-xl bg-[var(--ap-surface-alt)] text-[var(--ap-text-2)] text-sm hover:bg-[var(--ap-hover)] transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  disabled={mutating}
                  className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  {mutating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add User modal */}
      <AnimatePresence>
        {addOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-[var(--ap-text)] flex items-center gap-2">
                  <Plus className="w-4 h-4 text-purple-400" />
                  Create New User
                </h3>
                <button onClick={() => setAddOpen(false)} className="text-[var(--ap-text-3)] hover:text-[var(--ap-text)] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Username", key: "username", type: "text", placeholder: "johndoe" },
                  { label: "Email", key: "email", type: "email", placeholder: "john@example.com" },
                  { label: "Password", key: "password", type: "password", placeholder: "••••••••" },
                  { label: "Date of Birth", key: "dob", type: "date", placeholder: "" },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-mono text-[var(--ap-text-2)] mb-1.5">{label}</label>
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={newUser[key as keyof typeof newUser]}
                      onChange={(e) => setNewUser({ ...newUser, [key]: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--ap-surface-alt)] border border-[var(--ap-border)] rounded-xl text-[var(--ap-text)] text-sm focus:outline-none focus:border-purple-500 font-mono placeholder-[var(--ap-text-3)]"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setAddOpen(false)} className="flex-1 py-2 rounded-xl bg-[var(--ap-surface-alt)] text-[var(--ap-text-2)] text-sm hover:bg-[var(--ap-hover)] transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={mutating}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                >
                  {mutating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                  Register
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
