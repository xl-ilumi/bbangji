"use client";

import { Map as KakaoMap, MapMarker } from "react-kakao-maps-sdk";

interface Props {
  lat: number;
  lng: number;
}

export default function MiniMap({ lat, lng }: Props) {
  return (
    <KakaoMap
      center={{ lat, lng }}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "300px",
        borderRadius: "0.75rem",
      }}
      level={4}
      draggable={false} // 상세 페이지에서는 지도 이동 막기 (선택)
      zoomable={false}
    >
      <MapMarker position={{ lat, lng }} />
    </KakaoMap>
  );
}
