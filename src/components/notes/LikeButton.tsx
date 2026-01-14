"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  noteId: number;
}

export default function LikeButton({ noteId }: Props) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false); // API 요청 중 중복 클릭 방지

  // 초기 상태 로드
  useEffect(() => {
    const fetchLikeStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 1. 전체 좋아요 개수 조회
      const { count: likeCount } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true }) // 데이터는 안 가져오고 개수만 파악
        .eq("note_id", noteId);

      setCount(likeCount || 0);

      // 2. 내가 좋아요 했는지 확인 (로그인 한 경우만)
      if (user) {
        const { data } = await supabase
          .from("likes")
          .select("id")
          .eq("note_id", noteId)
          .eq("user_id", user.id)
          .single();

        if (data) setLiked(true);
      }
    };
    fetchLikeStatus();
  }, [noteId]);

  const toggleLike = async (e: React.MouseEvent) => {
    e.preventDefault(); // Link 태그 내부에서 클릭 시 페이지 이동 방지
    e.stopPropagation();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return alert("로그인이 필요합니다! 🥐");

    if (loading) return;
    setLoading(true);

    if (liked) {
      // 좋아요 취소 (Delete)
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("note_id", noteId)
        .eq("user_id", user.id);

      if (!error) {
        setLiked(false);
        setCount((prev) => prev - 1);
      }
    } else {
      // 좋아요 등록 (Insert)
      const { error } = await supabase
        .from("likes")
        .insert({ note_id: noteId, user_id: user.id });

      if (!error) {
        setLiked(true);
        setCount((prev) => prev + 1);
      }
    }
    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={toggleLike}
      className={`flex items-center gap-1 text-sm font-medium transition rounded-full px-2 py-1 hover:bg-red-50 ${liked ? "text-red-500" : "text-gray-400 hover:text-red-400"}`}
      title={liked ? "좋아요 취소" : "좋아요"}
    >
      <span className="text-lg transform transition-transform active:scale-125">
        {liked ? "❤️" : "🤍"}
      </span>
      <span>{count}</span>
    </button>
  );
}
