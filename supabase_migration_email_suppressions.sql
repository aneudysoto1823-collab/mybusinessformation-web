-- Lista de supresión global de email marketing (auditoría 2026-09-13/14,
-- punto bloqueante #1: "no hay manera de reaccionar a un correo rebotado o
-- marcado como spam"). Alimentada por el webhook de Resend
-- (app/api/webhooks/resend/route.ts) en los eventos email.bounced y
-- email.complained.
--
-- Es la fuente de verdad PERSISTENTE, separada de prospective_companies.unsubscribed
-- y Order.unsubscribed (que igual se actualizan en el mismo momento, para que
-- la protección sea inmediata en todo lo que ya consulta esos flags) — así
-- que si el mismo email vuelve a aparecer más adelante en una fila NUEVA
-- (ej. Enformion lo encuentra de nuevo para otra LLC), la corrida que arma
-- esa fila nueva puede seguir consultando esta tabla y bloquear el envío
-- igual, sin depender de que alguien haya copiado el flag a la fila correcta.

CREATE TABLE IF NOT EXISTS email_suppressions (
  email TEXT PRIMARY KEY,
  reason TEXT NOT NULL CHECK (reason IN ('bounced', 'complained')),
  detail TEXT,
  resend_email_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
