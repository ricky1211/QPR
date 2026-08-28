"use client";

import React, { useState, useEffect } from "react";
import { Search, User as UserIcon, CheckCircle, ShieldAlert, Edit, Plus, X, Loader2, Check } from "lucide-react";
import { userService } from "@/services/userService";

interface User {
  id: string;
  npk: number;
  name: string;
  role: string | null;
  roles?: string[];
  status: string;
  email: string | null;
}

const AVAILABLE_ROLES = [
  "QA/QC Operator (Foreman)",
  "QA Section Head",
  "QA Dept Head",
  "QA Division Head",
  "Purchasing Departemen",
  "Dept Accounting",
  "Finance Accounting",
  "System Administrator"
];

export default function UsersDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formNpk, setFormNpk] = useState("");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRoles, setFormRoles] = useState<string[]>([]);
  const [formStatus, setFormStatus] = useState("Aktif");
  const [submitting, setSubmitting] = useState(false);

  // Read role context from cookie
  useEffect(() => {
    if (typeof window !== "undefined") {
      const match = document.cookie.match(/(?:^|; )mtm_user=([^;]*)/);
      setIsAdmin(match?.[1] === "admin");
    }
  }, []);

  const fetchUsers = () => {
    setIsLoading(true);
    userService.getAll()
      .then((data) => {
        if (Array.isArray(data)) {
          setUsers(data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch users:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const normalizeSingleRole = (rawRole: string): string => {
    const trimmed = rawRole.trim();
    const lower = trimmed.toLowerCase();
    if (lower === "purchasing" || lower === "purchasing department" || lower === "purchasing departemen") return "Purchasing Departemen";
    if (lower === "accounting" || lower === "accounting bu / admin" || lower === "dept accounting") return "Dept Accounting";
    if (lower === "finance" || lower === "finance & accounting" || lower === "finance accounting") return "Finance Accounting";
    if (lower === "foreman" || lower === "qa/qc operator (foreman)") return "QA/QC Operator (Foreman)";
    if (lower === "qa section head" || lower === "section head") return "QA Section Head";
    if (lower === "qa dept head" || lower === "dept head") return "QA Dept Head";
    if (lower === "sect_dept_head") return "QA Section Head, QA Dept Head";
    if (lower === "div_head" || lower === "qa division head" || lower === "division head") return "QA Division Head";
    if (lower === "admin" || lower === "system administrator") return "System Administrator";
    return trimmed;
  };

  const getUserRoleBadges = (u: User): string[] => {
    if (Array.isArray(u.roles) && u.roles.length > 0) {
      return u.roles.map(normalizeSingleRole).flatMap(r => r.split(',').map(s => s.trim()));
    }
    if (u.role) {
      return u.role.split(',').map(normalizeSingleRole).flatMap(r => r.split(',').map(s => s.trim())).filter(Boolean);
    }
    return [];
  };

  const handleAddClick = () => {
    setEditingUser(null);
    setFormNpk("");
    setFormName("");
    setFormEmail("");
    setFormRoles([]);
    setFormStatus("Aktif");
    setIsModalOpen(true);
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setFormNpk(String(user.npk));
    setFormName(user.name);
    setFormEmail(user.email || "");
    const initialRoles = getUserRoleBadges(user);
    setFormRoles(initialRoles);
    setFormStatus(user.status || "Aktif");
    setIsModalOpen(true);
  };

  const toggleRoleSelection = (roleName: string) => {
    setFormRoles((prev) =>
      prev.includes(roleName)
        ? prev.filter((r) => r !== roleName)
        : [...prev, roleName]
    );
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNpk || !formName) {
      alert("NPK dan Nama Karyawan wajib diisi!");
      return;
    }
    if (formRoles.length === 0) {
      alert("Pilih minimal satu Peran / Jabatan Otorisasi!");
      return;
    }
    setSubmitting(true);
    const payload = {
      npk: Number(formNpk),
      name: formName,
      email: formEmail || undefined,
      role: formRoles.join(', '),
      roles: formRoles,
      status: formStatus,
    };

    const apiCall = editingUser
      ? userService.update(editingUser.id, payload)
      : userService.create(payload);

    apiCall
      .then(() => {
        setIsModalOpen(false);
        fetchUsers();
      })
      .catch((err: any) => {
        console.error("Failed to save user:", err);
        alert(`Gagal menyimpan user: ${err.message || err}`);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    const nameMatch = u.name.toLowerCase().includes(query);
    const npkMatch = String(u.npk).includes(query);
    const roleBadges = getUserRoleBadges(u).join(" ").toLowerCase();
    const roleMatch = roleBadges.includes(query) || (u.role || "").toLowerCase().includes(query);
    return nameMatch || npkMatch || roleMatch;
  });

  return (
    <div className="space-y-6">
      {/* Search Panel & Action Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white border border-slate-350 rounded-lg shadow-sm gap-4">
        <div className="flex items-center gap-3 w-full sm:max-w-md">
          <div className="relative flex-1 text-left">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari NPK, nama, atau peran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/30 text-slate-800 font-semibold"
            />
          </div>
          {isAdmin && (
            <button
              onClick={handleAddClick}
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md shrink-0"
            >
              <Plus size={14} />
              Tambah Karyawan
            </button>
          )}
        </div>
        <div className="text-xs text-slate-450 font-bold uppercase tracking-wider">
          Total Karyawan: <span className="font-extrabold text-slate-800">{filteredUsers.length}</span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
              <Loader2 size={24} className="animate-spin text-blue-600" />
              <span className="text-xs font-bold">Memuat data karyawan...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[10px] tracking-wider uppercase whitespace-nowrap">
                <tr>
                  <th className="px-3 py-2 w-16 text-center">No</th>
                  <th className="px-3 py-2 w-28">NPK</th>
                  <th className="px-3 py-2">Nama Karyawan</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Peran / Jabatan (Otorisasi)</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  {isAdmin && <th className="px-3 py-2 text-right">Opsi</th>}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u, idx) => {
                  const roleBadges = getUserRoleBadges(u);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors font-medium">
                      <td className="px-3 py-1.5 text-center text-slate-400 font-mono font-medium">{idx + 1}</td>
                      <td className="px-3 py-1.5 font-mono font-bold text-slate-900">{u.npk}</td>
                      <td className="px-3 py-1.5 text-slate-800 font-semibold">
                        <div className="flex items-center gap-2">
                          <UserIcon size={13} className="text-slate-400 shrink-0" />
                          <span>{u.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 text-slate-500 font-mono">{u.email || "-"}</td>
                      <td className="px-3 py-1.5">
                        <div className="flex flex-wrap gap-1 items-center">
                          {roleBadges.length > 0 ? (
                            roleBadges.map((badge, bIdx) => (
                              <span
                                key={bIdx}
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  badge.includes("QA")
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : badge.includes("Purchasing")
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : badge.includes("Accounting")
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : badge.includes("Finance")
                                    ? "bg-teal-50 text-teal-800 border-teal-200"
                                    : "bg-purple-50 text-purple-700 border-purple-200"
                                }`}
                              >
                                {badge}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${
                          u.status === "Aktif"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}>
                          <CheckCircle size={9} />
                          {u.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-3 py-1.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleEditClick(u)}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all inline-flex items-center gap-0.5 cursor-pointer font-bold text-xs"
                            title="Edit Karyawan"
                          >
                            <Edit size={12} />
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="px-3 py-8 text-center text-slate-400 font-bold italic bg-slate-50">
                      Tidak ditemukan data user yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit Modal (Many-to-Many Multi-Role Support) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">Master Data User &amp; Otorisasi</span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">
                  {editingUser ? "Edit Detail Karyawan" : "Tambah Karyawan Baru"}
                </h4>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">NPK <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  required
                  disabled={editingUser !== null}
                  value={formNpk}
                  onChange={(e) => setFormNpk(e.target.value)}
                  placeholder="Contoh: 12345"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 font-semibold bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama Karyawan <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Septian Nugraha"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 font-semibold bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email (Opsional)</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="Contoh: employee@menaraterusmakmur.com"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 font-semibold bg-white"
                />
              </div>

              {/* Multi-Role Many-to-Many Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Peran / Jabatan Otorisasi <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-blue-600 font-bold">
                    {formRoles.length} dipilih
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-400">
                  Pilih satu atau beberapa peran jika karyawan memiliki lebih dari satu hak otorisasi.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {AVAILABLE_ROLES.map((roleName) => {
                    const isChecked = formRoles.includes(roleName);
                    return (
                      <button
                        type="button"
                        key={roleName}
                        onClick={() => toggleRoleSelection(roleName)}
                        className={`flex items-center gap-2.5 p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                          isChecked
                            ? "border-blue-500 bg-blue-50/70 text-blue-900 font-bold shadow-xs"
                            : "border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-medium"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            isChecked
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isChecked && <Check size={12} strokeWidth={3} />}
                        </div>
                        <span className="truncate">{roleName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 font-semibold bg-white cursor-pointer"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-xs font-bold cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  {submitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
