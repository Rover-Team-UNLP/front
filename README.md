# Front – Control del rover por WebSocket

Interfaz web para controlar el rover ESP32 por WebSocket: pad de flechas en pantalla y teclas W/A/S/D o flechas del teclado.

## Qué hace

- Pantalla con **pad de flechas** (adelante, atrás, izquierda, derecha) y campo para la URL del servidor WebSocket.
- Conexión al **backend** (servidor que hace de puente con la ESP).
- Indicadores de estado: **conectado al servidor** y **ESP conectada** (cuando la ESP o el simulador están conectados al backend).
- **Historial de comandos** enviados y su estado (enviado, ack, error).
- Control por **teclado**: W/A/S/D o flechas (igual que las flechas del pad).

## Cómo usarlo

**Requisitos:** Node.js, pnpm (o npm).

```bash
cd front
pnpm install
pnpm dev
```

Abre en el navegador la URL que indique la terminal (por ejemplo `http://localhost:3000`).

Para producción: `pnpm build` y luego `pnpm start`.

## Dependencia del backend

El backend debe estar corriendo antes de usar el front. La URL por defecto del WebSocket es `ws://localhost:8080/ws`. Puedes cambiarla en la pantalla (campo de texto junto al botón Conectar) si el servidor está en otra máquina (por ejemplo `ws://192.168.1.100:8080/ws`).

## Uso básico

1. Arrancar el backend (desde la carpeta `backend/`: `python main.py`).
2. Arrancar el front (`pnpm dev`) y abrir la URL en el navegador.
3. Pulsar **Conectar** para conectarse al servidor.
4. Si hay una ESP (o el simulador ESP) conectada al backend, aparecerá "ESP conectada".
5. Usar las **flechas del pad** o las teclas **W/A/S/D** (o flechas del teclado) para enviar comandos al rover.
6. El historial de comandos se muestra debajo; cada comando pasa a "ack" cuando el servidor lo reenvía correctamente a la ESP.
