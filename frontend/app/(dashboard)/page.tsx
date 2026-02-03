import Image from "next/image";
import { api } from '@/lib/api'
import DiaryForm from "@/components/diaryCard";

export default function Home() {
  const fetchNotes = async () => {
    const data = await api.notes.get()
    console.log(data)
  }
  return (
    <>
    <DiaryForm />
    </>
  );
}
