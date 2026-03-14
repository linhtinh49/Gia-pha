"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

function generateJoinCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createFamily(familyName: string) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Vui lòng đăng nhập." };
        }

        // Generate unique code securely
        let code = generateJoinCode();
        let unique = false;
        let retries = 0;

        while (!unique && retries < 5) {
            const { data } = await supabase.from("families").select("id").eq("join_code", code).limit(1);
            if (!data || data.length === 0) {
                unique = true;
            } else {
                code = generateJoinCode();
                retries++;
            }
        }

        if (!unique) {
            return { success: false, error: "Không thể tạo mã duy nhất. Vui lòng thử lại." };
        }

        // 1. Create family and link admin atomically using RPC
        const { data: family, error: rpcError } = await supabase.rpc("create_family_and_link_admin", {
            new_family_name: familyName,
            new_join_code: code,
        });

        if (rpcError || !family) {
            console.error("Error creating family via RPC:", rpcError);
            return { success: false, error: "Có lỗi xảy ra khi tạo Gia Phả. Vui lòng thử lại." };
        }

        return { success: true, family };
    } catch (error: any) {
        console.error("Create Family Action Error:", error);
        return { success: false, error: error.message || "Lỗi máy chủ không xác định." };
    }
}

export async function joinFamily(joinCode: string) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Vui lòng đăng nhập." };
        }

        // 1. Join family atomically using RPC
        const { data: family, error: rpcError } = await supabase.rpc("join_family_by_code", {
            target_join_code: joinCode,
        });

        if (rpcError) {
            console.error("Join family RPC error:", rpcError);
            return { success: false, error: "Mã Gia Phả không chính xác hoặc không tồn tại." };
        }

        return { success: true, family };
    } catch (error: any) {
        console.error("Join Family Action Error:", error);
        return { success: false, error: error.message || "Lỗi máy chủ không xác định." };
    }
}

export async function getMyFamilyInfo() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("family_id")
        .eq("id", user.id)
        .single();

    if (!profile || !profile.family_id) return null;

    const { data: family } = await supabase
        .from("families")
        .select("*")
        .eq("id", profile.family_id)
        .single();

    return family;
}

export async function updateFamilyName(newName: string) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { error } = await supabase.rpc("update_family_name", {
            new_family_name: newName,
        });

        if (error) {
            console.error("Failed to update family name:", error);
            throw new Error(error.message);
        }

        revalidatePath("/dashboard", "layout");
        return { success: true };
    } catch (error: any) {
        console.error("Update Family Name Action Error:", error);
        return { success: false, error: error.message || "Lỗi máy chủ không xác định." };
    }
}
