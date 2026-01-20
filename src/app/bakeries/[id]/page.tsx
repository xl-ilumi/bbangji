import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import MiniMap from "@/components/bakeries/MiniMap";
import type { Database } from "@/types/supabase";

// 서버 사이드 렌더링을 위한 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BakeryDetailPage(props: Props) {
  const params = await props.params;
  const bakeryId = Number(params.id);

  // 1. 빵집 정보 가져오기
  const { data: bakery, error } = await supabase
    .from("bakeries")
    .select("*")
    .eq("id", bakeryId)
    .single();

  if (error || !bakery) {
    return notFound();
  }

  // 2. 이 빵집에 대한 후기 가져오기 (이름 기준 매칭)
  // 추후 bakery_id로 정확히 매칭하도록 고도화 가능
  const { data: reviews } = await supabase
    .from("notes")
    .select("*, profiles(username, avatar_url)")
    .ilike("title", `%${bakery.name}%`) // 빵집 이름이 제목에 포함된 후기 검색
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen bg-white">
      {/* 상단 네비게이션 */}
      <div className="mb-6">
        <Link
          href="/map"
          className="text-gray-500 hover:text-orange-600 text-sm"
        >
          ← 대동빵지도 돌아가기
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* 왼쪽: 빵집 정보 및 지도 */}
        <div>
          <div className="relative w-full h-64 rounded-xl overflow-hidden mb-6 bg-orange-50 border border-orange-100">
            {bakery.image_url ? (
              <Image
                src={bakery.image_url}
                alt={bakery.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">
                🏪
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {bakery.name}
          </h1>
          <p className="text-gray-600 mb-4">{bakery.address}</p>

          <div className="flex gap-2 mb-6">
            {bakery.category?.map((cat) => (
              <span
                key={cat}
                className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium"
              >
                {cat}
              </span>
            ))}
          </div>

          <Link
            href={`/notes/create?bakery_name=${encodeURIComponent(bakery.name)}`}
            className="block w-full text-center bg-orange-600 text-white font-bold py-3 rounded-xl hover:bg-orange-700 transition"
          >
            ✏️ 이 빵집 후기 남기기
          </Link>
        </div>

        {/* 오른쪽: 지도 (클라이언트 컴포넌트로 분리 권장되나, 간단히 iframe 대체 혹은 MiniMap 컴포넌트 사용) */}
        {/* 여기서는 카카오맵 스크립트 로딩 문제 회피를 위해 간단한 안내 문구로 대체하거나 
            별도 MiniMap 컴포넌트를 만들어 넣습니다. (Step 1-1 참고) */}
        <div className="h-full min-h-[300px] bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
          <MiniMap lat={bakery.lat ?? 0} lng={bakery.lng ?? 0} />
        </div>
      </div>

      {/* 하단: 관련 후기 목록 */}
      <section className="border-t pt-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          🥐 다녀온 사람들의 후기 ({reviews?.length || 0})
        </h2>

        {reviews && reviews.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.map((review) => (
              <Link
                key={review.id}
                href={`/notes/${review.id}`}
                className="block"
              >
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-orange-200 hover:shadow-md transition flex gap-4">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {review.image_url ? (
                      <Image
                        src={review.image_url}
                        alt={review.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">
                        🍞
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-gray-900 truncate mb-1">
                      {review.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                      {review.content}
                    </p>
                    <div className="flex items-center text-xs text-gray-400">
                      {/* @ts-ignore */}
                      <span className="mr-2">
                        {review.profiles?.username || "익명"}
                      </span>
                      <span>
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-xl text-gray-500">
            아직 작성된 후기가 없습니다.
            <br />첫 번째 후기를 남겨보세요!
          </div>
        )}
      </section>
    </div>
  );
}
