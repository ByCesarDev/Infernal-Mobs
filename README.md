# Infernal Mobs Bedrock

Port funcional 1:1 autorizado de **AtomicStryker's Infernal Mobs** para Minecraft Bedrock Edition (@minecraft/server estable 2.10.0).

---

## Características Principales

- **Equivalencia 1:1:** Fórmulas de vida, probabilidades escalonadas (Elite 1/15, Ultra 1/7, Infernal 1/7), duraciones, cooldowns e incompatibilidades originales de Java NeoForge.
- **28 Modificadores Originales:** Cada modificador implementado en su propio módulo desacoplado.
- **Sin Entidades Personalizadas:** Enriquece criaturas vanilla o de otros addons mediante propiedades dinámicas persistentes (`infernal:state`) versionadas en Esquema 2.
- **HUD Integrado No Invasivo:** Visualización en actionbar por jugador con retención de 3 segundos, barra segmentada de vida (`████████░░ 119/130 ❤`) y desglose de modificadores en grupos de 5. NameTag corto y limpio.
- **Custom Commands (`/infernalmobs:*`):** Registrados nativamente en el startup del servidor con autocompletado de modificadores, opciones y niveles.
- **Backend Dual para Choke:** Detección de capacidad en runtime (aprovecha `airSupply` nativo si es escribible; fallback simulado con 2 de daño de ahogamiento y +60 unidades de recuperación al golpear al infernal).
- **Botín y Experiencia:** 25 XP al morir y $\lceil \text{modificadores} / 5 \rceil$ premios escalados según tier (Rare, Ultra, Infernal) de las tablas Java con encantamientos dinámicos.
- **Unyielding:** Módulo e interfaz preparados en el pipeline de combate para recibir el método definitivo de knockback.

---

## Comandos

### Jugadores (Permiso `Any` - Sin trucos requeridos)
- `/infernalmobs:help` - Muestra la lista de comandos disponibles.
- `/infernalmobs:info` - Inspecciona el infernal señalado en la mira (vida, nivel, poderes).
- `/infernalmobs:modifier <modificador>` - Explica el funcionamiento de cualquiera de los 28 modificadores con autocompletado.
- `/infernalmobs:hud <on|off>` - Preferencia individual para activar o desactivar el HUD en pantalla.

### Administradores (Permiso `Admin` - Operadores)
- `/infernalmobs:config` - Muestra la configuración actual del mundo.
- `/infernalmobs:set <opción> <valor>` - Modifica opciones (rareza, daño máximo, factor de vida, etc.).
- `/infernalmobs:modifierconfig <modificador> <on|off>` - Habilita o deshabilita modificadores para nuevos spawns.
- `/infernalmobs:make [rare|ultra|infernal|random]` - Convierte el mob señalado en infernal.
- `/infernalmobs:setmods <mods...>` - Asigna modificadores específicos validados contra incompatibilidades.
- `/infernalmobs:remove` - Quita el estado infernal y restaura la vida vanilla del mob señalado.
- `/infernalmobs:reroll` - Vuelve a generar los modificadores y nombre del infernal señalado.
- `/infernalmobs:scan [radio]` - Escanea infernales cargados en el área circundante.
- `/infernalmobs:debug` - Diagnóstico técnico del mob (vida base/infernal, cooldowns, 1UP, choke backend).
- `/infernalmobs:reload` - Recarga la configuración del mundo.
- `/infernalmobs:resetconfig confirm` - Restablece la configuración predeterminada.

---

## Modificadores (28)

| Modificador | Tipo | Descripción Observable |
|---|---|---|
| **1UP** | Pasivo/Reacción | Al bajar del 25% de vida, se cura completamente una única vez. |
| **Alchemist** | Distancia | Lanza pociones splash (Slowness, Poison, Weakness, Harming) cada 6s según distancia y vida. |
| **Berserk** | Ofensivo | Se autoinflige el daño original y duplica su daño saliente (tope 10). |
| **Blastoff** | Reacción/Distancia | Lanza al objetivo verticalmente con impulso Y $\approx 1.1$ cada 15s. |
| **Bulwark** | Defensivo | Reduce el daño recibido a $\max(\text{daño} / 2, 1)$. |
| **Choke** | Objetivo | Drena aire progresivamente. Al agotarse causa 2 de daño de asfixia. Golpear al infernal recupera 60 de aire. |
| **Cloaking** | Reacción/Objetivo | Aplica invisibilidad durante 10s al detectar objetivo o recibir un golpe (cooldown 10s). |
| **Darkness** | Contacto | Aplica Ceguera (Blindness) durante 6s en contacto directo entrante o saliente. |
| **Ender** | Defensivo | Al recibir daño, cada 15s intenta teletransportarse, cancela el golpe y refleja hasta 10 de daño. |
| **Exhaust** | Contacto | Añade exactamente 1.0 punto de agotamiento alimenticio (no es el efecto Hambre). |
| **Fiery** | Contacto | Incendia 3s en contacto directo. El infernal extingue su propio fuego al ser golpeado. |
| **Ghastly** | Distancia | Dispara una bola de fuego explosiva cada 6s a objetivos visibles entre 3 y 12 bloques. |
| **Gravity** | Distancia | Cada 5s empuja horizontalmente al jugador **alejándolo** del infernal (fuerza $\approx 0.8$, $Y \le 0.4$). |
| **LifeSteal** | Ofensivo | Se cura por el daño que produce sin superar su vida máxima. |
| **Ninja** | Defensivo | Cada 15s al ser golpeado, teletransporte con explosión en origen, cancelación del golpe y reflejo de daño. |
| **Poisonous** | Contacto | Aplica Veneno durante 6s en contacto directo. |
| **Quicksand** | Distancia | Aplica Lentitud I durante 45 ticks cada 50 ticks a objetivo visible. |
| **Regen** | Pasivo | Cura 1 HP por segundo si no está a vida completa ni ardiendo. |
| **Rust** | Contacto | Al recibir golpe de jugador: desgasta 4 puntos su arma. Al golpear a jugador: desgasta 1 pieza de armadura. |
| **Sapper** | Contacto | Aplica Hambre (Hunger) durante 6s en contacto directo. |
| **Sprint** | Movimiento | Alterna carrera cada 5s hacia el objetivo sin alterar la navegación vanilla. |
| **Sticky** | Reacción | Cada 15s al ser golpeado por un jugador no creativo, le hace soltar el objeto de su mano. |
| **Storm** | Distancia | Cada 25s invoca un rayo real sobre un objetivo visible expuesto al cielo y a más de 3 bloques. |
| **Unyielding** | Defensivo | Inmune a knockback hostil (módulo preparado para método definitivo). |
| **Vengeance** | Reacción | Refleja la mitad del daño recibido (mínimo 1, máximo 10) con guardas contra recursión. |
| **Weakness** | Contacto | Aplica Debilidad durante 6s en contacto directo. |
| **Webber** | Reacción/Distancia | Cada 15s coloca una telaraña permanente bajo los pies del objetivo si el bloque es aire. |
| **Wither** | Contacto | Aplica Wither durante 6s en contacto directo. |

---

## Verificación y Tests

El proyecto incluye una suite estadística de 100,000 tiradas que valida distribución de tiers, incompatibilidades y blacklists:

```bash
npm install
npm test
npm run check
```

---

## Créditos y Licencia

- Mod original y diseño de mecánicas: **AtomicStryker** (https://github.com/AtomicStryker/atomicstrykers-minecraft-mods).
- Port para Minecraft Bedrock: **CesarDev**.
- Autorizado por AtomicStryker para reutilización de nombres, traducciones, identidad visual y lógica.
