"use client";

import { updateFamilyName } from "@/app/actions/family";
import config from "@/app/config";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface FamilyNameEditorProps {
    initialName: string;
}

export default function FamilyNameEditor({ initialName }: FamilyNameEditorProps) {
    const [name, setName] = useState(initialName);
    const [isSaving, setIsSaving] = useState(false);
    const [isDemo, setIsDemo] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setIsDemo(window.location.hostname === config.demoDomain);
        }
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isDemo) {
            setMessage({ text: "Đây là trang demo, chức năng đổi tên gia phả bị hạn chế.", type: "error" });
            return;
        }

        if (!name.trim()) {
            setMessage({ text: "Tên Gia phả không được để trống.", type: "error" });
            return;
        }

        setIsSaving(true);
        setMessage(null);

        const res = await updateFamilyName(name.trim());
        if (res.success) {
            setMessage({ text: "Đã cập nhật tên Gia phả thành công!", type: "success" });
            setTimeout(() => setMessage(null), 3000);
        } else {
            setMessage({ text: res.error || "Lỗi cập nhật tên Gia phả.", type: "error" });
        }

        setIsSaving(false);
    };

    return (
        <form onSubmit={handleSave} className="space-y-4">
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}
                    >
                        {message.text}
                    </motion.div>
                )}
            </AnimatePresence>
            <div>
                <label htmlFor="familyName" className="block text-sm font-medium text-stone-700 mb-1">
                    Tên Gia phả hiển thị
                </label>
                <div className="flex gap-3">
                    <input
                        id="familyName"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="flex-1 px-4 py-2 bg-stone-50 text-stone-900 border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                        placeholder="Gia phả họ..."
                        disabled={isSaving}
                    />
                    <button
                        type="submit"
                        disabled={isSaving || name.trim() === initialName}
                        className="btn-primary min-w-[120px]"
                    >
                        {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                </div>
            </div>
        </form>
    );
}
