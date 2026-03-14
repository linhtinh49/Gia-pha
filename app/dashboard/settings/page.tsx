import AdminUserList from "@/components/AdminUserList";
import config from "@/app/config";
import { AdminUserData } from "@/types";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import FamilyNameEditor from "@/components/FamilyNameEditor";

export default async function SettingsPage() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Check role
    const { data: profile } = await supabase
        .from("profiles")
        .select("role, family_id")
        .eq("id", user.id)
        .single();

    const isAdmin = profile?.role === "admin";

    if (!isAdmin || !profile?.family_id) {
        redirect("/dashboard");
    }

    // Fetch Family details
    const { data: family } = await supabase
        .from("families")
        .select("name")
        .eq("id", profile.family_id)
        .single();

    // Fetch users via RPC
    const { data: users, error } = await supabase.rpc("get_admin_users");

    if (error) {
        console.error("Error fetching users:", error);
    }

    const typedUsers = (users as AdminUserData[]) || [];

    return (
        <main className="flex-1 overflow-auto bg-stone-50/50 flex flex-col pt-8 relative w-full">
            <div className="max-w-7xl mx-auto px-4 pb-8 sm:px-6 lg:px-8 w-full relative z-10 space-y-12">
                {/* Settings Header */}
                <div>
                    <h2 className="text-3xl font-serif font-bold text-stone-800 tracking-tight">
                        Cài đặt & Thành viên
                    </h2>
                    <p className="text-stone-500 mt-2 text-sm sm:text-base">
                        Quản lý tên Gia phả và thiết lập quyền hạn cho các thành viên tham gia.
                    </p>
                </div>

                {/* General Settings */}
                <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-stone-200/60 transition-shadow duration-300">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-stone-800">Cài đặt chung</h3>
                        <p className="text-stone-500 text-sm mt-1">Thông tin cơ bản về Gia phả của bạn.</p>
                    </div>

                    <div className="max-w-xl">
                        <FamilyNameEditor initialName={family?.name || config.siteName} />
                    </div>
                </section>

                {/* User Management */}
                <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-stone-200/60 transition-shadow duration-300">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-stone-800">Phân quyền Thành viên</h3>
                        <p className="text-stone-500 text-sm mt-1">Quản lý những tài khoản đã tham gia bằng mã bảo mật gia phả. Bật/tắt các quyền tùy ý.</p>
                    </div>
                    <AdminUserList initialUsers={typedUsers} currentUserId={user.id} />
                </section>
            </div>
        </main>
    );
}
