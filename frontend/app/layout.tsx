import type { Metadata } from "next";
import { Caveat, Fraunces, Fredoka, Mali, Noto_Sans_Thai, Nunito, Roboto_Mono, Taviraj } from "next/font/google";
import "./globals.css";
import Providers from "@/utils/providers";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

// Thai faces (D-15 typography): serif headings, clean body, handwriting accents.
const taviraj = Taviraj({
  variable: "--font-taviraj",
  subsets: ["thai", "latin"],
  weight: ["400", "600"],
});

const notoThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "600"],
});

const mali = Mali({
  variable: "--font-mali",
  subsets: ["thai", "latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "RAG-Diary",
  description: "ไดอารี่ส่วนตัวที่ค้นหาและสนทนากับความทรงจำได้ด้วย AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${fredoka.variable} ${nunito.variable} ${robotoMono.variable} ${fraunces.variable} ${caveat.variable} ${taviraj.variable} ${notoThai.variable} ${mali.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
