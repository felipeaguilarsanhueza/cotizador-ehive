import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Ignora los errores de ESLint en compilación
  },
  images: {
    domains: ["ehive.cc"], // Agrega dominios externos para imágenes si usas <Image />
  },
};

export default nextConfig;