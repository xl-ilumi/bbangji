"use client";

import { useEffect, useState } from "react";
import { Map, MapMarker } from "react-kakao-maps-sdk";

export default function MapTestPage() {
  // 로딩 상태 관리 (스크립트 로드 타이밍 이슈 방지)
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (window.kakao && window.kakao.maps) {
      setIsLoaded(true);
    } else {
      // 스크립트가 아직 안 불려왔을 경우를 대비한 폴백
      const interval = setInterval(() => {
        if (window.kakao && window.kakao.maps) {
          setIsLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  if (!isLoaded)
    return <div className="p-10 text-center">지도 불러오는 중...</div>;

  return (
    <div className="w-full h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">🗺️ 카카오맵 연동 테스트</h1>
      <Map
        center={{ lat: 37.5665, lng: 126.978 }} // 서울시청 좌표
        style={{ width: "100%", height: "400px", borderRadius: "12px" }}
        level={3}
      >
        <MapMarker position={{ lat: 37.5665, lng: 126.978 }}>
          <div style={{ padding: "5px", color: "#000" }}>서울시청 빵집?</div>
        </MapMarker>
      </Map>
    </div>
  );
}
