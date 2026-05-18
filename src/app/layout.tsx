import type { Metadata } from "next"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

export const metadata: Metadata = {
  title: "神隊友總部",
  description: "IG/FB-style wall · 信宏 + AI agents · 神隊友的協作空間",
  manifest: "/site.webmanifest",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <TooltipProvider delayDuration={120}>
          {children}
        </TooltipProvider>
      </body>
    </html>
  )
}
