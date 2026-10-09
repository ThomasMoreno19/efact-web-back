# Reglas de negocio: empresa

Las siguientes opciones configuran el comportamiento que una empresa ofrece a sus clientes. Los valores iniciales son decisiones de producto; no cambiarlos por conveniencia técnica ni deducir comportamientos adicionales solo por el nombre de una opción.

| Opción                                    | Valor inicial        |
| ----------------------------------------- | -------------------- |
| `tieneCarrito`                            | `true`               |
| `habilitarExcel`                          | `true`               |
| `imagenesEnArticulos`                     | `true`               |
| `incluirHorarios`                         | `false`              |
| `pedidosFueraHorario`                     | `false`              |
| `incluirCodigoBarra`                      | `false`              |
| `toleranciaMinDias` y `toleranciaMaxDias` | Sin definir (`null`) |

La tolerancia mínima y la máxima son enteros en días. No se puede definir una máxima sin una mínima y, cuando ambas existen, la máxima debe ser mayor. `null` significa que el límite no está definido; no equivale a cero.

El slug de la empresa es obligatorio, único y editable de forma independiente del nombre visible. Debe estar en kebab-case y no se genera automáticamente a partir del nombre.
