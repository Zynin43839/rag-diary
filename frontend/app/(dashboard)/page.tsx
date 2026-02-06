import AIButton from "@/components/diary/AIButton";
import DiaryForm from "@/components/diary/diaryForm";


export default function Home() {
  return (
    <main className="max-w-2xl mx-auto p-8 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-8 text-center text-blue-900">RAG-DIARY</h1>
        <DiaryForm />
        {/* <AIButton /> */}
    </main>
  );
}
