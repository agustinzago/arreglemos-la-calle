# Los duplicados se sugieren, nunca se unen automáticamente

En las calles de tierra hay muchos pozos distintos a pocos metros, así que unir reportes por distancia mezclaría problemas diferentes. La app le muestra al vecino los reportes cercanos de la misma categoría (con un radio de duplicado distinto por categoría) y es el vecino quien decide si sumarse a uno o crear uno nuevo. Para que el mapa no se llene de pines, los reportes cercanos se muestran como un grupo, pero solo en la vista: en los datos siguen siendo independientes.

## Considered Options

- Unir automáticamente los reportes dentro de un radio fijo: se descartó por los falsos positivos en calles de tierra.
- Un "reporte padre" con hijos: se descartó porque agrega un concepto que el vecino no necesita entender.
