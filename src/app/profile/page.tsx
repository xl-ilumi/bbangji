"use client";

import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type Note = Database["public"]["Tables"]["notes"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // 탭 상태: 'my_notes' | 'liked_notes'
  const [activeTab, setActiveTab] = useState("my_notes");
  const [myNotes, setMyNotes] = useState<Note[]>([]);
  const [likedNotes, setLikedNotes] = useState<Note[]>([]);

  // 프로필 수정 모드 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // 1. 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      // 프로필 가져오기
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);
      setEditUsername(profileData?.username || "");
      setPreviewUrl(profileData?.avatar_url || null);

      // 내가 쓴 글 가져오기
      const { data: myData } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setMyNotes(myData || []);

      // 좋아요한 글 가져오기 (조인 쿼리)
      const { data: likedData } = await supabase
        .from("likes")
        .select("notes(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // likes 배열 안의 notes 객체만 추출
      const formattedLikedNotes =
        (likedData
          ?.map((item) => item.notes as unknown as Note)
          .filter(Boolean) as Note[]) || [];
      setLikedNotes(formattedLikedNotes);

      setLoading(false);
    };
    loadData();
  }, [router]);

  // 2. 프로필 업데이트 로직
  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      let newAvatarUrl = profile?.avatar_url;

      if (editFile) {
        const fileExt = editFile.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, editFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);
        newAvatarUrl = data.publicUrl;
      }

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        username: editUsername,
        avatar_url: newAvatarUrl,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      alert("프로필이 업데이트되었습니다!");
      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("업데이트 실패");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      setEditFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  // ✨ 3. 회원 탈퇴 핸들러 (수정됨)
  const handleWithdrawal = async () => {
    if (
      !confirm(
        "정말로 탈퇴하시겠습니까?\\n탈퇴 시 계정과 모든 활동 내역이 영구적으로 삭제됩니다.",
      )
    )
      return;

    try {
      // RPC(DB 함수)를 호출하여 auth.users 테이블에서 내 계정 삭제
      // (Cascade 설정으로 인해 profiles, notes, likes 등도 자동 삭제됨)
      const { error } = await supabase.rpc("delete_own_user");

      if (error) throw error;

      // 클라이언트 세션 정리
      await supabase.auth.signOut();

      alert("탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다. 🙇‍♂️");
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("탈퇴 처리 중 오류:", error);
      alert("탈퇴 처리에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center text-orange-800">로딩 중... 🥐</div>
    );

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen">
      {/* 1. 프로필 카드 섹션 */}
      <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6 mb-8 flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* 프로필 이미지 */}
        <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-orange-50 border-4 border-white shadow-md flex-shrink-0">
          {isEditing && previewUrl ? (
            <Image
              src={previewUrl}
              alt="Avatar"
              fill
              className="object-cover"
            />
          ) : profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt="Avatar"
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              👤
            </div>
          )}

          {/* 수정 모드일 때 파일 입력 오버레이 */}
          {isEditing && (
            <button
              type="button"
              className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              aria-label="프로필 이미지 변경"
            >
              <span className="text-white text-xs">변경</span>
              <input
                type="file"
                hidden
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
              />
            </button>
          )}
        </div>

        {/* 유저 정보 & 편집 폼 */}
        <div className="flex-1 text-center md:text-left w-full">
          {isEditing ? (
            <div className="space-y-3 max-w-xs mx-auto md:mx-0">
              <input
                className="w-full p-2 border rounded focus:outline-orange-400"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="닉네임"
              />
              <div className="flex gap-2 justify-center md:justify-start">
                <button
                  type="button"
                  onClick={handleUpdateProfile}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600"
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                {profile?.username || "빵순이"}
              </h2>
              <p className="text-gray-500 text-sm mb-4">{user?.email}</p>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs px-3 py-1.5 border border-gray-300 rounded-full hover:bg-gray-50 transition"
              >
                ⚙️ 프로필 설정
              </button>
            </>
          )}
        </div>

        {/* 통계 요약 */}
        <div className="flex gap-6 text-center">
          <div>
            <div className="text-xl font-bold text-orange-600">
              {myNotes.length}
            </div>
            <div className="text-xs text-gray-500">작성한 글</div>
          </div>
          <div>
            <div className="text-xl font-bold text-red-500">
              {likedNotes.length}
            </div>
            <div className="text-xs text-gray-500">좋아요</div>
          </div>
        </div>
      </section>

      {/* 2. 탭 메뉴 */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("my_notes")}
          className={`flex-1 py-3 text-sm font-bold text-center transition border-b-2 ${
            activeTab === "my_notes"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          📝 내가 쓴 빵지순례
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("liked_notes")}
          className={`flex-1 py-3 text-sm font-bold text-center transition border-b-2 ${
            activeTab === "liked_notes"
              ? "border-red-500 text-red-500"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          ❤️ 좋아요한 기록
        </button>
      </div>

      {/* 3. 리스트 영역 (공통 카드 UI) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(activeTab === "my_notes" ? myNotes : likedNotes).map((note) => (
          <Link key={note.id} href={`/notes/${note.id}`} className="block">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-orange-200 hover:shadow-md transition h-full flex flex-col">
              <div className="relative w-full h-40 mb-3 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {note.image_url ? (
                  <Image
                    src={note.image_url}
                    alt={note.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">
                    🍞
                  </div>
                )}
              </div>
              <h3 className="font-bold text-lg mb-1 text-gray-900 truncate">
                {note.title}
              </h3>
              <p className="text-gray-500 text-xs mb-3 flex-grow line-clamp-2">
                {note.content}
              </p>
              <div className="flex justify-between items-center text-xs text-gray-400 border-t pt-2 mt-auto">
                <span>{new Date(note.created_at).toLocaleDateString()}</span>
                {activeTab === "my_notes" && (
                  <span className="text-orange-400">내 기록</span>
                )}
                {activeTab === "liked_notes" && (
                  <span className="text-red-400">❤️ 좋아요</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 데이터 없음 메시지 */}
      {(activeTab === "my_notes" ? myNotes : likedNotes).length === 0 && (
        <div className="text-center py-20 text-gray-400">
          {activeTab === "my_notes"
            ? "아직 작성한 기록이 없습니다 🥖"
            : "좋아요한 기록이 없습니다 💔"}
        </div>
      )}

      {/* ✨ 4. 하단 탈퇴 버튼 영역 */}
      <div className="mt-12 border-t border-gray-200 pt-6 text-right">
        <button
          type="button"
          onClick={handleWithdrawal}
          className="text-xs text-gray-400 hover:text-red-500 underline transition"
        >
          회원 탈퇴하기
        </button>
      </div>
    </div>
  );
}
