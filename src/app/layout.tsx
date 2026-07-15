import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { ClerkProvider } from "@clerk/nextjs";
import { zhCN } from "@clerk/localizations";
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
    <ClerkProvider localization={zhCN}>
      <html
        lang="zh-CN"
        className="h-full"
      >
        <body className="min-h-full flex flex-col">
          <Nav></Nav>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
