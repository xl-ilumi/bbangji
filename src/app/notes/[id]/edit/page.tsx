import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import NoteForm from "@/components/notes/NoteForm";
import type { Database } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditNotePage(props: Props) {
  const params = await props.params;
  const noteId = Number(params.id);

  const { data: note } = await supabase
    .from("notes")
    .select("*")
    .eq("id", noteId)
    .single();

  if (!note) notFound();

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center text-orange-900">
        ✏️ 기록 수정하기
      </h1>
      <Suspense
        fallback={
          <div className="text-center p-10 text-orange-800">로딩 중... 🥐</div>
        }
      >
        <NoteForm initialData={note} />
      </Suspense>
    </div>
  );
}
