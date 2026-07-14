import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "English App",
  description: "通过跟 AI 对话，提高你的英语水平",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className="h-full"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
