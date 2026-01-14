import NoteForm from "@/components/notes/NoteForm";

export default function CreateNotePage() {
  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center text-orange-900">
        📝 새 빵지순례 기록
      </h1>
      <NoteForm />
    </div>
  );
}
