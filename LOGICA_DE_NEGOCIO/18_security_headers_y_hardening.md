## Rate Limiting (Upstash Redis)

**Qué es:** Rate limit = limitar cuántas requests puede hacer una misma IP en X tiempo.

**Para qué sirve:**

- **Límite de 10 órdenes del mismo IP**
- **Anti-spam de bots:** sin rate limit, un bot puede crear 10,000 órdenes 
  basura en 5 min → te ensucia la BD, te quema la cuota gratis de Resend 
  (emails de confirmación), te llena el panel admin.
- **Anti-DDoS básico:** si alguien quiere tumbar tu sitio, no puede mandar 
  1000 requests/segundo.
- **Anti-abuso de Claudia:** Claudia usa API de Anthropic que se paga por 
  request. Sin límite, un atacante manda 5000 mensajes y te quema $$$ de 
  tu cuenta.
- **Protección de Stripe:** evita que alguien automatice intentos de 
  checkout para probar tarjetas robadas.
- **Límite de Claudia 30 mensajes:** max 30 mensajes/hora/IP (un humano 
  hablando normal con Claudia llega a 10-15 en una sesión; 30 da margen).