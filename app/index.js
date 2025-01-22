// pages/index.js
import { useState } from 'react';

export default function Home() {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    message: '' 
  });
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Enviando...');
    
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('Correo enviado con éxito.');
        // Limpia el formulario si lo deseas
        setFormData({ name: '', email: '', message: '' });
      } else {
        setStatus(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error al enviar:', error);
      setStatus('Hubo un error al enviar el correo.');
    }
  };

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '1rem' }}>
      <h1>Formulario de Contacto</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        <label>
          Nombre:
          <input 
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            style={{ width: '100%' }}
          />
        </label>

        <label>
          Email:
          <input 
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ width: '100%' }}
          />
        </label>

        <label>
          Mensaje:
          <textarea 
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            style={{ width: '100%', height: '80px' }}
          />
        </label>

        <button type="submit" style={{ padding: '0.5rem 1rem' }}>
          Enviar
        </button>
      </form>

      {status && <p style={{ marginTop: '1rem' }}>{status}</p>}
    </main>
  );
}
