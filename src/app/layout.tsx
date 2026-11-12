import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sitecore Developer Toolkit',
  description: 'Project health, component diagnostics and GraphQL validation for Sitecore Content SDK projects.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <div className="wrap topbar-inner">
            <Link href="/" className="brand">
              <span className="brand-mark" aria-hidden>
                ◆
              </span>
              Sitecore Developer Toolkit
            </Link>
            <nav aria-label="Main">
              <Link href="/">Health</Link>
              <Link href="/components">Components</Link>
              <Link href="/graphql">GraphQL</Link>
            </nav>
          </div>
        </header>
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
