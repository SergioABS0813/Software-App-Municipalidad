# Frontend structure

Esta organizacion esta pensada para una plataforma web de gestion de eventos culturales y sociales para gobiernos locales.

## Carpetas principales

- `src/app`: entrada de la aplicacion React, rutas, providers globales y configuracion de alto nivel.
- `src/assets`: imagenes, iconos, fuentes y otros recursos estaticos importados desde React.
- `src/components`: componentes reutilizables que no pertenecen a un modulo de negocio especifico.
- `src/features`: modulos funcionales de la plataforma. Cada feature agrupa sus pantallas, componentes, hooks y servicios propios.
- `src/hooks`: hooks compartidos por varias features.
- `src/services`: clientes externos o integraciones comunes, por ejemplo API HTTP.
- `src/styles`: estilos globales, variables y utilidades CSS compartidas.
- `src/utils`: funciones puras reutilizables.
- `src/constants`: constantes compartidas por la aplicacion.

## Features iniciales

- `auth`: inicio de sesion, registro, recuperacion y control de roles.
- `dashboard`: vista general para administradores municipales.
- `events`: creacion, edicion, publicacion y listado de eventos.
- `registrations`: inscripciones, control de cupos y asistencia.
- `venues`: locales, espacios o ubicaciones donde ocurren eventos.
- `users`: administradores, organizadores y usuarios ciudadanos.
- `reports`: indicadores, exportaciones y reportes para gestion municipal.
- `public-portal`: experiencia publica para ciudadanos que buscan eventos.

## Convencion sugerida por feature

Cuando una feature crezca, usa esta forma:

```txt
src/features/events/
  components/
  hooks/
  pages/
  services/
  utils/
  index.js
```

La idea es que lo especifico de eventos viva en `features/events`, y solo suba a `components`, `hooks`, `services` o `utils` cuando realmente sea compartido por varias partes.
