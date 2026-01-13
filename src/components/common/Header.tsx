"use client";

import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const [session, setSession] = useState<Session | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();

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
  }, []);

  // 3. ✨ [중요] 실시간 프로필 변경 감지
  useEffect(() => {
    if (!session?.user.id) return;

    const channel = supabase
      .channel("realtime_profile")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${session.user.id}`, // 내 프로필만 감지
        },
        (payload) => {
          // 변경된 닉네임으로 상태 즉시 업데이트
          const newProfile = payload.new as { username: string };
          if (newProfile.username) setUsername(newProfile.username);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .single();
    if (data) setUsername(data.username);
  };

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

            <Link href="/notes" className="hover:text-orange-600">
              빵지순례
            </Link>

            <button
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
