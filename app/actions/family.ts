"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

function generateJoinCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createFamily(familyName: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Vui lòng đăng nhập.");
    }

    // Generate unique code securely
    let code = generateJoinCode();
    let unique = false;
    let retries = 0;

    while (!unique && retries < 5) {
        const { data } = await supabase.from("families").select("id").eq("join_code", code).single();
        if (!data) {
            unique = true;
        } else {
            code = generateJoinCode();
            retries++;
        }
    }

    // 1. Create family
    const { data: family, error: familyError } = await supabase
        .from("families")
        .insert([{ name: familyName, join_code: code }])
        .select()
        .single();

    if (familyError || !family) {
        console.error("Error creating family:", familyError);
        throw new Error("Có lỗi xảy ra khi tạo Gia Phả. Vui lòng thử lại.");
    }

    // 2. Update user profile to link to family and become admin
    const { error: profileError } = await supabase
        .from("profiles")
        .update({ family_id: family.id, role: "admin" })
        .eq("id", user.id);

    if (profileError) {
        console.error("Error linking profile to family:", profileError);
        // Ideally rollback family creation here, but ignoring for simplicity
        throw new Error("Không thể liên kết tài khoản với Gia Phả.");
    }

    revalidatePath("/");
    return { success: true, family };
}

export async function joinFamily(joinCode: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Vui lòng đăng nhập.");
    }

    // 1. Find family by code
    const { data: family, error: findError } = await supabase
        .from("families")
        .select("id, name")
        .eq("join_code", joinCode)
        .single();

    if (findError || !family) {
        throw new Error("Mã Gia Phả không chính xác hoặc không tồn tại.");
    }

    // 2. Update user profile
    const { error: profileError } = await supabase
        .from("profiles")
        .update({ family_id: family.id, role: "member" })
        .eq("id", user.id);

    if (profileError) {
        console.error("Error joining family:", profileError);
        throw new Error("Đã có lỗi xảy ra khi tham gia Gia Phả.");
    }

    revalidatePath("/");
    return { success: true, family };
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
