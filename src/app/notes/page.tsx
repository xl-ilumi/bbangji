"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react"; // useRef 추가
import { useInView } from "react-intersection-observer";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type BakeryReview = Database["public"]["Tables"]["notes"]["Row"];

const ITEMS_PER_PAGE = 6;

export default function BakeryLogPage() {
  const [reviews, setReviews] = useState<BakeryReview[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // ✨ 중복 요청 방지를 위한 ref (state보다 즉각적인 반영을 위해 사용)
  const isLoadingRef = useRef(false);

  const { ref, inView } = useInView({
    threshold: 0,
  });

  const fetchReviews = useCallback(async (pageParam: number) => {
    // 이미 로딩 중이면 요청 중단 (중복 호출 방지)
    if (isLoadingRef.current) return;

    console.log(`[Fetch Start] Page: ${pageParam}`);

    setLoading(true);
    isLoadingRef.current = true; // 락 걸기

    const from = pageParam * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error(error);
    } else {
      console.log(`[Fetch Success] Received items: ${data?.length}`);

      if (data && data.length > 0) {
        setReviews((prev) => {
          // ✨ 중복 데이터 방지: 기존에 없는 ID만 필터링하여 추가
          const newItems = data.filter(
            (newItem) => !prev.some((prevItem) => prevItem.id === newItem.id),
          );

          console.log(
            `[Merge] Prev: ${prev.length}, New(Unique): ${newItems.length}`,
          );

          // 받아온 데이터가 모두 중복이라 newItems가 0개일 수도 있음
          return [...prev, ...newItems];
        });

        // 가져온 데이터가 요청 개수보다 적으면 더 이상 데이터가 없는 것
        if (data.length < ITEMS_PER_PAGE) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    }

    setLoading(false);
    isLoadingRef.current = false; // 락 해제
  }, []);

  // 1. 초기 로드 (첫 페이지)
  useEffect(() => {
    console.log("[Init] Resetting list...");
    setReviews([]);
    setPage(0);
    setHasMore(true);
    isLoadingRef.current = false; // 초기화 시 락도 해제
    fetchReviews(0);
  }, [fetchReviews]);

  // 2. 무한 스크롤 감지 (바닥에 닿으면 다음 페이지 로드)
  useEffect(() => {
    // 로딩 중이 아니고(state & ref), 더 가져올 게 있고, 화면에 보일 때만 실행
    if (inView && hasMore && !loading && !isLoadingRef.current) {
      console.log("[InView Detected] Load next page...");
      const nextPage = page + 1;
      setPage(nextPage);
      fetchReviews(nextPage);
    }
  }, [inView, hasMore, loading, page, fetchReviews]);

  return (
    <div className="max-w-6xl mx-auto p-4 bg-[#FFF8E1] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-orange-900">🥐 빵지순례 목록</h1>
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
                <span className="text-orange-400 font-medium">
                  자세히 보기 →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ✨ 스크롤 감지 영역 & 로딩 인디케이터 */}
      <div ref={ref} className="py-10 text-center w-full">
        {loading && (
          <div className="text-orange-800 animate-pulse">빵 굽는 중... 🥨</div>
        )}
        {!hasMore && reviews.length > 0 && (
          <div className="text-gray-400">모든 빵집을 다 둘러봤어요! 🎉</div>
        )}
      </div>
    </div>
  );
}
