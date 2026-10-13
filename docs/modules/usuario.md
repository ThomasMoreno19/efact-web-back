# Reglas de negocio: usuario

- Los roles son `Superadmin`, `Admin` e `Interno`; el valor inicial es `Admin`.
- Un usuario Interno debe estar asociado a una empresa y solo puede consultar el catálogo interno y los saldos internos de esa empresa. No administra datos ni puede acceder a otra empresa.
- Un usuario puede no estar asociado a una empresa. Una empresa puede tener varios usuarios asociados.
- Las contraseñas se almacenan como hashes. Nunca devolver ni registrar la contraseña en texto plano ni su hash.
- El inicio de sesión de `/admin` acepta usuarios `Superadmin` y `Admin`. Superadmin administra todas las empresas y su sesión vence junto con el token de acceso, sin refresh token. Admin debe estar asociado a una empresa y accede a la administración de esa empresa. Los usuarios Interno acceden mediante las rutas internas de su empresa. Las respuestas de autenticación no incluyen credenciales ni hashes.
