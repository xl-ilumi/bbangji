export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-6">
      <h1 className="text-4xl font-bold text-gray-800">환영합니다! 👋</h1>
      <p className="text-xl text-gray-600 text-center max-w-lg">
        Supabase와 Next.js로 구축된
        <br />
        나만의 노트 앱을 시작해보세요.
      </p>
    </div>
  );
}
