"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Props {
  noteId: number;
}

export default function NoteActions({ noteId }: Props) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const { error } = await supabase.from("notes").delete().eq("id", noteId);
    if (error) {
      alert("삭제 실패");
    } else {
      alert("삭제되었습니다.");
      router.push("/notes");
      router.refresh();
    }
  };

  const handleEdit = () => {
    // 변경된 경로: 수정 전용 페이지로 이동
    router.push(`/notes/${noteId}/edit`);
  };

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={handleEdit}
        className="px-3 py-1 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition"
      >
        수정
      </button>
      <button
        type="button"
        onClick={handleDelete}
        className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50 transition"
      >
        삭제
      </button>
    </div>
  );
}
