import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'YT Music Autopilot',
  description: 'Automated YouTube music channel - Generate songs, create videos, and upload to YouTube',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0a] text-white antialiased">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/10 bg-black/50 backdrop-blur-xl">
            <div className="flex h-full flex-col">
              {/* Logo */}
              <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-purple-600" />
                <span className="text-lg font-bold">YT Autopilot</span>
              </div>

              {/* Navigation */}
              <nav className="flex-1 space-y-1 p-4">
                <a
                  href="/"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard
                </a>
                <a
                  href="/generate"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Generate Song
                </a>
                <a
                  href="/history"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  History
                </a>
                <a
                  href="/settings"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </a>
              </nav>

              {/* YouTube Connection Status */}
              <div className="border-t border-white/10 p-4">
                <div className="rounded-lg bg-white/5 p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    <span className="text-white/70">YouTube: Not Connected</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="ml-64 flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
