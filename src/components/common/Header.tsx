"use client";

import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();

  useEffect(() => {
    // 세션 초기화 및 변경 감지
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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
            <span className="text-sm text-gray-600">
              {session.user.email}님
            </span>
            <Link href="/notes" className="hover:text-blue-600">
              내 노트
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
