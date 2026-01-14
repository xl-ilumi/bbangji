"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import LikeButton from "@/components/notes/LikeButton";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type BakeryReview = Database["public"]["Tables"]["notes"]["Row"];

export default function BakeryLogPage() {
  const [reviews, setReviews] = useState<BakeryReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });
      setReviews(data || []);
      setLoading(false);
    };
    fetchReviews();
  }, []);

  if (loading)
    return <div className="text-center py-20 text-orange-800">로딩 중...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 bg-[#FFF8E1] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-orange-900">🥐 빵지순례 목록</h1>
        {/* 새 기록 작성 페이지로 이동하는 버튼 */}
        <Link
          href="/notes/create"
          className="bg-orange-600 text-white font-bold py-3 px-6 rounded-full hover:bg-orange-700 transition shadow-md hover:-translate-y-1"
        >
          + 새 기록
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review) => (
          <Link
            key={review.id}
            href={`/notes/${review.id}`}
            className="block h-full"
          >
            <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-50 flex flex-col hover:shadow-md transition h-full">
              <div className="relative w-full h-48 mb-3 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {review.image_url ? (
                  <Image
                    src={review.image_url}
                    alt={review.title}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    🍞
                  </div>
                )}
              </div>
              <h3 className="font-bold text-xl mb-1 text-orange-950 truncate">
                {review.title}
              </h3>
              <p className="text-gray-700 text-sm mb-4 flex-grow line-clamp-3 whitespace-pre-wrap">
                {review.content}
              </p>
              <div className="flex justify-between items-center text-xs text-gray-400 border-t pt-3 mt-auto">
                <span>{new Date(review.created_at).toLocaleDateString()}</span>
                <LikeButton noteId={review.id} />
                <span className="text-orange-400 font-medium">
                  자세히 보기 →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
