import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "LifeOS · Goals, Savings & Smart Shopping Planner",
  description:
    "Your personal life-assistant. Track goals, plan purchases, compare prices, build savings, and chat with Chloe — your growing AI companion.",
};

const themeScript = `(function(){try{var t=localStorage.getItem('lg_theme');if(!t)t='dark';document.documentElement.setAttribute('data-theme',t);var a=localStorage.getItem('lg_accent');if(a)document.documentElement.style.setProperty('--accent',a);}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <div id="root">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
