"use client";

import { useState } from "react";

interface Props {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: Props) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(input);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md mx-auto mb-8 flex gap-2"
    >
      <input
        type="text"
        placeholder="빵집 이름이나 후기를 검색해보세요 🥐"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="flex-1 p-3 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-sm"
      />
      <button
        type="submit"
        className="px-6 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition shadow-sm whitespace-nowrap"
      >
        검색
      </button>
    </form>
  );
}
