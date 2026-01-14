import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AuthCheckWrapper from "@/components/notes/AuthCheckWrapper";
import CommentSection from "@/components/notes/CommentSection";
import LikeButton from "@/components/notes/LikeButton";
import type { Database } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>; // params 타입을 Promise로 변경
}

export default async function NoteDetailPage(props: Props) {
  const params = await props.params; // await로 params 언래핑
  const noteId = Number(params.id);

  // 1. 노트 데이터 조회
  const { data: note, error } = await supabase
    .from("notes")
    .select("*, profiles(username, avatar_url)")
    .eq("id", noteId)
    .single();

  if (error || !note) notFound();

  // 2. 조회수 증가
  supabase.rpc("increment_view_count", { row_id: noteId });

  // 3. 렌더링
  return (
    <div className="max-w-3xl mx-auto p-4 min-h-screen bg-white">
      <div className="mb-6 flex justify-between items-center">
        <Link
          href="/notes"
          className="text-gray-500 hover:text-orange-600 text-sm"
        >
          ← 목록으로 돌아가기
        </Link>

        {/* 본인 확인 및 수정/삭제 버튼 노출 */}
        <AuthCheckWrapper authorId={note.user_id} noteId={note.id} />
      </div>

      <article>
        <header className="mb-8 border-b pb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {note.title}
          </h1>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                {/* @ts-ignore */}
                {note.profiles?.avatar_url ? (
                  <Image /* @ts-ignore */
                    src={note.profiles.avatar_url}
                    alt="avatar"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">
                    👤
                  </div>
                )}
              </div>
              <div>
                {/* @ts-ignore */}
                <p className="font-bold text-sm text-gray-800">
                  {note.profiles?.username || "알 수 없음"}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(note.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LikeButton noteId={note.id} />
              <div className="text-sm text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                조회수 {note.view_count}
              </div>
            </div>
          </div>
        </header>

        {note.image_url && (
          <div className="relative w-full aspect-video mb-8 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm">
            <Image
              src={note.image_url}
              alt={note.title}
              fill
              className="object-contain"
            />
          </div>
        )}

        <div className="prose prose-lg max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">
          {note.content}
        </div>

        <CommentSection noteId={noteId} />
      </article>
    </div>
  );
}
