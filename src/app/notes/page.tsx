"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

// 타입 정의
type BakeryReview = Database["public"]["Tables"]["notes"]["Row"];

export default function BakeryLogPage() {
  const [reviews, setReviews] = useState<BakeryReview[]>([]);
  const [loading, setLoading] = useState(true);

  // 입력 폼 상태
  const [bakeryName, setBakeryName] = useState("");
  const [reviewText, setReviewText] = useState("");

  // 수정 모드 상태 (수정 중인 리뷰의 ID 저장, 없으면 null)
  const [editingId, setEditingId] = useState<number | null>(null);

  const router = useRouter();

  // 1. 기록 조회 (Read)
  const fetchReviews = useCallback(async () => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching reviews:", error);
    else setReviews(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // 2. 기록 저장 (Create & Update)
  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bakeryName.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return alert("로그인이 필요합니다.");

    let isSuccess = false;

    if (editingId) {
      // [수정 모드] Update
      const { error } = await supabase
        .from("notes")
        .update({
          title: bakeryName,
          content: reviewText,
        })
        .eq("id", editingId);

      if (error) {
        console.error("Error updating review:", error);
        alert("수정 실패 😭");
      } else {
        alert("수정되었습니다!");
        setEditingId(null); // 수정 모드 종료
        isSuccess = true;
      }
    } else {
      // [작성 모드] Create (Insert)
      const { error } = await supabase.from("notes").insert({
        title: bakeryName,
        content: reviewText,
        user_id: user.id,
      });

      if (error) {
        console.error("Error adding review:", error);
        alert("기록 저장 실패 😭 (Foreign Key 오류라면 아래 가이드 참고)");
      } else {
        isSuccess = true;
      }
    }

    // 공통 초기화 및 목록 갱신
    if (isSuccess) {
      // 에러가 없으면 초기화
      setBakeryName("");
      setReviewText("");
      fetchReviews();
    }
  };

  // 3. 기록 삭제 (Delete)
  const handleDelete = async (id: number) => {
    if (!confirm("정말 이 기록을 지우시겠어요?")) return;

    const { error } = await supabase.from("notes").delete().eq("id", id);

    if (error) {
      console.error("Error deleting review:", error);
      alert("삭제 실패");
    } else {
      fetchReviews();
    }
  };

  // 4. 수정 버튼 클릭 시 폼으로 데이터 불러오기
  const handleEditClick = (review: BakeryReview) => {
    setEditingId(review.id);
    setBakeryName(review.title);
    setReviewText(review.content || "");
    window.scrollTo({ top: 0, behavior: "smooth" }); // 폼 위치로 스크롤 이동
  };

  // 5. 수정 취소
  const handleCancelEdit = () => {
    setEditingId(null);
    setBakeryName("");
    setReviewText("");
  };

  if (loading)
    return (
      <div className="p-8 text-center text-orange-800">
        빵 굽는 중... (로딩)
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-4 bg-[#FFF8E1] min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-orange-900 flex items-center gap-2">
        🥐 나의 빵지순례 기록
      </h1>

      {/* 입력 폼 */}
      <form
        onSubmit={handleSaveReview}
        className="mb-8 p-6 bg-white rounded-xl shadow-md border border-orange-100 relative"
      >
        <h2 className="text-lg font-bold text-orange-800 mb-4">
          {editingId ? "✏️ 기록 수정하기" : "📝 새 기록 남기기"}
        </h2>

        <div className="mb-4">
          <label
            htmlFor="bakeryName"
            className="block text-sm font-bold text-orange-800 mb-1"
          >
            다녀온 빵집 이름
          </label>
          <input
            id="bakeryName"
            type="text"
            placeholder="예: 성심당, 런던베이글뮤지엄"
            value={bakeryName}
            onChange={(e) => setBakeryName(e.target.value)}
            className="w-full p-3 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="reviewText"
            className="block text-sm font-bold text-orange-800 mb-1"
          >
            솔직한 후기
          </label>
          <textarea
            id="reviewText"
            placeholder="어떤 빵이 맛있었나요? 가격이나 분위기는 어땠나요?"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            className="w-full p-3 border border-orange-200 rounded-lg h-24 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className={`flex-1 text-white font-bold p-3 rounded-lg transition shadow-sm ${
              editingId
                ? "bg-green-600 hover:bg-green-700"
                : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {editingId ? "수정 완료" : "🍞 기록 남기기"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-3 bg-gray-400 text-white font-bold rounded-lg hover:bg-gray-500 transition"
            >
              취소
            </button>
          )}
        </div>
      </form>

      {/* 목록 리스트 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reviews.length === 0 ? (
          <p className="text-gray-500 col-span-full text-center py-10">
            아직 다녀온 빵집이 없네요! 🥖
          </p>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className={`bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition border flex flex-col justify-between ${editingId === review.id ? "border-2 border-green-500 ring-2 ring-green-100" : "border-orange-50"}`}
            >
              <div>
                <h3 className="font-bold text-xl mb-2 text-orange-950">
                  {review.title}
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap text-sm mb-4 leading-relaxed">
                  {review.content}
                </p>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-400 mt-2 pt-3 border-t border-orange-50">
                <span>
                  {new Date(review.created_at).toLocaleDateString()} 방문
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditClick(review)}
                    className="text-blue-400 hover:text-blue-600 font-medium px-2 py-1 rounded hover:bg-blue-50"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(review.id)}
                    className="text-red-400 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
