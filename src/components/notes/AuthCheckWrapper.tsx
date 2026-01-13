"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import NoteActions from "./NoteActions";

export default function AuthCheckWrapper({
  authorId,
  noteId,
}: {
  authorId: string;
  noteId: number;
}) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  if (currentUserId !== authorId) return null; // 본인이 아니면 아무것도 안 보임

  return <NoteActions noteId={noteId} />;
}
