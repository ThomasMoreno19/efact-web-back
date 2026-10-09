# Archivos de empresas

- El almacenamiento se particiona primero por `idEmpresa`: `.storage/{idEmpresa}/`. El backend valida y persiste los archivos; la base guarda la URL relativa, nunca el contenido binario ni una ruta física del servidor.
- El logo de la empresa se guarda en `.storage/{idEmpresa}/logoEmpresa1-{uuid}.{ext}` y su `logo_url` apunta a `/empresas/logos/{idEmpresa}/logoEmpresa1-{uuid}.{ext}`.
- Las imágenes heredadas de artículos, rubros y marcas pueden permanecer debajo de su carpeta por registro (`articulos/{idArticulo}/`, `rubros/{idRubro}/`, `marcas/{idMarca}/`). Las nuevas cargas de catálogo, incluidas las de proveedores, se guardan en `.storage/{idEmpresa}/hash/{sha256}` y su `logo_url` apunta a `/empresas/media/{idEmpresa}/hash/{sha256}`. Una misma imagen dentro de una empresa puede ser referenciada por varios registros sin duplicar el archivo.
- Limpiar `logo_url` quita la imagen del registro. Los archivos del almacén por hash se conservan para reutilizarlos si otra fila vuelve a referenciar el mismo contenido; no borrar un archivo hash mientras pueda tener otras referencias.
- Al eliminar una empresa se elimina su directorio `.storage/{idEmpresa}/` completo.
- `COMPANY_MEDIA_DIR` configura la raíz (por defecto `./.storage`, relativa al directorio desde el que corre el backend). No guardar uploads en `src/`, `front/public/` ni en Git.
- En producción, configurar `COMPANY_MEDIA_DIR` con una ubicación escribible y persistente fuera del directorio que se reemplaza en cada despliegue. Respaldar ese directorio además de la base de datos.
- Si el hosting no garantiza persistencia del disco o se usan varias instancias del backend, reemplazar el almacenamiento local por un servicio de objetos compartido y conservar en `logo_url` una URL/ruta pública estable.
- Se aceptan imágenes PNG, JPEG y WebP de hasta **50 MB**; el backend valida el contenido del archivo además del nombre y el tipo declarados por el navegador.
