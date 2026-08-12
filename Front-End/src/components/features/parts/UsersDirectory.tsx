"use client";

import React, { useState } from "react";
import { Search, User as UserIcon, CheckCircle, ShieldAlert } from "lucide-react";

interface User {
  id: string;
  npk: number;
  name: string;
  role: string;
  status: string;
}

export default function UsersDirectory() {
  const [searchQuery, setSearchQuery] = useState("");

  const users: User[] = [
    { id: "1", npk: 12345, name: "Bagas Nur P", role: "Accounting BU / Admin", status: "Aktif" },
    { id: "2", npk: 54321, name: "Anindita I", role: "Accounting Dept Head", status: "Aktif" },
    { id: "3", npk: 98765, name: "Evi Sulistyorini", role: "Admin Div / BOD", status: "Aktif" },
    { id: "4", npk: 11111, name: "Bagas", role: "Accounting BU", status: "Aktif" },
    { id: "5", npk: 22222, name: "Anindita", role: "Accounting Dept Head", status: "Aktif" },
  ];

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(u.npk).includes(searchQuery) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white border border-slate-350 rounded-lg shadow-sm gap-4">
        <div className="relative w-full sm:max-w-xs text-left">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari NPK, nama, atau peran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/30 text-slate-800 font-semibold"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Menampilkan total <span className="font-bold text-slate-800">{filteredUsers.length}</span> user terdaftar.
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-400 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-200 text-slate-900 font-extrabold border-b border-slate-600">
              <tr>
                <th className="px-4 py-3 w-16 text-center">No</th>
                <th className="px-4 py-3">NPK</th>
                <th className="px-4 py-3">Nama Karyawan</th>
                <th className="px-4 py-3">Peran / Jabatan</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-300">
              {filteredUsers.map((u, idx) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors font-semibold">
                  <td className="px-4 py-3 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                  <td className="px-4 py-3 font-mono font-bold text-blue-700">{u.npk}</td>
                  <td className="px-4 py-3 text-slate-800 font-extrabold flex items-center gap-2">
                    <UserIcon size={14} className="text-slate-400 shrink-0" />
                    {u.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-bold">{u.role}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-250">
                      <CheckCircle size={10} />
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400 font-bold italic bg-slate-50">
                    Tidak ditemukan data user yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
