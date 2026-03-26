# Proceso 5 — Agente Registrado (Registered Agent)

## Descripción
El Agente Registrado es un requisito legal para toda LLC o Corporación en Florida. Es la persona o empresa que recibe documentos legales oficiales (demandas, notificaciones del Estado) en nombre del negocio.

## Opciones que ofrecemos al cliente

### Opción A — Usar nuestro servicio (recomendado)
- Primer año gratis con el paquete Standard o Premium
- El cliente no necesita tener una dirección física en Florida
- Nosotros recibimos los documentos y los notificamos al cliente
- A partir del segundo año: tarifa anual (por definir)

### Opción B — Cliente usa su propio agente
- El cliente provee nombre y dirección de su agente registrado
- Debe ser una dirección física en Florida (no PO Box)
- El agente debe estar disponible durante horario comercial

## Requisitos legales del Agente Registrado en Florida
- Debe tener dirección física en Florida (no P.O. Box)
- Debe estar disponible de 9am a 5pm, lunes a viernes
- Puede ser: una persona física residente en Florida, o una empresa autorizada para ser agente registrado

## Datos que guardamos en la orden
El campo `businessAddress` en el modelo Order puede almacenar la dirección del agente registrado cuando el cliente usa uno propio.

## Impacto en el formulario
- El formulario pregunta: "¿Quieres usar nuestro Agente Registrado?"
- Si dice Sí → usamos nuestra dirección (primer año gratis en Standard/Premium)
- Si dice No → el cliente ingresa los datos de su agente

## Impacto en los paquetes
| Paquete | Agente Registrado |
|---------|------------------|
| Basic ($49) | No incluido — add-on disponible |
| Standard ($149) | Primer año gratis ✓ |
| Premium ($249) | Primer año gratis ✓ |

## Archivos clave
- `backend/prisma/schema.prisma` — campo `businessAddress` en modelo Order
- `backend/public/mybusinessformation.html` — opción de agente registrado en formulario (no modificar)

## TODO futuro
- [ ] Definir dirección oficial para usar como agente registrado
- [ ] Definir precio para años subsecuentes (renovación anual)
- [ ] Crear proceso de notificación cuando llegan documentos legales para un cliente
