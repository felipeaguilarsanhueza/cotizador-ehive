import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Fuerza runtime Node (para usar nodemailer)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { from, to, subject, data } = await request.json();

    const {
      region,
      comuna,
      direccion,
      tablero,
      distancia,
      serviciosSeleccionados,
      selectedVehicle,
      selectedConnectors, // <-- Ahora se recibe el array de conectores
      cliente,
      file,
    } = data || {};

    const { nombre, telefono, correo } = cliente || {};

    // Crea el HTML, incluyendo los conectores
    const htmlBody = `
      <h2>Solicitud de Cotización</h2>
      <ul>
        <li><strong>Nombre:</strong> ${nombre || ""}</li>
        <li><strong>Teléfono:</strong> ${telefono || ""}</li>
        <li><strong>Correo:</strong> ${correo || ""}</li>
        <li><strong>Región:</strong> ${region || ""}</li>
        <li><strong>Comuna:</strong> ${comuna || ""}</li>
        <li><strong>Dirección:</strong> ${direccion || ""}</li>
        <li><strong>Tablero:</strong> ${tablero || ""}</li>
        <li><strong>Distancia:</strong> ${distancia || ""}</li>
        <li><strong>Servicios:</strong> ${
          serviciosSeleccionados?.join(", ") || "Ninguno"
        }</li>
        <li><strong>Vehículo:</strong> ${selectedVehicle || "No especificado"}</li>
        <li><strong>Conectores:</strong> ${
          selectedConnectors?.join(", ") || "Ninguno"
        }</li>
      </ul>
    `;

    // Preparamos adjuntos si hay archivo
    let attachments = [];
    if (file) {
      const base64Content = file.split(",")[1]; // parte después de "data:...base64,"
      attachments = [
        {
          filename: "boleta_luz.png", // o .jpg, .pdf, etc.
          content: base64Content,
          encoding: "base64",
        },
      ];
    }

    // Configuramos nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.MAILGUN_HOST,
      port: Number(process.env.MAILGUN_PORT),
      auth: {
        user: process.env.MAILGUN_USER,
        pass: process.env.MAILGUN_PASSWORD,
      },
    });

    // Enviamos el correo
    await transporter.sendMail({
      from,
      to,
      subject,
      html: htmlBody,
      attachments,
    });

    return NextResponse.json(
      { ok: true, message: "Correo enviado correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al enviar correo:", error);
    return NextResponse.json(
      { error: "Error al enviar correo" },
      { status: 500 }
    );
  }
}
