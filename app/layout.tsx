import './globals.css'
import { Providers } from "@/providers";
import { Analytics } from "@vercel/analytics/react";

export const metadata = {
  title: 'Nexa - AI Agent for Marketing & Content',
  description: 'Automate social media posts, engage with communities, and grow your audience 24/7.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning={true} className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'dark';
                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
