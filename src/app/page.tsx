import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import type { Database } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// 매번 새로운 랜덤 추천을 위해 캐시 방지
export const dynamic = "force-dynamic";

export default async function Home() {
  // 1. 조회수(view_count) 기준 상위 10개 가져오기
  const { data: topNotes } = await supabase
    .from("notes")
    .select("*, profiles(username)")
    .order("view_count", { ascending: false }) // 인기순 정렬
    .limit(10);

  // 2. 가져온 10개 중에서 3개를 랜덤으로 뽑기 (Shuffle)
  const recommendedNotes = topNotes
    ? [...topNotes].sort(() => 0.5 - Math.random()).slice(0, 3)
    : [];

  return (
    <div className="min-h-screen bg-white">
      {/* 1. 히어로 섹션 (배너) */}
      <section className="relative bg-[#FFF8E1] py-20 px-4 text-center overflow-hidden">
        <div className="max-w-3xl mx-auto relative z-10">
          <span className="text-orange-600 font-bold tracking-wider uppercase text-sm mb-2 block">
            Bread Diary
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-orange-950 mb-6 leading-tight">
            당신의 빵지순례,
            <br />
            기록으로 남기세요.
          </h1>
          <p className="text-lg text-orange-800 mb-8 max-w-xl mx-auto">
            나만의 인생 빵집을 기록하고
            <br />
            다른 사람들의 인기 빵지순례 코스도 구경해보세요.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/notes"
              className="bg-orange-600 text-white font-bold py-3 px-8 rounded-full hover:bg-orange-700 transition shadow-lg transform hover:-translate-y-1"
            >
              기록 시작하기 🥐
            </Link>
          </div>
        </div>

        {/* 장식용 배경 아이콘 */}
        <div className="absolute top-10 left-10 text-9xl opacity-5 rotate-12 select-none">
          🥖
        </div>
        <div className="absolute bottom-10 right-10 text-9xl opacity-5 -rotate-12 select-none">
          🥯
        </div>
      </section>

      {/* 2. 인기 기록 섹션 */}
      <section className="max-w-6xl mx-auto py-16 px-4">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              지금 핫한 빵지순례 🔥
            </h2>
            <p className="text-gray-500 mt-1">
              조회수가 높은 인기 기록들을 랜덤으로 추천해드려요.
            </p>
          </div>
          <Link
            href="/notes"
            className="text-orange-600 font-semibold hover:underline"
          >
            전체보기 →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendedNotes.map((note) => (
            <Link href={`/notes/${note.id}`} key={note.id}>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group h-full flex flex-col">
                {/* 이미지 영역 */}
                <div className="relative h-48 bg-gray-100 shrink-0">
                  {note.image_url ? (
                    <Image
                      src={note.image_url}
                      alt={note.title}
                      fill
                      className="object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl bg-orange-50">
                      🍞
                    </div>
                  )}
                  {/* 조회수 배지 */}
                  <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                    👀 {note.view_count || 0}
                  </div>
                </div>

                {/* 텍스트 영역 */}
                <div className="p-5 flex flex-col grow">
                  <h3 className="font-bold text-lg text-gray-900 mb-2 truncate">
                    {note.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4 h-10">
                    {note.content}
                  </p>
                  <div className="mt-auto flex items-center justify-between text-xs text-gray-400 border-t pt-3">
                    <span>
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                    <span>by {note.profiles?.username || "익명"}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {recommendedNotes.length === 0 && (
            <div className="col-span-3 text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-500">
              아직 등록된 기록이 없습니다. <br />첫 번째 주인공이 되어보세요!
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
