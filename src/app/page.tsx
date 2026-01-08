import { createClient } from "@supabase/supabase-js";

// 1. Supabase 클라이언트 생성 (서버 사이드)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function Home() {
  // 2. DB에서 빵집 데이터 가져오기
  const { data: bakeries, error } = await supabase.from("bakeries").select("*");

  if (error) {
    return <div>에러가 발생했습니다: {error.message}</div>;
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">🍞 빵지순례 시작!</h1>
      <p className="mb-8 text-gray-600">DB 연결 테스트 중입니다.</p>

      <div className="grid gap-4">
        {bakeries?.map((bakery) => (
          <div key={bakery.id} className="border p-4 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold">{bakery.name}</h2>
            <p className="text-gray-500">{bakery.description}</p>
            <div className="mt-2 text-sm text-blue-600">
              {/* 배열로 저장된 카테고리 보여주기 */}
              {bakery.category?.map((cat: string) => (
                <span key={cat} className="mr-2">
                  #{cat}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
