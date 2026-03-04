"use client";

import { deleteMemberProfile } from "@/app/actions/member";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteMemberButtonProps {
  memberId: string;
}

export default function DeleteMemberButton({
  memberId,
}: DeleteMemberButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn xoá hồ sơ này không? Hành động này không thể hoàn tác.",
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteMemberProfile(memberId);
      if (result.success) {
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("Delete failed:", error);
      alert(error.message || "Đã xảy ra lỗi khi xoá hồ sơ.");
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isDeleting ? "Đang xoá..." : "Xoá hồ sơ"}
    </button>
  );
}
