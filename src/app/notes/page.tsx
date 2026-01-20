"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import SearchBar from "@/components/common/SearchBar"; // ✨ 추가
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type BakeryReview = Database["public"]["Tables"]["notes"]["Row"];

const ITEMS_PER_PAGE = 6;

export default function BakeryLogPage() {
  const [reviews, setReviews] = useState<BakeryReview[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // ✨ 검색어 상태

  const isLoadingRef = useRef(false);

  const { ref, inView } = useInView({ threshold: 0 });

  // 데이터 조회 함수 (검색어 파라미터 추가)
  const fetchReviews = useCallback(async (pageParam: number, query: string) => {
    if (isLoadingRef.current) return;

    setLoading(true);
    isLoadingRef.current = true;

    const from = pageParam * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let dbQuery = supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    // ✨ 검색어가 있으면 필터링 조건 추가
    if (query) {
      dbQuery = dbQuery.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
    }

    const { data, error } = await dbQuery;

    if (error) {
      console.error(error);
    } else {
      if (data && data.length > 0) {
        setReviews((prev) => {
          // 페이지가 0이면(새 검색) 기존 데이터 날리고 새로 설정
          if (pageParam === 0) return data;

          // 중복 제거 후 병합
          const newItems = data.filter(
            (newItem) => !prev.some((prevItem) => prevItem.id === newItem.id),
          );
          return [...prev, ...newItems];
        });

        if (data.length < ITEMS_PER_PAGE) setHasMore(false);
      } else {
        // 첫 페이지인데 데이터가 없으면 빈 목록
        if (pageParam === 0) setReviews([]);
        setHasMore(false);
      }
    }

    setLoading(false);
    isLoadingRef.current = false;
  }, []);

  // 1. 초기 로드
  useEffect(() => {
    // searchTerm이 변경되어도 여기서는 자동 로드하지 않음 (검색 버튼 클릭 시 처리)
    // 컴포넌트 마운트 시 최초 1회만 실행
    fetchReviews(0, "");
  }, [fetchReviews]);

  // 2. 무한 스크롤 감지
  useEffect(() => {
    if (inView && hasMore && !loading && !isLoadingRef.current) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchReviews(nextPage, searchTerm); // 현재 검색어로 다음 페이지 로드
    }
  }, [inView, hasMore, loading, page, fetchReviews, searchTerm]);

  // 3. ✨ 검색 핸들러
  const handleSearch = (query: string) => {
    setSearchTerm(query);
    setPage(0);
    setHasMore(true);
    setReviews([]); // 목록 초기화
    isLoadingRef.current = false; // 락 해제 (혹시 모를 상태 꼬임 방지)
    fetchReviews(0, query); // 0페이지부터 다시 조회
  };

  return (
    <div className="max-w-6xl mx-auto p-4 bg-[#FFF8E1] min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-orange-900">🥐 빵지순례 목록</h1>
        <Link
          href="/notes/create"
          className="bg-orange-600 text-white font-bold py-3 px-6 rounded-full hover:bg-orange-700 transition shadow-md hover:-translate-y-1 whitespace-nowrap"
        >
          + 새 기록
        </Link>
      </div>

      {/* ✨ 검색창 */}
      <SearchBar onSearch={handleSearch} />

      {/* 검색 결과 없음 메시지 */}
      {!loading && reviews.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          {searchTerm
            ? `"${searchTerm}"에 대한 빵집이 없어요 😢`
            : "등록된 기록이 없습니다."}
        </div>
      )}

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

      {/* 로딩 인디케이터 (무한 스크롤) */}
      <div ref={ref} className="py-10 text-center w-full min-h-[50px]">
        {loading && (
          <div className="text-orange-800 animate-pulse">빵 굽는 중... 🥨</div>
        )}
      </div>
    </div>
  );
}
