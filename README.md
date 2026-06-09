# AgroEstimador

AgroEstimador es una aplicacion web para la gestion y estimacion de cosechas agricolas. Permite registrar cosechas, capturar muestras de peso, calcular proyecciones de rendimiento, consultar historiales operativos y administrar vehiculos de campo desde una interfaz React conectada a una API real.

## Que hace la aplicacion

La plataforma esta pensada para operaciones agricolas que necesitan centralizar informacion de campo y convertirla en datos utiles para la toma de decisiones. Actualmente el proyecto incluye:

- Inicio de sesion con JWT.
- Dashboard con indicadores y resumenes operativos.
- Registro de cosechas con muestreo y estimacion de peso/valor.
- Historial de cosechas con consulta, edicion y eliminacion.
- Detalle de cosechas registradas.
- Gestion de vehiculos asociados a la operacion.
- Perfil de usuario consultado desde la API.

## Arquitectura

El repositorio esta dividido en dos partes principales:

- `src/`: frontend en React + TypeScript + Vite.
- `api/`: backend en .NET con arquitectura en capas (`Api`, `Application`, `Domain`, `Infrastructure`, `Persistence`, `Shared`).

La API se encuentra preparada para trabajar con autenticacion JWT y esta orientada a ejecutarse sobre AWS Lambda con una base de datos PostgreSQL.

## Flujo general

1. El usuario inicia sesion en la aplicacion.
2. El frontend obtiene y conserva la sesion autenticada.
3. Las pantallas consumen informacion real desde la API.
4. Las operaciones CRUD actualizan los datos almacenados en la base de datos.
5. El dashboard refleja el estado real de la operacion agricola.

## Ejecucion local del frontend

Requisitos:

- Node.js
- npm

Pasos:

1. Instalar dependencias:
   `npm install`
2. Verificar la URL base de la API en [.env.development](.env.development).
3. Iniciar el proyecto en desarrollo:
   `npm run dev`

## Ejecucion de validacion

Para generar la version de produccion del frontend y validar TypeScript:

`npm run build`

## Configuracion importante

- `VITE_API_URL`: URL base de la API que consume el frontend.

## Estado del proyecto

El frontend actual ya consume endpoints reales para autenticacion, perfil, estadisticas, cosechas, fincas, lotes, productos y vehiculos. Algunos modulos administrativos adicionales todavia pueden requerir pantallas nuevas en el frontend para quedar completamente expuestos.
