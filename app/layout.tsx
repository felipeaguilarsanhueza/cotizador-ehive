// app/layout.tsx
import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'Cotizador online infraestructura de carga de vehiculos electricos',
  description: 'Cotiza tu instalacion aca',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen w-full bg-ruuf-gray-50 text-gray-700">
        {/* Navbar superior */}
        <nav className="sticky top-0 z-15 w-full bg-white border-b border-gray-100 flex justify-center items-center h-20 px-6 sm:px-10">
          {/* Logo */}
          <div className="flex items-center justify-center h-full">
            <img
              src="https://ehive.cc/web/image/website/3/logo/Ehive?unique=46d9d13?text=LOGO"
              alt="logo"
              className="h-12 w-auto"
            />
          </div>
        </nav>

        {children}
      </body>
    </html>
  )
}
