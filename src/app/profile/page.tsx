"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // 1. 프로필 정보 가져오기
  useEffect(() => {
    const getProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }
        setEmail(user.email || "");

        const { data, error } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching profile:", error);
        }

        if (data) {
          setUsername(data.username || "");
          setAvatarUrl(data.avatar_url);
          setPreviewUrl(data.avatar_url);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [router]);

  // 2. 이미지 업로드 헬퍼 함수
  const uploadAvatar = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return data.publicUrl;
  };

  // 3. 프로필 업데이트
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      let newAvatarUrl = avatarUrl;

      if (file) {
        newAvatarUrl = await uploadAvatar(file);
      }

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        username,
        avatar_url: newAvatarUrl,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      alert("프로필이 업데이트되었습니다!");
      setAvatarUrl(newAvatarUrl);
      setFile(null);
      router.refresh(); // 서버 데이터 갱신
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("업데이트 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  if (loading) return <div className="p-8 text-center">로딩 중...</div>;

  return (
    <div className="max-w-md mx-auto p-4 pt-10">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
        내 프로필 설정
      </h1>

      <form
        onSubmit={handleUpdateProfile}
        className="bg-white p-6 rounded-xl shadow-md border border-gray-100"
      >
        {/* 프로필 이미지 */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-24 h-24 mb-3 rounded-full overflow-hidden bg-gray-100 border-2 border-orange-100">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Avatar"
                fill
                style={{ objectFit: "cover" }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
                👤
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-sm font-bold text-gray-700 mb-1"
          >
            이메일
          </label>
          <input
            id="email"
            type="text"
            value={email}
            disabled
            className="w-full p-2 border rounded bg-gray-100 text-gray-500"
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="username"
            className="block text-sm font-bold text-gray-700 mb-1"
          >
            닉네임
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="닉네임을 입력하세요"
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 text-white font-bold p-3 rounded-lg hover:bg-orange-600 transition disabled:bg-orange-300"
        >
          {loading ? "저장 중..." : "저장하기"}
        </button>
      </form>
    </div>
  );
}
