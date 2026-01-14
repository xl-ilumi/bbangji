"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

interface NoteFormProps {
  initialData?: {
    id: number;
    title: string;
    content: string | null;
    image_url: string | null;
  };
}

export default function NoteForm({ initialData }: NoteFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData?.image_url || null,
  );
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const uploadImage = async (file: File) => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const { error } = await supabase.storage
        .from("bakery-images")
        .upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage
        .from("bakery-images")
        .getPublicUrl(fileName);
      return data.publicUrl;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert("로그인이 필요합니다.");
        return;
      }

      let imageUrl = initialData?.image_url || null;
      if (file) {
        const url = await uploadImage(file);
        if (url) imageUrl = url;
      }

      const payload = { title, content, image_url: imageUrl, user_id: user.id };

      if (initialData) {
        // 수정 (Update)
        const { error } = await supabase
          .from("notes")
          .update(payload)
          .eq("id", initialData.id);
        if (error) throw error;
        alert("수정되었습니다!");
        router.push(`/notes/${initialData.id}`); // 상세 페이지로 이동
      } else {
        // 작성 (Insert)
        const { error } = await supabase.from("notes").insert(payload);
        if (error) throw error;
        alert("저장되었습니다!");
        router.push("/notes"); // 목록으로 이동
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-md border border-orange-100"
    >
      <div className="mb-4">
        <label
          htmlFor="title"
          className="block text-sm font-bold text-orange-800 mb-2"
        >
          빵집 이름
        </label>
        <input
          id="title"
          className="w-full p-3 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 성심당"
          required
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="content"
          className="block text-sm font-bold text-orange-800 mb-2"
        >
          후기 내용
        </label>
        <textarea
          id="content"
          className="w-full p-3 border border-orange-200 rounded-lg h-40 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="맛은 어땠나요?"
        />
      </div>

      <div className="mb-6">
        <label
          htmlFor="image"
          className="block text-sm font-bold text-orange-800 mb-2"
        >
          사진 첨부
        </label>
        <input
          id="image"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
        />
        {previewUrl && (
          <div className="relative w-full h-64 mt-4 rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={previewUrl}
              fill
              alt="preview"
              className="object-cover"
            />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 px-4 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition disabled:bg-orange-300"
        >
          {loading ? "저장 중..." : initialData ? "수정 완료" : "기록하기"}
        </button>
      </div>
    </form>
  );
}
