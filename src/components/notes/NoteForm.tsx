"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type Bakery = Database["public"]["Tables"]["bakeries"]["Row"];

interface NoteFormProps {
  initialData?: {
    id: number;
    title: string;
    content: string | null;
    image_url: string | null;
    bakery_id: number | null; // 추가됨
  };
}

export default function NoteForm({ initialData }: NoteFormProps) {
  // 폼 상태
  const [content, setContent] = useState(initialData?.content || "");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData?.image_url || null,
  );
  const [loading, setLoading] = useState(false);

  // 빵집 검색 상태
  const [searchTerm, setSearchTerm] = useState(initialData?.title || ""); // 초기값은 기존 제목
  const [searchResults, setSearchResults] = useState<Bakery[]>([]);
  const [selectedBakery, setSelectedBakery] = useState<Bakery | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2. 빵집 검색 함수
  const searchBakery = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setIsSearching(true);
    const { data } = await supabase
      .from("bakeries")
      .select("*")
      .ilike("name", `%${query}%`)
      .limit(5);

    setSearchResults(data || []);
    setIsSearching(false);
    setShowDropdown(true);
  }, []);

  // 1. 초기 진입 시 URL 파라미터나 초기 데이터 처리
  useEffect(() => {
    const initForm = async () => {
      // 수정 모드: 이미 연결된 빵집이 있다면 정보 가져오기
      if (initialData?.bakery_id) {
        const { data } = await supabase
          .from("bakeries")
          .select("*")
          .eq("id", initialData.bakery_id)
          .single();
        if (data) {
          setSelectedBakery(data);
          setSearchTerm(data.name);
        }
      }
      // 작성 모드: URL에 빵집 이름이 있으면 자동 검색 (빵집 등록 후 돌아왔을 때)
      else {
        const paramName = searchParams.get("bakery_name");
        if (paramName) {
          setSearchTerm(paramName);
          searchBakery(paramName);
        }
      }
    };
    initForm();
  }, [initialData, searchParams, searchBakery]);

  // 검색어 입력 핸들러 (디바운스 적용 권장하지만 여기선 간단히 구현)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedBakery(null); // 입력 값이 바뀌면 선택 해제
    searchBakery(value);
  };

  // 빵집 선택 핸들러
  const handleSelectBakery = (bakery: Bakery) => {
    setSelectedBakery(bakery);
    setSearchTerm(bakery.name);
    setShowDropdown(false);
  };

  // 이미지 업로드 (기존 동일)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
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

  // 저장 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사: 빵집이 선택되지 않았으면 경고
    if (!selectedBakery) {
      alert("목록에서 빵집을 선택하거나, 먼저 빵집을 등록해주세요! 🏪");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return alert("로그인이 필요합니다.");

      let imageUrl = initialData?.image_url || null;
      if (file) {
        const url = await uploadImage(file);
        if (url) imageUrl = url;
      }

      const payload = {
        title: selectedBakery.name, // 제목은 빵집 이름으로 자동 설정
        content,
        image_url: imageUrl,
        user_id: user.id,
        bakery_id: selectedBakery.id, // ✨ 연결된 빵집 ID 저장
      };

      if (initialData) {
        const { error } = await supabase
          .from("notes")
          .update(payload)
          .eq("id", initialData.id);
        if (error) throw error;
        alert("수정되었습니다!");
        router.push(`/notes/${initialData.id}`);
      } else {
        const { error } = await supabase.from("notes").insert(payload);
        if (error) throw error;
        alert("저장되었습니다!");
        router.push("/notes");
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
      {/* 빵집 검색 영역 */}
      <div className="mb-6 relative">
        <label
          htmlFor="bakery-search"
          className="block text-sm font-bold text-orange-800 mb-2"
        >
          어떤 빵집을 다녀오셨나요?
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              id="bakery-search"
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 ${selectedBakery ? "border-green-500 bg-green-50" : "border-orange-200"}`}
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => {
                if (searchTerm) setShowDropdown(true);
              }}
              placeholder="빵집 이름을 검색하세요 (예: 성심당)"
              required
            />
            {selectedBakery && (
              <span className="absolute right-3 top-3 text-green-600 text-sm font-bold">
                ✓ 선택됨
              </span>
            )}
          </div>
        </div>

        {/* 검색 결과 드롭다운 */}
        {showDropdown && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {isSearching ? (
              <div className="p-3 text-gray-400 text-sm">검색 중...</div>
            ) : searchResults.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {searchResults.map((bakery) => (
                  <button
                    type="button"
                    key={bakery.id}
                    onClick={() => handleSelectBakery(bakery)}
                    className="w-full text-left p-3 hover:bg-orange-50 cursor-pointer transition"
                  >
                    <div className="font-bold text-gray-800">{bakery.name}</div>
                    <div className="text-xs text-gray-500">
                      {bakery.address}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-500 mb-2">
                  검색 결과가 없습니다 😢
                </p>
                <Link
                  href="/bakeries/new"
                  className="inline-block text-xs bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full hover:bg-orange-200 transition"
                >
                  + 새 빵집 등록하러 가기
                </Link>
              </div>
            )}
          </div>
        )}
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
          placeholder="맛있는 빵 추천이나 분위기를 적어주세요!"
        />
      </div>

      <div className="mb-6">
        <label
          htmlFor="image-upload"
          className="block text-sm font-bold text-orange-800 mb-2"
        >
          사진 첨부
        </label>
        <input
          id="image-upload"
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
