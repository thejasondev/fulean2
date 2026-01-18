<p align="center">
  <img src="public/icons/icon-192.png" alt="Fulean2 Logo" width="120" />
</p>

<h1 align="center">Fulean2</h1>

<p align="center">
  <strong>💵 Contador de Efectivo & Conversor de Divisas para Cuba</strong>
</p>

<p align="center">
  <a href="#características">Características</a> •
  <a href="#tecnologías">Tecnologías</a> •
  <a href="#instalación">Instalación</a> •
  <a href="#uso">Uso</a> •
  <a href="#licencia">Licencia</a>
</p>

---

## 📱 Vista Previa

Una aplicación web progresiva (PWA) diseñada para cambistas y comerciantes en Cuba. Optimizada para uso móvil bajo el sol directo con modo Sunlight de alto contraste.

## ✨ Características

### 💰 Contador de Billetes

- Cuenta rápida de billetes CUP por denominación
- Desglose inteligente con algoritmo DP (sin sobrantes)
- Visualización instantánea del total

### 📊 Gestión de Divisas

- **6 Monedas soportadas**: USD, EUR, CAD, MLC, ZELLE, CLASICA
- Tasas en tiempo real desde [El Toque](https://eltoque.com)
- Tasas manuales para monedas no cubiertas por API

### 🔄 Operaciones

- **Compra/Venta**: Registro con tracking de inventario FIFO
- **Cambio**: Intercambio entre divisas con costo base derivado
- **Historial**: Registro completo de transacciones

### 📈 Reportes Profesionales

- Portafolio con valorización en tiempo real
- Análisis de ganancias realizadas vs no realizadas
- Tendencias de tasas con regresión lineal
- Simulador de ventas

### 🌞 Modo Sunlight

Tema de alto contraste optimizado para uso exterior bajo luz solar directa.

---

## 🛠️ Tecnologías

| Categoría     | Stack                                                  |
| ------------- | ------------------------------------------------------ |
| **Framework** | [Astro](https://astro.build) + React                   |
| **Estado**    | [Nanostores](https://github.com/nanostores/nanostores) |
| **Estilos**   | Tailwind CSS v4                                        |
| **UI**        | Lucide React Icons                                     |
| **PWA**       | Service Worker + Manifest                              |
| **API**       | El Toque (tasas de cambio)                             |

---

## 🚀 Instalación

```bash
# Clonar repositorio
git clone https://github.com/tuusuario/fulean2.git
cd fulean2

# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev
```

La aplicación estará disponible en `https://fulean2.vercel.app`

---

## 📦 Comandos

| Comando        | Descripción              |
| -------------- | ------------------------ |
| `pnpm dev`     | Servidor de desarrollo   |
| `pnpm build`   | Compilar para producción |
| `pnpm preview` | Previsualizar build      |

---

## 📁 Estructura del Proyecto

```
fulean2/
├── public/              # Assets estáticos, iconos PWA
├── src/
│   ├── components/
│   │   ├── ui/          # Componentes base (Button, Input, Modal)
│   │   ├── widgets/     # Componentes de negocio
│   │   └── providers/   # Context providers
│   ├── stores/          # Estado global (Nanostores)
│   ├── lib/             # Utilidades, constantes, algoritmos
│   ├── styles/          # CSS global y temas
│   ├── layouts/         # Layouts Astro
│   └── pages/           # Rutas
└── package.json
```

---

## 📄 Licencia

MIT © 2026

---

<p align="center">
  Hecho por @thejasondev para la comunidad cubana
</p>
