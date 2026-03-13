"use client";

import { createFamily, joinFamily } from "@/app/actions/family";
import { Loader2, Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FamilySetup() {
    const router = useRouter();
    const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
    const [familyName, setFamilyName] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!familyName.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const res = await createFamily(familyName.trim());
            if (res.success) {
                window.location.href = "/dashboard";
            }
        } catch (err: any) {
            setError(err.message || "Failed to create family.");
            setLoading(false);
        }
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const res = await joinFamily(joinCode.trim());
            if (res.success) {
                window.location.href = "/dashboard";
            }
        } catch (err: any) {
            setError(err.message || "Failed to join family.");
            setLoading(false);
        }
    };

    if (mode === "choose") {
        return (
            <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-lg border border-stone-100 flex flex-col mx-auto my-12 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-2 bg-linear-to-r from-amber-400 to-orange-500" />
                <h2 className="text-2xl font-serif font-bold text-stone-800 mb-2 text-center">
                    Chào mừng bạn!
                </h2>
                <p className="text-stone-500 text-center mb-8 text-sm">
                    Để bắt đầu, bạn cần tạo một Gia Phả mới hoặc tham gia vào một Gia Phả đã có sẵn rành riêng cho gia đình bạn.
                </p>

                <div className="flex flex-col gap-4">
                    <button
                        onClick={() => setMode("create")}
                        className="flex items-center gap-4 p-4 rounded-xl border-2 border-amber-100 hover:border-amber-400 bg-amber-50/50 hover:bg-amber-50 transition-all text-left group"
                    >
                        <div className="size-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 group-hover:scale-110 transition-transform">
                            <Plus className="size-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-900">Tạo Gia Phả mới</h3>
                            <p className="text-xs text-amber-700/70 mt-0.5">Tôi muốn khởi tạo Gia Phả cho dòng họ của tôi (Bạn sẽ là Quản trị viên).</p>
                        </div>
                    </button>

                    <button
                        onClick={() => setMode("join")}
                        className="flex items-center gap-4 p-4 rounded-xl border-2 border-sky-100 hover:border-sky-400 bg-sky-50/50 hover:bg-sky-50 transition-all text-left group"
                    >
                        <div className="size-12 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 shrink-0 group-hover:scale-110 transition-transform">
                            <Users className="size-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sky-900">Tham gia bằng Mã</h3>
                            <p className="text-xs text-sky-700/70 mt-0.5">Người thân đã gửi cho tôi mã mời 6 chữ số.</p>
                        </div>
                    </button>
                </div>
            </div>
        );
    }

    if (mode === "create") {
        return (
            <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-lg border border-stone-100 flex flex-col mx-auto my-12 relative overflow-hidden">
                <button onClick={() => setMode("choose")} className="text-xs font-semibold text-stone-400 hover:text-stone-800 mb-6 w-fit transition-colors">
                    ← Quay lại
                </button>
                <h2 className="text-2xl font-serif font-bold text-stone-800 mb-2">
                    Tạo Gia Phả Mới
                </h2>
                <p className="text-stone-500 mb-6 text-sm">
                    Vui lòng đặt tên cho Gia Phả. Bạn có thể đổi lại sau.
                </p>

                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                            Tên Gia Phả
                        </label>
                        <input
                            type="text"
                            required
                            value={familyName}
                            onChange={(e) => setFamilyName(e.target.value)}
                            placeholder="VD: Gia Phả Họ Nguyễn"
                            className="bg-stone-50 text-stone-900 block w-full rounded-xl border-0 ring-1 ring-inset ring-stone-200 focus:ring-2 focus:ring-inset focus:ring-amber-500 px-4 py-3 text-sm transition-all"
                        />
                    </div>

                    {error && <p className="text-rose-500 text-sm">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading || !familyName.trim()}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-xs text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-6"
                    >
                        {loading ? <Loader2 className="size-5 animate-spin" /> : "Tạo Gia Phả"}
                    </button>
                </form>
            </div>
        );
    }

    if (mode === "join") {
        return (
            <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-lg border border-stone-100 flex flex-col mx-auto my-12 relative overflow-hidden">
                <button onClick={() => setMode("choose")} className="text-xs font-semibold text-stone-400 hover:text-stone-800 mb-6 w-fit transition-colors">
                    ← Quay lại
                </button>
                <h2 className="text-2xl font-serif font-bold text-stone-800 mb-2">
                    Tham Gia Gia Phả
                </h2>
                <p className="text-stone-500 mb-6 text-sm">
                    Nhập mã gồm 6 chữ số do Quản trị viên của Gia Phả cung cấp cho bạn.
                </p>

                <form onSubmit={handleJoin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                            Mã Tham Gia (Join Code)
                        </label>
                        <input
                            type="text"
                            required
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            placeholder="VD: 123456"
                            maxLength={6}
                            className="bg-stone-50 text-stone-900 block w-full rounded-xl border-0 ring-1 ring-inset ring-stone-200 focus:ring-2 focus:ring-inset focus:ring-sky-500 px-4 py-3 text-center tracking-widest text-xl font-mono uppercase transition-all"
                        />
                    </div>

                    {error && <p className="text-rose-500 text-sm text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading || joinCode.length < 5}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-xs text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-6"
                    >
                        {loading ? <Loader2 className="size-5 animate-spin" /> : "Tham Gia Ngay"}
                    </button>
                </form>
            </div>
        );
    }

    return null;
}
