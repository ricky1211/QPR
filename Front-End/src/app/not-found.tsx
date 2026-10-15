import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100">
        <FileQuestion className="w-8 h-8" />
      </div>
      <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full uppercase tracking-wider mb-3">
        404 - Halaman Tidak Ditemukan
      </span>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
        Halaman yang Anda Cari Tidak Tersedia
      </h1>
      <p className="text-slate-500 max-w-md mb-8 text-sm sm:text-base">
        Halaman mungkin telah dipindahkan, dihapus, atau alamat URL yang Anda masukkan salah.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Dashboard Utama
      </Link>
    </div>
  );
}
