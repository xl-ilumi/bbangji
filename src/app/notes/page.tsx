"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type BakeryReview = Database["public"]["Tables"]["notes"]["Row"];

export default function BakeryLogPage() {
  const [reviews, setReviews] = useState<BakeryReview[]>([]);
  const [loading, setLoading] = useState(true);

  // 입력 폼 상태
  const [bakeryName, setBakeryName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [file, setFile] = useState<File | null>(null); // 파일 상태 추가
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // 미리보기 URL

  const [editingId, setEditingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // 파일 인풋 초기화를 위해 ref 사용

  // 1. 기록 조회
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

  // 2. 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile)); // 미리보기 생성
    }
  };

  // 3. 이미지 업로드 함수
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("bakery-images") // 버킷 이름
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 공개 URL 가져오기
      const { data } = supabase.storage
        .from("bakery-images")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("이미지 업로드 중 오류가 발생했습니다.");
      return null;
    }
  };

  // 4. 저장 (Create & Update)
  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bakeryName.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return alert("로그인이 필요합니다.");

    let imageUrl = editingId
      ? reviews.find((r) => r.id === editingId)?.image_url
      : null;

    // 새 파일이 선택되었다면 업로드 진행
    if (file) {
      const uploadedUrl = await uploadImage(file);
      if (uploadedUrl) imageUrl = uploadedUrl;
    }

    if (editingId) {
      // Update
      const { error } = await supabase
        .from("notes")
        .update({
          title: bakeryName,
          content: reviewText,
          image_url: imageUrl, // 이미지 URL 업데이트
        })
        .eq("id", editingId);

      if (!error) {
        alert("수정되었습니다!");
        setEditingId(null);
      }
    } else {
      // Create
      const { error } = await supabase.from("notes").insert({
        title: bakeryName,
        content: reviewText,
        user_id: user.id,
        image_url: imageUrl, // 이미지 URL 저장
      });

      if (error) {
        console.error(error);
        alert("저장 실패 😭");
        return;
      }
    }

    // 초기화
    setBakeryName("");
    setReviewText("");
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    fetchReviews();
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setBakeryName("");
    setReviewText("");
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (loading)
    return <div className="p-8 text-center text-orange-800">로딩 중...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 bg-[#FFF8E1] min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-orange-900">
        🥐 나의 빵지순례 기록
      </h1>

      <form
        onSubmit={handleSaveReview}
        className="mb-8 p-6 bg-white rounded-xl shadow-md border border-orange-100"
      >
        <h2 className="text-lg font-bold text-orange-800 mb-4">
          {editingId ? "✏️ 기록 수정하기" : "📝 새 기록 남기기"}
        </h2>

        <div className="mb-4">
          <label htmlFor="bakery-name" className="sr-only">
            빵집 이름
          </label>
          <input
            id="bakery-name"
            type="text"
            placeholder="빵집 이름"
            value={bakeryName}
            onChange={(e) => setBakeryName(e.target.value)}
            className="w-full p-3 border border-orange-200 rounded-lg mb-2"
          />
          <label htmlFor="review-text" className="sr-only">
            후기 작성
          </label>
          <textarea
            id="review-text"
            placeholder="후기 작성"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            className="w-full p-3 border border-orange-200 rounded-lg h-24 resize-none mb-2"
          />

          {/* 이미지 첨부 */}
          <div className="mb-2">
            <label
              htmlFor="file-upload"
              className="block text-sm font-bold text-orange-800 mb-1 cursor-pointer"
            >
              📷 사진 첨부
            </label>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
            />
          </div>

          {/* 미리보기 */}
          {previewUrl && (
            <div className="relative w-full h-48 mb-4 bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className={`flex-1 text-white font-bold p-3 rounded-lg ${editingId ? "bg-green-600" : "bg-orange-500"}`}
          >
            {editingId ? "수정 완료" : "기록 남기기"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 bg-gray-400 text-white rounded-lg"
            >
              취소
            </button>
          )}
        </div>
      </form>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review) => (
          <Link key={review.id} href={`/notes/${review.id}`} className="block">
            <div
              className={`bg-white p-4 rounded-xl shadow-sm border border-orange-50 flex flex-col hover:shadow-md transition h-full ${editingId === review.id ? "border-2 border-green-500" : ""}`}
            >
              {/* 리스트 이미지 */}
              {review.image_url && (
                <div className="relative w-full h-48 mb-3 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={review.image_url}
                    alt={review.title}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>
              )}
              <h3 className="font-bold text-xl mb-1 text-orange-950">
                {review.title}
              </h3>
              <p className="text-gray-700 text-sm mb-4 grow line-clamp-3 whitespace-pre-wrap">
                {review.content}
              </p>

              <div className="flex justify-between items-center text-xs text-gray-400 border-t pt-2 mt-auto">
                <span>{new Date(review.created_at).toLocaleDateString()}</span>
                {/* ✨ 수정/삭제 버튼 제거됨 */}
                <span className="text-orange-400">자세히 보기 →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
