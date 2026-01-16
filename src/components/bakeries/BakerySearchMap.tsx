"use client";

import { useEffect, useState } from "react";
import { Map, MapMarker } from "react-kakao-maps-sdk";

interface PlaceType {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  x: string; // 경도 (lng)
  y: string; // 위도 (lat)
  category_group_name?: string;
}

interface Props {
  onSelect: (place: PlaceType) => void;
}

export default function BakerySearchMap({ onSelect }: Props) {
  const [keyword, setKeyword] = useState("");
  const [places, setPlaces] = useState<PlaceType[]>([]);
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.978 });
  const [markers, setMarkers] = useState<PlaceType[]>([]);

  const searchPlaces = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return alert("검색어를 입력해주세요!");

    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
      return alert("지도 서비스 로딩 중입니다. 잠시 후 다시 시도해주세요.");
    }

    const ps = new window.kakao.maps.services.Places();

    ps.keywordSearch(keyword, (data, status, _pagination) => {
      if (status === window.kakao.maps.services.Status.OK) {
        // 검색 결과 중 '제과,베이커리' 카테고리거나 검색어에 '빵'이 들어간 것 위주로 필터링하면 좋지만,
        // 카카오 데이터가 완벽하지 않으므로 일단 전체 결과를 보여줍니다.
        // 타입 단언을 사용하여 data를 PlaceType[]으로 처리
        const result = data as unknown as PlaceType[];

        setPlaces(result);
        setMarkers(result);

        // 첫 번째 결과로 지도 중심 이동
        if (result.length > 0) {
          setMapCenter({
            lat: parseFloat(result[0].y),
            lng: parseFloat(result[0].x),
          });
        }
      } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
        alert("검색 결과가 존재하지 않습니다.");
      } else if (status === window.kakao.maps.services.Status.ERROR) {
        alert("검색 중 오류가 발생했습니다.");
      }
    });
  };

  return (
    <div className="flex flex-col h-[600px] w-full border rounded-xl overflow-hidden">
      {/* 검색창 */}
      <div className="p-4 bg-white border-b z-10 shadow-sm">
        <form onSubmit={searchPlaces} className="flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="빵집 이름을 검색해보세요 (예: 성심당)"
            className="flex-1 p-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition"
          >
            검색
          </button>
        </form>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 결과 목록 (PC에서는 왼쪽, 모바일에서는 하단에 배치하면 좋지만 일단 간단히 리스트로) */}
        <div className="w-1/3 min-w-[250px] overflow-y-auto border-r bg-white p-2 hidden md:block">
          {places.length === 0 ? (
            <p className="text-gray-400 text-center mt-10 text-sm">
              검색 결과가 여기에 표시됩니다.
            </p>
          ) : (
            <ul className="space-y-2">
              {places.map((place) => (
                <li
                  key={place.id}
                  className="p-3 border rounded-lg hover:bg-orange-50 cursor-pointer transition"
                  onClick={() => {
                    setMapCenter({
                      lat: parseFloat(place.y),
                      lng: parseFloat(place.x),
                    });
                    onSelect(place);
                  }}
                >
                  <h4 className="font-bold text-gray-800">
                    {place.place_name}
                  </h4>
                  <p className="text-xs text-gray-500 truncate">
                    {place.road_address_name || place.address_name}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 지도 */}
        <div className="flex-1 relative">
          <Map
            center={mapCenter}
            style={{ width: "100%", height: "100%" }}
            level={3}
          >
            {markers.map((place) => (
              <MapMarker
                key={place.id}
                position={{
                  lat: parseFloat(place.y),
                  lng: parseFloat(place.x),
                }}
                onClick={() => onSelect(place)}
              >
                {/* 마커 위에 마우스 올리면 이름 표시 (선택 사항) */}
                <div style={{ padding: "5px", color: "#000" }}>
                  {place.place_name}
                </div>
              </MapMarker>
            ))}
          </Map>

          {/* 모바일용 결과 목록 오버레이 (간소화) */}
          <div className="md:hidden absolute bottom-0 left-0 right-0 bg-white p-2 max-h-40 overflow-y-auto border-t z-20 opacity-90">
            {places.length > 0 && (
              <p className="text-xs text-center text-gray-500 mb-2">
                {places.length}개의 결과를 찾았습니다. 마커를 클릭하세요.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
