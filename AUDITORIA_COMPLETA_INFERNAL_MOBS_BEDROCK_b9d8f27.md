# Auditoría completa de Infernal Mobs Bedrock

**Repositorio:** `ByCesarDev/Infernal-Mobs`  
**Commit auditado:** `b9d8f277cbe6f6943c8bfaa4f6d5fe39e1821833`  
**Objetivo:** port funcional 1:1 de AtomicStryker's Infernal Mobs (NeoForge) a Minecraft Bedrock mediante JavaScript y la API estable.

## Veredicto ejecutivo

La base arquitectónica es buena para una primera implementación: hay separación entre generación, estado persistente, eventos, modificadores, HUD, comandos y loot; los 28 modificadores del original tienen un módulo Bedrock; el arreglo de nombres de `b9d8f27` es correcto conceptualmente; y el manifiesto usa la versión estable actual `@minecraft/server 2.10.0`.

Sin embargo, el add-on todavía **no puede considerarse un port 1:1 ni listo para release**. Hay varios errores bloqueantes:

1. La generación natural acepta prácticamente cualquier entidad viva, incluidos animales pasivos y aldeanos.
2. `Blastoff` y `Gravity` usan la firma antigua de `applyKnockback`, por lo que sus impulsos fallan en API 2.10.0.
3. `Ender` y `Ninja` intentan teletransportar, reproducir sonidos y causar daño dentro de `world.beforeEvents.entityHurt`, que se ejecuta con privilegio restringido.
4. `Berserk` intenta aplicarse daño a sí mismo dentro del mismo evento restringido; el error queda oculto por un `catch {}`.
5. El orden del pipeline de daño está invertido frente a Java: procesa primero al atacante y luego a la víctima.
6. `Unyielding` sigue siendo deliberadamente un stub.
7. `antiFarm` y `disableHealthBar` existen como opciones, pero no tienen implementación efectiva.
8. La suite `npm test` no arranca en una instalación limpia porque importa `@minecraft/server`, que es un paquete de definiciones sin runtime Node.
9. El loot de experiencia no entrega realmente 25 XP de forma controlada.
10. Las traducciones del Resource Pack no son consumidas por el código; casi toda la interfaz continúa en inglés.

## Prioridad P0 — bloqueantes funcionales

### P0.1 — Entidades pasivas pueden convertirse naturalmente en infernales

**Archivo:** `scripts/core/spawnManager.js:20-52`

`isEligibleForInfernal()` solo rechaza jugadores, entidades domesticadas, entidades sin salud y entradas de listas negras. No comprueba que la entidad sea hostil.

El original NeoForge únicamente procesa entidades que implementan `Enemy`:

```java
if (event.getEntity() instanceof LivingEntity && event.getEntity() instanceof Enemy)
```

El proyecto ya contiene `isHostile()` en `scripts/util/entity.js`, pero no se utiliza.

**Consecuencias:** vacas, cerdos, ovejas, aldeanos, ajolotes y otros mobs con componente de salud pueden recibir modificadores naturalmente. Como `resolveTarget()` usa al jugador más cercano como fallback, incluso un animal que no sea agresivo puede ejecutar Storm, Choke, Ghastly, Quicksand, etc. contra el jugador.

**Corrección requerida:** separar dos validaciones:

- Generación natural: exigir hostilidad equivalente a `Enemy`.
- Conversión administrativa con `/infernalmobs:make`: permitir cualquier entidad viva si esa es la intención del comando.

No conviene confiar en `entity.target` o en componentes `minecraft:behavior.*`, porque esos componentes de comportamiento no están expuestos como componentes de Script API. Mantener una lista de familias/tipos hostiles de Bedrock, con soporte opcional para whitelist de add-ons externos.

### P0.2 — `Blastoff` y `Gravity` llaman incorrectamente `applyKnockback`

**Archivos:**

- `scripts/modifiers/blastoff.js:21`
- `scripts/modifiers/gravity.js:38`

API 2.10.0 define:

```ts
applyKnockback(horizontalForce: VectorXZ, verticalStrength: number): void;
```

El add-on todavía usa la firma antigua de cuatro números:

```js
target.applyKnockback(0, 0, 0, 1.1);
target.applyKnockback(awayVec.x, awayVec.z, 0.8, 0.4);
```

Ambas llamadas lanzan una excepción que queda silenciada. Deben usar un objeto `{ x, z }`:

```js
target.applyKnockback({ x: 0, z: 0 }, 1.1);
target.applyKnockback({ x: awayVec.x * 0.8, z: awayVec.z * 0.8 }, 0.4);
```

Después hay que calibrar la fuerza en juego, porque la semántica entre Java y Bedrock no es idéntica.

### P0.3 — `Ender`, `Ninja` y parte de `Berserk` se ejecutan en contexto restringido

**Archivos:**

- `scripts/core/eventRouter.js:20`
- `scripts/core/damagePipeline.js:20-115`
- `scripts/modifiers/ender.js:20-58`
- `scripts/modifiers/ninja.js:20-66`
- `scripts/modifiers/berserk.js:17-35`

`world.beforeEvents.entityHurt` permite modificar/cancelar el evento, pero no permite operaciones que muten el mundo como:

- `Entity.teleport()`
- `Entity.applyDamage()`
- `Dimension.playSound()`
- `Dimension.spawnParticle()`
- escrituras de propiedades dinámicas

Actualmente:

- Ender intenta teletransportar y reflejar daño directamente.
- Ninja intenta lo mismo y además genera sonido/partículas.
- Berserk intenta causar el autodáño directamente.
- Los `catch {}` ocultan el fallo, haciendo que parezca que el modificador simplemente no funciona.

**Diseño requerido:** dividir cada habilidad en dos fases.

1. Dentro del evento `before`: realizar solo lecturas seguras, decidir el resultado, cambiar `event.damage` o `event.cancel`, reservar el cooldown en memoria y crear una acción pendiente.
2. Mediante `system.run()`: teletransportar, reflejar daño, reproducir sonido/partículas y persistir si hace falta.

Para Ender/Ninja, calcular o validar un destino candidato antes de cancelar el golpe. Si se cancela primero y la teleportación diferida falla, el mob obtendría inmunidad gratuita.

### P0.4 — Orden incorrecto del pipeline de daño

**Archivo:** `scripts/core/damagePipeline.js:35-49`

El Bedrock actual ejecuta:

1. Modificadores salientes del atacante.
2. Modificadores entrantes de la víctima.

NeoForge ejecuta:

1. `mod.onHurt()` de la víctima.
2. `mod.onAttack()` del atacante.

El orden importa cuando se combinan Ender/Ninja, Bulwark, Berserk y límites de daño. Por ejemplo, si la víctima cancela el golpe con Ender, Berserk no debería autolesionarse por un ataque que terminó con daño cero.

**Corrección:** procesar primero la cadena entrante de la víctima y después la cadena saliente del atacante, deteniendo o adaptando el segundo paso si el golpe fue cancelado.

### P0.5 — `Unyielding` no está implementado

**Archivo:** `scripts/modifiers/unyielding.js`

El módulo solo registra callbacks vacíos. Esto coincide con la decisión previa de dejar el knockback para el final, pero significa que la paridad todavía es 27/28 como máximo, no 28/28.

## Prioridad P1 — errores importantes de comportamiento

### P1.1 — El objetivo fallback no representa el objetivo real del mob

**Archivo:** `scripts/core/targetResolver.js:58-74`

Cuando `mob.target` no está disponible o no es válido, se selecciona automáticamente al jugador más cercano. Eso permite que las habilidades ataquen a alguien aunque el mob:

- no lo haya detectado;
- esté neutral;
- esté atacando otra entidad;
- sea pasivo debido al error P0.1.

El original activa habilidades con `hasSteadyTarget()` sobre el target real recibido en `LivingChangeTargetEvent`.

**Corrección:** mantener un target observado y validado mediante eventos/API disponible, o usar el fallback solo para entidades hostiles que presenten evidencia de combate. No convertir “jugador cercano” en “objetivo confirmado” de forma automática.

### P1.2 — Detección de Creative y Spectator incorrecta

**Archivo:** `scripts/util/entity.js:38-60`

Se pasan `1`, `3`, `"creative"` y `"spectator"` a `Entity.matches()`. API 2.10.0 espera valores de `GameMode`, cuyos valores son `GameMode.Creative` y `GameMode.Spectator`.

**Consecuencia:** poderes como Choke, Sticky y Rust pueden intentar afectar jugadores Creative; Spectator puede ser elegido como target.

**Corrección:** importar `GameMode` y usar los valores del enum.

### P1.3 — Recuperación simulada de Choke nunca recibe su record

**Archivos:**

- `scripts/modifiers/choke.js:78-85`
- `scripts/core/damagePipeline.js:181-188`

`ChokeHandler.onIncomingDamageAfter()` espera `context.record`, pero el pipeline no lo incluye. En el backend simulado, golpear al infernal nunca recupera las 60 unidades de aire.

Además, el router de muerte nunca llama `handler.onDeath()`, por lo que Choke no restaura/limpia el aire al morir como hace Java.

**Corrección:** incluir el record del infernal en todos los contextos y despachar hooks de muerte antes del loot/unregister.

### P1.4 — `Alchemist` no lanza pociones y usa duraciones inconsistentes

**Archivo:** `scripts/systems/projectileSystem.js:67-106`

La implementación reproduce un sonido y aplica el efecto directamente al objetivo. No existe proyectil, arco, fallo, salpicadura ni efecto en entidades cercanas. Eso es una aproximación, no 1:1.

Asimismo, los comentarios indican 30/30/60 segundos, pero se pasan 300/300/600 ticks, equivalentes a 15/15/30 segundos.

**Corrección:** implementar una splash potion real si la API lo permite de manera fiable; de lo contrario, documentar explícitamente la adaptación Bedrock y al menos reproducir trayectoria, tiempo de vuelo, posibilidad de fallo y radio de impacto.

### P1.5 — `Ghastly` usa una bola pequeña, no una bola explosiva grande

**Archivo:** `scripts/systems/projectileSystem.js:35-53`

NeoForge utiliza `LargeFireball` con potencia de explosión 1. Bedrock genera `minecraft:small_fireball`, cuyo comportamiento no es equivalente.

**Corrección:** usar una entidad/proyectil que produzca una explosión equivalente o rastrear el impacto del proyectil y crear una explosión controlada con guardas de recursión y reglas de griefing definidas.

### P1.6 — XP adicional no equivale a 25 puntos

**Archivo:** `scripts/systems/lootSystem.js:43-55`

El bucle calcula divisiones de XP, pero cada iteración únicamente genera un `minecraft:xp_orb`; nunca asigna `split` como valor del orbe. Por tanto, no hay garantía de que se entreguen 25 puntos.

**Corrección:** emplear un mecanismo Bedrock que permita otorgar exactamente 25 XP al asesino, o documentar una equivalencia aproximada. Si se usa `/xp`, debe determinarse de manera segura el jugador responsable y evitar depender de selectores ambiguos.

### P1.7 — Encantamientos del loot no son 1:1

**Archivos:**

- `scripts/systems/lootSystem.js:71-80`
- `scripts/systems/enchantmentSystem.js:43-77`

Java consume la fuerza en bloques de hasta cinco modificadores: un mob de 12 mods genera fuerzas `5, 5, 2`, por lo que los máximos de encantamientos son aproximadamente `3, 3, 1`. Bedrock pasa `12` a cada objeto y puede generar `3, 3, 3`.

También selecciona niveles con una fórmula inventada, no con el algoritmo de encantamiento de loot de Java.

**Corrección:** pasar `usedStrength = Math.min(remainingStrength, 5)` por cada drop y disminuir el remanente. Después definir una equivalencia Bedrock verificable para selección y nivel.

### P1.8 — Salud declarada y salud efectiva pueden divergir

**Archivo:** `scripts/systems/healthSystem.js`

La salud se aproxima mediante `health_boost`, que añade vida en pasos de 4. Si la diferencia requerida no es múltiplo de cuatro, `effectiveMax` queda por encima de `state.infernalMaxHealth`. El amplificador además está limitado a 254, por lo que mobs con mucha vida base pueden no alcanzar el máximo calculado.

El efecto dura 1,728,000 ticks; no es permanente. Tampoco se reconcilia en `entityLoad` si fue eliminado o expiró.

**Corrección:**

- guardar por separado `requestedMaxHealth` y `effectiveMaxHealth`;
- mostrar en HUD el máximo real;
- reconciliar el efecto al cargar la entidad;
- renovar el efecto antes de expirar;
- probar mobs con 20, 24, 30, 40, 100 y más puntos de vida base.

### P1.9 — Opciones configurables sin implementación

**Archivos:** `scripts/data/defaultConfig.js`, `scripts/core/constants.js`

- `antiFarm`: se puede activar y aparece en `/config`, pero nunca se consulta.
- `disableHealthBar`: se puede cambiar, pero el HUD no la consulta.
- `entityBlacklist`, `entityWhitelist`, `entitiesAlwaysInfernal`: existen, pero no están expuestas en los comandos de configuración.

Esto crea configuración engañosa.

### P1.10 — `entitiesAlwaysInfernal` omite los rolls Ultra e Infernal

**Archivo:** `scripts/core/spawnManager.js:136-143`

El original fuerza la conversión evitando únicamente el roll Elite, pero `createMobModifiers()` todavía realiza los rolls Ultra e Infernal. Bedrock fija directamente 2–4 modificadores, así que una especie configurada como siempre infernal nunca puede obtener 5–12 de forma natural.

### P1.11 — El rayo visual de `/make` causa daño real

**Archivo:** `scripts/commands/adminCommands.js:109-116`

El comando genera `minecraft:lightning_bolt` encima del mob. `extinguishFire()` elimina el fuego después, pero no revierte el daño ni transformaciones vanilla provocadas por el rayo.

Debe distinguirse de Storm: **Storm sí usa un rayo real en Java** (`visualOnly=false`) y por paridad debe dañar/incendiar. El rayo de conversión es solo presentación y debería sustituirse por sonido y partículas cosméticas.

## Prioridad P2 — calidad, UX y rendimiento

### P2.1 — El HUD invalida su propia caché cada cinco ticks

**Archivo:** `scripts/systems/hudSystem.js:79-91`

Mientras el jugador mira al mob se crea un objeto `session` nuevo en cada actualización y `lastRenderedText` vuelve a `""`. Por tanto, `setActionBar()` se ejecuta siempre aunque el texto no haya cambiado.

**Corrección:** reutilizar la sesión cuando `infernalId` sea el mismo y actualizar únicamente `expireTick`; reiniciar la sesión solo cuando cambie el objetivo.

### P2.2 — `namesEnabled=false` no limpia nombres ya aplicados

El código simplemente deja de actualizar `nameTag`. Los infernales que ya recibieron nombre continúan mostrándolo.

### P2.3 — El nombre solo se asigna cuando alguien apunta al mob

La actualización del `nameTag` está dentro del render del HUD. Un infernal recién generado no recibe nombre visible hasta que un jugador lo mira. Si se desea nombre permanente encima de la entidad, debe asignarse al crear/cargar el infernal, no al renderizar UI.

### P2.4 — Resource Pack traducido, lógica sin localización

Los archivos `en_US.lang`, `es_ES.lang` y `es_MX.lang` contienen traducciones, pero `modifierNames.js`, los comandos, los tier labels y el HUD construyen strings en inglés. No se usan `RawMessage.translate` ni claves de idioma.

Además, el nombre del manifiesto usa texto literal en vez de `pack.name`/`pack.description`.

### P2.5 — Costo por tick escala mal

`tickActiveInfernals()` procesa todos los infernales cada tick. Para cada uno, `resolveTarget()` puede ejecutar `dimension.getPlayers()`. Después, varios modificadores vuelven a raycastear línea de visión.

Con 50 infernales cargados pueden producirse aproximadamente 1,000 búsquedas de jugadores por segundo, además de raycasts y lecturas de componentes.

**Corrección recomendada:**

- cachear jugadores por dimensión una vez por tick;
- distribuir infernales en buckets;
- ejecutar habilidades de cooldown largo a menor frecuencia;
- cachear LOS durante el tick por par mob-target;
- mantener Choke/Sprint/Regen en rutas rápidas separadas.

### P2.6 — Excepciones silenciosas en rutas críticas

Hay numerosos `catch {}` alrededor de habilidades. Esto ocultó directamente los errores de `applyKnockback` y los privilegios restringidos.

En desarrollo, cada fallo debe registrarse al menos una vez por clave de habilidad, con rate limit para evitar spam. En producción puede desactivarse con `debug=false`.

### P2.7 — Ayuda de administrador no detecta operadores

**Archivo:** `scripts/commands/playerCommands.js:18`

`origin.sourceEntity.isOp?.()` no existe en las definiciones de API 2.10.0, por lo que `/infernalmobs:help` no mostrará la sección administrativa. Puede mostrarse siempre, dividirse en `/help` y `/adminhelp`, o mantener una lista de permisos propia.

### P2.8 — La lista de hostiles ya está desactualizada/incompleta

`KNOWN_HOSTILES` incluye varios mobs, pero omite algunos tipos y futuras entidades. Si se usa para arreglar P0.1, debe centralizarse y probarse por versión. Para compatibilidad con otros add-ons, proporcionar whitelist configurable.

## Auditoría de los 28 modificadores

| Modificador | Estado actual | Observación principal |
|---|---:|---|
| 1UP | Mayormente correcto | No resucita golpes letales, igual que la lógica de actualización Java; persistencia implementada. |
| Alchemist | Adaptación incompleta | No lanza poción; efecto directo y duraciones inconsistentes. |
| Berserk | Parcialmente roto | Duplica daño, pero el autodáño falla en contexto restringido. |
| Blastoff | Roto | Firma antigua de `applyKnockback`. |
| Bulwark | Correcto | Reducción a la mitad con mínimo 1. |
| Choke | Parcial | Backend simulado no recupera aire al golpear; hook de muerte no se despacha; `airSupply` sigue marcado pre-release. |
| Cloaking | Funcional | Comportamiento central y cooldown razonablemente equivalentes. |
| Darkness | Funcional | Blindness de 120 ticks en contacto. |
| Ender | Roto | Teleport/reflejo dentro de before-event restringido. |
| Exhaust | Funcional con pruebas pendientes | Depende del componente de exhaustion y de corregir Creative. |
| Fiery | Funcional | Contacto incendia y el infernal se extingue al ser golpeado. |
| Ghastly | No equivalente | Usa small fireball en vez de large explosive fireball. |
| Gravity | Roto | Firma antigua de `applyKnockback`. |
| LifeSteal | Funcional | Cura según daño final reportado; probar interacción con absorción/armadura. |
| Ninja | Roto | Mismo problema de privilegios que Ender. |
| Poisonous | Funcional | Efecto de 120 ticks. |
| Quicksand | Funcional | Cadencia y duración cercanas al original; depende del target correcto. |
| Regen | Funcional | 1 HP/s y bloqueo durante fuego; depende de salud efectiva coherente. |
| Rust | Mayormente correcto | Daño de arma y primera pieza de armadura; Creative debe corregirse. |
| Sapper | Funcional | Hunger de 120 ticks. |
| Sprint | Aproximación | Impulsa hacia el target; no replica exactamente la aceleración/velocidad Java. |
| Sticky | Funcional con riesgo | Transacción/rollback bien planteados; Creative debe corregirse. |
| Storm | Funcional por diseño | Rayo real: daño y fuego son comportamiento 1:1; revisar detección de cielo y target. |
| Unyielding | No implementado | Stub reservado. |
| Vengeance | Funcional | Reflejo y guardas implementados; probar duelos entre dos infernales. |
| Weakness | Funcional | Efecto de 120 ticks. |
| Webber | Funcional | Coloca telaraña permanente; validar reglas de griefing/protecciones. |
| Wither | Funcional | Efecto de 120 ticks. |

## Nombres y HUD después de `b9d8f27`

El arreglo principal sí es correcto:

- `prefixText` y `suffixText` se generan una sola vez.
- Se persisten en el estado.
- `formatShortName()` y `formatFullName()` ya son deterministas.
- El HUD incluye todas las filas de modificadores.
- Los estados antiguos pueden completarse mediante `ensureStableName()`.

Pendientes:

- subir `SCHEMA_VERSION` si se desea una migración explícita y auditable;
- no escribir estado desde comandos públicos ejecutados en contexto restringido;
- asignar/limpiar `nameTag` fuera del render del HUD;
- usar traducciones reales en vez de strings ingleses persistidos.

## API, manifiestos y compatibilidad

### Correcto

- `@minecraft/server 2.10.0` es la versión estable más reciente documentada al momento de esta auditoría.
- Los custom commands se registran correctamente durante `system.beforeEvents.startup`.
- Los comandos públicos usan `CommandPermissionLevel.Any` y `cheatsRequired: false`.
- Los comandos administrativos usan `CommandPermissionLevel.Admin`.
- Las mutaciones de los custom commands administrativos generalmente se difieren con `system.run()`.
- Los UUID del BP/RP son distintos y la dependencia del RP está declarada.

### Observaciones

- `EntityBreathableComponent.airSupply` aparece en documentación estable, pero continúa marcado como **pre-release**, y no está presente en las definiciones npm estables 2.10.0 instaladas. El detector de capacidad evita un crash, pero en esa combinación siempre caerá al backend simulado.
- `metadata.product_type: "addon"` debe evaluarse respecto al comportamiento actual de logros. No debe prometerse conservación de logros basándose en comportamiento de versiones anteriores.
- `min_engine_version: [1, 26, 0]` es coherente con la línea actual, aunque debe verificarse contra la versión mínima real que incorporó todos los eventos y custom commands usados.

## Pruebas y herramientas

### Resultado real

- `npm run check`: pasa, pero solo valida JSON, sintaxis JS, archivos requeridos y UUID duplicados.
- `node --check` sobre todos los scripts: pasa.
- `npm test`: **falla antes de ejecutar las pruebas** porque Node intenta cargar `@minecraft/server/index.js`, archivo que no existe en el paquete de tipos.

### Problemas adicionales de la prueba estadística

- Clasifica el conteo 8 como Ultra por el primer `if`, aunque también puede proceder del roll Infernal.
- No conserva el resultado de los rolls de tier, así que no puede medir correctamente cuántas mejoras Ultra/Infernal ocurrieron.
- Imprime tasas, pero no aplica tolerancias ni falla cuando una distribución es incorrecta.
- No prueba eventos, privilegios, firmas de API, lifecycle, loot, salud efectiva ni ninguno de los 28 handlers en un runtime simulado.

### Suite mínima requerida

1. Separar la lógica pura de módulos que importan `@minecraft/server`.
2. Introducir mocks explícitos para Entity, Dimension, World y componentes.
3. Ejecutar type-check de JS contra `@minecraft/server 2.10.0`.
4. Probar firma de cada API invocada.
5. Probar combinaciones de modificadores, especialmente:
   - Ender + Berserk
   - Ninja + Vengeance
   - Bulwark + Berserk
   - Choke simulado + golpe de recuperación
   - dos infernales con Vengeance
6. Añadir pruebas in-game automatizadas mediante `scriptevent` solo para QA.

## Orden recomendado de corrección para Antigravity

1. Corregir elegibilidad natural y targeting.
2. Corregir Creative/Spectator.
3. Rediseñar el pipeline before/after y su orden.
4. Reparar Ender, Ninja y Berserk con acciones diferidas.
5. Actualizar la firma de knockback de Blastoff y Gravity.
6. Pasar records a los handlers y despachar `onDeath`.
7. Corregir Choke simulado.
8. Separar el rayo cosmético de `/make` del rayo real de Storm.
9. Corregir salud efectiva y reconciliación en entityLoad.
10. Corregir XP y fuerza de encantamientos.
11. Implementar o eliminar temporalmente opciones de configuración sin efecto.
12. Conectar localización real.
13. Optimizar scheduler/HUD y eliminar cachés invalidadas.
14. Crear una suite Node ejecutable con mocks.
15. Implementar Unyielding al final, como se acordó.

## Criterio de “release candidate”

No publicar como port 1:1 hasta cumplir, como mínimo:

- ningún mob pasivo se vuelve infernal naturalmente;
- los 27 modificadores no aplazados pasan pruebas individuales in-game;
- Ender/Ninja cancelan, teletransportan y reflejan sin errores de privilegio;
- Blastoff/Gravity producen movimiento real en Windows, Android, consola y servidor dedicado;
- 25 XP y el número de drops están verificados;
- salud real y HUD coinciden después de cargar chunks y reiniciar mundo;
- `npm test` y `npm run check` pasan desde un clon limpio;
- no hay errores silenciosos en el Content Log durante una sesión de estrés;
- 50 infernales cargados no producen degradación severa del TPS;
- la limitación de logros está documentada correctamente.

## Referencias oficiales consultadas

- Microsoft Learn — `@minecraft/server` 2.10.0: https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/minecraft-server?view=minecraft-bedrock-stable
- Microsoft Learn — Custom Commands: https://learn.microsoft.com/en-us/minecraft/creator/documents/scripting/custom-commands?view=minecraft-bedrock-stable
- Microsoft Learn — Execution Privilege: https://learn.microsoft.com/en-us/minecraft/creator/documents/scripting/execution-privilege?view=minecraft-bedrock-stable
- Microsoft Learn — EntityBreathableComponent: https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitybreathablecomponent?view=minecraft-bedrock-stable

