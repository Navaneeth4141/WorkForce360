import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/AuthContext.js';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'WorkForce360 Portal',
  description: 'Automated workforce, payroll, and client invoice management system.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
