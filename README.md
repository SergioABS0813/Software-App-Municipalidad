# Plataforma de Gestión de Eventos Municipales

Plataforma web desplegada en Google Cloud para centralizar la publicación,
inscripción, validación de pagos, control de asistencia y generación de
reportes de eventos municipales.

![Vista principal del portal](docs/images/portal-publico.png)

<p align="center">
  <img src="https://img.shields.io/badge/Java-17-blue" alt="Java 17">
  <img src="https://img.shields.io/badge/Spring%20Boot-Backend-green" alt="Spring Boot">
  <img src="https://img.shields.io/badge/React-Frontend-blue" alt="React">
  <img src="https://img.shields.io/badge/Google%20Cloud-Deployment-blue" alt="Google Cloud">
  <img src="https://img.shields.io/badge/Keycloak-IAM-red" alt="Keycloak">
  <img src="https://img.shields.io/badge/Docker-Containers-blue" alt="Docker">
</p>

## Descripción

Las municipalidades difunden actividades mediante distintos canales digitales,
mientras que los procesos de inscripción, validación de pagos, control de
asistencia y elaboración de reportes suelen gestionarse de forma separada o
manual.

Este proyecto implementa una plataforma web que centraliza el ciclo de vida de
los eventos municipales. La solución permite crear y aprobar eventos, publicarlos
en un portal ciudadano, gestionar inscripciones, validar comprobantes de pago,
generar códigos QR, registrar asistencias y consultar reportes operativos.

**El sistema fue desarrollado como proyecto de tesis de Ingeniería de las
Telecomunicaciones y se diseñó tomando como referencia información pública de
las municipalidades de San Miguel, Pueblo Libre y Jesús María, Lima, Perú.**

## Funcionalidades principales

- Gestión del ciclo de vida de eventos: creación, revisión, aprobación,
  publicación, cancelación y finalización.
- Portal público con búsqueda, filtros, detalle de eventos e inscripción ciudadana.
- Inscripciones gratuitas o sujetas a validación de comprobantes de pago.
- Generación y validación de códigos QR para el control de asistencia.
- Registro manual de asistentes por parte del personal operativo.
- Gestión de usuarios y autorización basada en roles.
- Notificaciones internas y envío de correos electrónicos.
- Encuestas de satisfacción y reportes posteriores al evento.

## Flujo principal

![Flujo principal de gestión](docs/images/flujo-principal.png)

## Roles

| Rol | Responsabilidades principales |
|---|---|
| Administrador | Gestiona usuarios, eventos, categorías, ubicaciones y comprobantes de pago. |
| Directivo | Revisa, aprueba, observa o cancela eventos y consulta reportes. |
| Operativo | Controla el ingreso mediante QR, realiza validaciones manuales y registra asistentes. |
| Vecino | Consulta eventos, se inscribe, carga comprobantes y accede a su código QR. |  

## Arquitectura de la solución

![Arquitectura desplegada en Google Cloud](docs/images/arquitectura-gcp.png)

La solución utiliza una arquitectura monolítica modular desplegada sobre
Google Cloud.

El acceso público se realiza a través de Cloudflare y una máquina virtual con
Nginx, encargada de servir la aplicación React y actuar como reverse proxy. El
backend Spring Boot y Keycloak se ejecutan mediante contenedores Docker dentro
de una máquina virtual privada. Las bases de datos MySQL y PostgreSQL se
encuentran en Cloud SQL, mientras que las imágenes, comprobantes y otros
recursos son almacenados en Google Cloud Storage.

## Tecnologías utilizadas

| Capa | Tecnologías |
|---|---|
| Frontend | React, Vite, Axios |
| Backend | Java 17, Spring Boot, Spring Security, Spring Data JPA |
| Identidad | Keycloak, OAuth 2.0, OpenID Connect, JWT |
| Bases de datos | MySQL, PostgreSQL |
| Infraestructura | Google Cloud, Compute Engine, Cloud SQL, Cloud Storage |
| Red y seguridad | VPC, subredes pública y privada, Cloud NAT, IAP, Nginx, Cloudflare |
| Contenedores | Docker, Docker Compose |
| Integraciones | SMTP, Google Maps, API de consulta de DNI |
| Pruebas | JMeter |

## Seguridad

- Autenticación centralizada mediante Keycloak.
- Autorización basada en roles y claims incluidos en tokens JWT.
- Integración mediante OAuth 2.0 y OpenID Connect.
- Comunicación HTTPS en los puntos de acceso públicos.
- Backend desplegado en una red privada.
- Acceso administrativo a infraestructura mediante IAP y OS Login.
- Restricción de CORS a los dominios autorizados.
- Credenciales y variables sensibles excluidas del repositorio.
- Acceso temporal a archivos privados mediante URLs firmadas.

## Mejoras futuras

- Incorporar balanceo de carga y escalamiento horizontal.
- Configurar alta disponibilidad para las bases de datos.
- Mejorar la observabilidad mediante métricas, logs y alertas centralizadas.
- Optimizar las consultas del listado público mediante proyecciones o DTO ligeros.
- Incorporar una pasarela de pagos para validaciones automáticas.
- Implementar mecanismos adicionales de recuperación ante fallos.

## Autor

**Sergio Bustamante**  
Ingeniería de las Telecomunicaciones — Pontificia Universidad Católica del Perú

Proyecto desarrollado como tesis para la obtención del título profesional de
Ingeniero de las Telecomunicaciones.

## Licencia

Este repositorio se publica con fines académicos y de demostración profesional.
No está autorizado su uso comercial ni su redistribución sin autorización del
autor.

