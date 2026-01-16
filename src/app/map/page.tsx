"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CustomOverlayMap, Map, MapMarker } from "react-kakao-maps-sdk";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type Bakery = Database["public"]["Tables"]["bakeries"]["Row"];

// ✨ 이미지 로딩 실패 시 기본 아이콘을 보여주는 컴포넌트
function BakeryThumbnail({ src, alt }: { src: string | null; alt: string }) {
  const [error, setError] = useState(false);

  // URL이 없거나 로딩 에러가 발생하면 기본 아이콘 표시
  if (!src || error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-2xl bg-orange-50 text-orange-300">
        🏪
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      onError={() => setError(true)} // 이미지 로드 실패 감지
    />
  );
}

export default function GlobalMapPage() {
  const [bakeries, setBakeries] = useState<Bakery[]>([]);
  const [selectedBakery, setSelectedBakery] = useState<Bakery | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. 모든 빵집 데이터 가져오기
  useEffect(() => {
    const fetchBakeries = async () => {
      const { data, error } = await supabase.from("bakeries").select("*");

      if (error) console.error(error);
      else setBakeries(data || []);
      setLoading(false);
    };
    fetchBakeries();
  }, []);

  if (loading)
    return (
      <div className="w-full h-screen flex items-center justify-center text-orange-800">
        지도 불러오는 중... 🥐
      </div>
    );

  return (
    <div className="w-full h-[calc(100vh-64px)] relative">
      {" "}
      {/* 헤더 높이 제외 */}
      <Map
        center={{ lat: 37.5665, lng: 126.978 }} // 초기 중심 좌표 (서울)
        style={{ width: "100%", height: "100%" }}
        level={8} // 줌 레벨
        onClick={() => setSelectedBakery(null)} // 빈 곳 클릭 시 닫기
      >
        {bakeries.map((bakery) => (
          <div key={bakery.id}>
            <MapMarker
              position={{ lat: bakery.lat!, lng: bakery.lng! }}
              onClick={() => setSelectedBakery(bakery)}
              image={{
                src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png", // 수정됨: 순수 URL만 입력
                size: { width: 24, height: 35 },
              }}
              title={bakery.name}
            />

            {/* 선택된 빵집 오버레이 */}
            {selectedBakery?.id === bakery.id && (
              <CustomOverlayMap
                position={{ lat: bakery.lat!, lng: bakery.lng! }}
                yAnchor={1.2}
              >
                <div className="bg-white rounded-xl shadow-lg border border-orange-100 p-4 w-64 relative animate-fade-in-up">
                  {/* 닫기 버튼 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBakery(null);
                    }}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 z-10"
                  >
                    ✕
                  </button>

                  <div className="flex gap-3">
                    {/* ✨ 안전한 썸네일 컴포넌트 사용 */}
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-orange-50 flex-shrink-0">
                      <BakeryThumbnail
                        src={bakery.image_url}
                        alt={bakery.name}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate pr-4">
                        {bakery.name}
                      </h3>
                      <p className="text-xs text-gray-500 truncate mb-1">
                        {bakery.address}
                      </p>
                      <div className="flex gap-1 flex-wrap">
                        {bakery.category?.slice(0, 2).map(
                          (
                            cat,
                            idx, // 공간 관계상 2개만 노출
                          ) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded"
                            >
                              {cat}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/notes/create?bakery_name=${encodeURIComponent(bakery.name)}`}
                      className="flex-1 text-center text-xs bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition"
                    >
                      후기 쓰기 📝
                    </Link>
                  </div>
                </div>
              </CustomOverlayMap>
            )}
          </div>
        ))}
      </Map>
      {/* 등록 유도 플로팅 버튼 */}
      <Link
        href="/bakeries/new"
        className="absolute bottom-6 right-6 z-10 bg-white text-orange-600 font-bold py-3 px-6 rounded-full shadow-lg border border-orange-100 hover:-translate-y-1 transition flex items-center gap-2"
      >
        <span>📍</span> 빵집 등록하기
      </Link>
    </div>
  );
}
