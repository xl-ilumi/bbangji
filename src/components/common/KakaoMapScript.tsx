"use client";

import Script from "next/script";

const KAKAO_SDK_URL = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&libraries=services,clusterer&autoload=false`;

export default function KakaoMapScript() {
  return (
    <Script
      src={KAKAO_SDK_URL}
      strategy="beforeInteractive"
      onLoad={() => {
        console.log("Kakao Map Script Loaded");
      }}
    />
  );
}
