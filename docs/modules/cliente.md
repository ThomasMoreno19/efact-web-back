# Reglas de negocio: cliente

## Identidad y pertenencia

- La identificación admite DNI de 7 u 8 dígitos y CUIL/CUIT de 11 dígitos. Se aceptan puntos en DNI y guiones en CUIL/CUIT; se guarda y compara solo la secuencia de dígitos.
- Para CUIL/CUIT se valida el prefijo y el dígito verificador. Esto comprueba el formato, no la existencia, vigencia ni titularidad en el padrón de ARCA.
- La identidad del cliente es única dentro de una empresa. El mismo número puede corresponder a registros separados en empresas distintas.

## Saldo e historial

- El saldo puede ser negativo, cero o positivo. No asumir que un saldo negativo es inválido ni que un saldo ausente equivale a cero.
- `updatedAt` es la fecha calendario de Argentina de la última creación o modificación del registro de cliente. Se almacena sin hora y se expone como `YYYY-MM-DD`; la gestiona el sistema y no es editable desde los datos recibidos.
- Los registros anteriores a `updatedAt` no tienen una fecha histórica de modificación recuperable: la antigua `fechaSaldo` era una fecha calendario, por lo que esos clientes mantienen `updatedAt` nulo hasta su próxima modificación o importación.
- `movimiento` obtiene el cliente de forma indirecta a través de `equipo`. No inferir la asociación desde snapshots históricos de nombre o CUIL, porque pueden no coincidir con el cliente actualmente asignado al equipo.

## Credenciales

La contraseña del cliente es opcional. Si se establece, almacenar únicamente su hash y nunca exponer el texto recibido ni el hash en respuestas. No asumir funcionalidades de acceso del cliente que no hayan sido solicitadas.
