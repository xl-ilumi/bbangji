"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import BakerySearchMap from "@/components/bakeries/BakerySearchMap";
import { supabase } from "@/lib/supabase";

// 카카오 장소 타입 (위와 동일하게 정의하거나 별도 파일로 분리 추천)
interface PlaceType {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  x: string;
  y: string;
  category_group_name?: string;
}

export default function NewBakeryPage() {
  const [selectedPlace, setSelectedPlace] = useState<PlaceType | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!selectedPlace) return;
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert("로그인이 필요합니다.");
        return;
      }

      // 중복 체크 (place_id로 확인)
      const { data: existing } = await supabase
        .from("bakeries")
        .select("id")
        .eq("place_id", selectedPlace.id)
        .single();

      if (existing) {
        alert("이미 등록된 빵집입니다!");
        // 추후 해당 빵집 상세 페이지로 이동하도록 개선 가능
        setLoading(false);
        return;
      }

      // 등록 실행
      const { error } = await supabase.from("bakeries").insert({
        name: selectedPlace.place_name,
        address: selectedPlace.road_address_name || selectedPlace.address_name,
        lat: parseFloat(selectedPlace.y),
        lng: parseFloat(selectedPlace.x),
        place_id: selectedPlace.id,
        category: ["베이커리"], // 기본값 설정 (추후 선택 가능하게 확장)
        // image_url: ... (장소 사진은 카카오 API에서 직접 주지 않으므로 일단 비워둠)
      });

      if (error) throw error;

      alert("빵집이 등록되었습니다! 🥐");
      router.push("/notes/create"); // 빵집 등록 후 바로 후기 작성으로 이동 (흐름 자연스럽게)
    } catch (error) {
      console.error(error);
      alert("등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-orange-900">
        🏪 빵집 등록하기
      </h1>
      <p className="text-center text-gray-500 mb-8">
        지도에서 빵집을 검색하고 선택해주세요.
        <br />
        선택한 빵집이 우리 대동빵지도에 등록됩니다.
      </p>

      {/* 검색 및 지도 영역 */}
      <BakerySearchMap onSelect={setSelectedPlace} />

      {/* 선택된 빵집 정보 및 등록 버튼 */}
      {selectedPlace && (
        <div className="mt-6 p-6 bg-orange-50 border border-orange-200 rounded-xl shadow-md text-center animate-fade-in">
          <h2 className="text-xl font-bold text-orange-900 mb-2">
            {selectedPlace.place_name}
          </h2>
          <p className="text-gray-600 mb-4">
            {selectedPlace.road_address_name || selectedPlace.address_name}
          </p>

          <button
            type="button"
            onClick={handleRegister}
            disabled={loading}
            className="w-full md:w-auto px-8 py-3 bg-orange-600 text-white font-bold rounded-full hover:bg-orange-700 transition disabled:bg-gray-400 shadow-lg hover:-translate-y-1"
          >
            {loading ? "등록 중..." : "✨ 이 빵집 등록하기"}
          </button>
        </div>
      )}
    </div>
  );
}
