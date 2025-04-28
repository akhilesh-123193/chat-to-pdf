
import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DocuChat AI',
  description: 'Chat with your documents using AI',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
