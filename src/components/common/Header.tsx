"use client";

import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const [session, setSession] = useState<Session | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .single();
    if (data) setUsername(data.username);
  }, []);

  useEffect(() => {
    // 1. 초기 세션 및 프로필 로드
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    // 2. 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setUsername(null);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    alert("로그아웃 되었습니다.");
    router.push("/");
    router.refresh();
  };

  return (
    <header className="flex items-center justify-between p-4 border-b bg-white">
      <div className="text-xl font-bold">
        <Link href="/">My App</Link>
      </div>

      <nav className="flex gap-4 items-center">
        {session ? (
          <>
            <Link
              href="/profile"
              className="text-sm font-bold text-gray-700 hover:text-orange-600"
            >
              {username || session.user.email?.split("@")[0]}님
            </Link>

            <Link
              href="/map"
              className="hover:text-orange-600 font-bold text-orange-800"
            >
              🗺️ 대동빵지도
            </Link>

            <Link href="/notes" className="hover:text-orange-600">
              빵지순례
            </Link>

            <Link href="/bakeries/new" className="hover:text-orange-600">
              빵집 등록
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1 text-sm text-red-500 border border-red-200 rounded hover:bg-red-50"
            >
              로그아웃
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            로그인
          </Link>
        )}
      </nav>
    </header>
  );
}
