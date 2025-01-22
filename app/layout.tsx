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
        <nav className="sticky top-0 z-15 w-full h-35 bg-white border-b border-gray-100 flex items-center px-16 sm:px-22">
          {/* Logo (placeholder) */}
          <div className="w-46">
            <img
              src="https://ehive.cc/web/image/website/3/logo/Ehive?unique=46d9d13?text=LOGO"
              alt="logo"
              className="h-16 w-auto"
            />
          </div>
          {/* (Podrías alinear a la derecha otros botones si gustas) */}
        </nav>

        {/* Aquí van las páginas hijas */}
        {children}
      </body>
    </html>
  )
}
