import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SmartRoute – Intelligent Navigation',
  description:
    'Get smarter routes based on real-time traffic, road types, and your travel preferences. Powered by Google Maps and AI scoring.',
  keywords: ['navigation', 'routes', 'traffic', 'maps', 'directions', 'smart route', 'bike route'],
  authors: [{ name: 'SmartRoute' }],
  openGraph: {
    title:       'SmartRoute – Intelligent Navigation',
    description: 'Find the smartest route based on traffic, road type, and your preferences.',
    type:        'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
