import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";

import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gold Composite Momentum Dashboard",
  description:
    "GLD와 IEF의 12개월 합성 모멘텀으로 금 매수 유효 여부와 기간별 시계열을 보여주는 Next.js 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={geistMono.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/static/pretendard.css"
          integrity="sha384-STKhRt1NV3HXjdmg+AShIj4xPalD60MD7yH6ukZ6j92lz4b5f/7O/FB+LFVBipAU"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
