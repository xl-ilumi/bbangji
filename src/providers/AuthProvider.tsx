"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; // 위에서 만든 클라이언트 import

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [_session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // 1. 초기 세션 가져오기
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // 2. 인증 상태 변경 감지 (로그인, 로그아웃 등)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}
