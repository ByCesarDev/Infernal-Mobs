# Plan definitivo: port 1:1 de Infernal Mobs a Minecraft Bedrock

> Especificación técnica y plan de implementación para Antigravity
> Proyecto: `ByCesarDev/Infernal-Mobs`
> Fuente de verdad: versión NeoForge actual de `AtomicStryker/atomicstrykers-minecraft-mods/InfernalMobs`
> Plataforma objetivo: Minecraft Bedrock con JavaScript y `@minecraft/server` estable `2.10.0`
> Estado del documento: plan normativo; no es una implementación

---

## 1. Propósito

Construir un port de Infernal Mobs para Minecraft Bedrock que reproduzca con la mayor fidelidad posible la lógica observable del mod Java actual de AtomicStryker.

El resultado no debe ser una reinterpretación inspirada en Infernal Mobs. Debe conservar:

- las probabilidades de aparición;
- la cantidad de modificadores por mob;
- los 28 modificadores originales;
- sus disparadores, restricciones, incompatibilidades, tiempos y valores;
- el aumento de vida;
- la generación de nombres;
- las categorías Rare, Ultra e Infernal;
- el HUD de información durante el combate;
- el botín y la experiencia adicional;
- la persistencia al guardar el mundo o descargar chunks;
- la compatibilidad multijugador;
- una configuración equivalente a la del mod Java;
- herramientas administrativas y de diagnóstico.

Cuando Bedrock no permita copiar una mecánica internamente, se implementará la equivalencia observable más cercana y se documentará la diferencia. No se deben inventar cambios de balance para “mejorar” el original.

---

## 2. Autoridad, recursos y fuentes

### 2.1 Fuente normativa

El comportamiento normativo procede del código actual de Infernal Mobs en el repositorio de AtomicStryker. En caso de contradicción entre:

1. código ejecutable Java;
2. comentarios del código;
3. documentación antigua;
4. comportamiento del port Bedrock existente;
5. addon Bedrock de 2020;

prevalece el código ejecutable Java actual.

Ejemplo: un comentario Java dice “2–5 modifications standard”, pero el código usa `2 + nextInt(3)`, que produce **2–4**. El port debe usar 2–4.

### 2.2 Permiso

Cesar confirmó que AtomicStryker autorizó el uso de sus recursos para el port Bedrock. Debe conservarse una referencia verificable a esa autorización y la atribución correspondiente en el repositorio y en la distribución.

### 2.3 Addon Bedrock de 2020

El ZIP histórico `Infernal Mobs Remake` de 2020 pertenece a autores distintos y contiene entidades, modelos, partículas, sonidos y texturas propios. No debe copiarse contenido de ese addon sin autorización independiente.

Además, su arquitectura no sirve como base del port 1:1: crea variantes infernales fijas por especie en lugar de añadir combinaciones aleatorias de modificadores a entidades vanilla.

### 2.4 Recursos realmente disponibles en el mod Java

El mod actual de AtomicStryker incluye principalmente:

- traducciones;
- nombres de clases, modificadores, prefijos y sufijos;
- logo;
- lógica Java.

No depende de un conjunto grande de modelos o texturas propias. El port debe conservar la apariencia vanilla de los mobs y reproducir la identidad mediante nombre, HUD, partículas y sonidos vanilla equivalentes.

---

## 3. Alcance y definición de 1:1

Un modificador se considera portado 1:1 cuando cumple todos estos puntos:

1. mismo disparador;
2. mismo tipo de objetivo;
3. mismo alcance;
4. misma exigencia de línea de visión;
5. mismo cooldown;
6. misma duración;
7. mismo daño, curación, impulso o efecto;
8. mismas restricciones de especie;
9. mismas incompatibilidades;
10. misma interacción con ataques directos y proyectiles;
11. mismo comportamiento en multijugador;
12. persistencia equivalente cuando el estado es permanente;
13. ausencia de bucles de daño o dobles activaciones;
14. resultado observable equivalente para el jugador.

### 3.1 Excepciones técnicas admitidas

Solo se aceptan inicialmente estas diferencias:

- **Choke:** `airSupply` sigue siendo pre-release y no aparece en los tipos estables 2.10.0. Se preparará una ruta nativa por detección de capacidad y un fallback estable.
- **Sprint:** Bedrock no expone exactamente el controlador interno de navegación de Java; se reproducirá el patrón observable sin usar Speed permanente.
- **HUD:** Bedrock no ofrece directamente la boss bar cliente personalizada de NeoForge; se utilizará una presentación compatible mediante HUD/actionbar.
- **Unyielding:** se implementará al final mediante el método de knockback que aportará Cesar.

No se aceptarán aproximaciones innecesarias para el resto.

---

## 4. Restricciones técnicas

### 4.1 Plataforma

- JavaScript directo, no TypeScript compilado como requisito de runtime.
- Dependencia principal: `@minecraft/server` estable `2.10.0`.
- Evitar APIs Beta como dependencia obligatoria.
- No requerir toggles experimentales para las funciones principales.
- Debe funcionar en singleplayer, Realms y servidor dedicado dentro de las capacidades de scripting de Bedrock.

### 4.2 Entidades

No crear duplicados como `infernal:zombie` o `infernal:skeleton`.

Un infernal debe seguir siendo la entidad original, por ejemplo:

- `minecraft:zombie`;
- `minecraft:skeleton`;
- `minecraft:spider`;
- una entidad hostil añadida por otro addon, si expone los componentes necesarios.

La identidad infernal se añade mediante propiedades dinámicas y cachés de runtime.

### 4.3 Compatibilidad

El sistema no debe reemplazar los JSON de comportamiento de mobs vanilla. Reemplazarlos rompería compatibilidad con otros addons y obligaría a mantener copias por especie.

---

## 5. Arquitectura requerida

La implementación actual debe refactorizarse hacia módulos con responsabilidades explícitas.

```text
scripts/
├── main.js
├── core/
│   ├── bootstrap.js
│   ├── infernalManager.js
│   ├── spawnManager.js
│   ├── eventRouter.js
│   ├── damagePipeline.js
│   ├── tickScheduler.js
│   ├── targetResolver.js
│   ├── capabilityDetector.js
│   └── constants.js
├── data/
│   ├── modifierDefinitions.js
│   ├── modifierNames.js
│   ├── incompatibilities.js
│   ├── lootDefinitions.js
│   └── defaultConfig.js
├── storage/
│   ├── entityState.js
│   ├── worldConfig.js
│   ├── playerPreferences.js
│   └── migrations.js
├── systems/
│   ├── healthSystem.js
│   ├── lootSystem.js
│   ├── enchantmentSystem.js
│   ├── hudSystem.js
│   ├── namingSystem.js
│   ├── equipmentSystem.js
│   ├── projectileSystem.js
│   ├── teleportSystem.js
│   └── lineOfSight.js
├── modifiers/
│   ├── oneUp.js
│   ├── alchemist.js
│   ├── berserk.js
│   ├── blastoff.js
│   ├── bulwark.js
│   ├── choke.js
│   ├── cloaking.js
│   ├── darkness.js
│   ├── ender.js
│   ├── exhaust.js
│   ├── fiery.js
│   ├── ghastly.js
│   ├── gravity.js
│   ├── lifeSteal.js
│   ├── ninja.js
│   ├── poisonous.js
│   ├── quicksand.js
│   ├── regen.js
│   ├── rust.js
│   ├── sapper.js
│   ├── sprint.js
│   ├── sticky.js
│   ├── storm.js
│   ├── vengeance.js
│   ├── weakness.js
│   ├── webber.js
│   ├── wither.js
│   └── unyielding.js
├── commands/
│   ├── registerCommands.js
│   ├── playerCommands.js
│   ├── adminCommands.js
│   └── testScriptEvents.js
└── util/
    ├── entity.js
    ├── vector.js
    ├── random.js
    ├── guards.js
    └── log.js
```

### 5.1 Contrato de un modificador

Cada módulo de modificador debe declarar datos, no depender de cadenas dispersas:

- ID interno estable;
- clave de traducción;
- lista de prefijos;
- lista de sufijos;
- especies prohibidas;
- modificadores incompatibles;
- cooldown predeterminado;
- eventos que escucha;
- función de tick, si la necesita;
- estado persistente propio, si lo necesita;
- función de limpieza, si altera estado externo.

Hooks conceptuales permitidos:

```text
onAssigned
onRemoved
onIncomingDamageBefore
onIncomingDamageAfter
onOutgoingDamageBefore
onOutgoingDamageAfter
onDirectlyHit
onDirectAttack
onSteadyTarget
onTick
onTargetChanged
onDeath
```

No todos los módulos deben implementar todos los hooks.

### 5.2 Separación entre definición y runtime

`modifierDefinitions.js` contiene metadatos y referencias a handlers. El estado de cada entidad no debe almacenarse dentro de objetos globales del modificador que puedan compartirse accidentalmente entre mobs.

---

## 6. Modelo de datos persistente

### 6.1 Estado de entidad

Guardar una única propiedad dinámica JSON versionada, salvo que el límite de tamaño obligue a dividirla.

Esquema conceptual:

```json
{
  "schema": 2,
  "initialized": true,
  "isInfernal": true,
  "modifiers": ["fiery", "storm", "regen"],
  "baseMaxHealth": 20,
  "infernalMaxHealth": 60,
  "tier": "rare",
  "name": {
    "prefixModifier": "fiery",
    "suffixModifier": "storm"
  },
  "persistent": {
    "oneUpConsumed": false
  },
  "cooldowns": {}
}
```

### 6.2 Entidades no infernales procesadas

Java marca también los mobs que ya pasaron por la tirada y no se volvieron infernales. Bedrock debe hacer lo mismo.

Razón: los eventos de carga o reaparición del script no deben tirar nuevamente la probabilidad para la misma entidad.

Estados mínimos:

```text
unprocessed
processed_non_infernal
infernal
```

### 6.3 Estado persistente obligatorio

- versión del esquema;
- lista ordenada de modificadores;
- vida base capturada;
- vida máxima infernal;
- selección de prefijo/sufijo;
- categoría calculada;
- consumo de 1UP;
- cooldowns que no deban reiniciarse descargando el chunk;
- flags permanentes futuros.

### 6.4 Estado temporal en memoria

- objetivo estable actual;
- duración de objetivo estable;
- contador simulado de Choke;
- referencias de daño interno;
- última posición o velocidad necesaria;
- último tick procesado por cada hook;
- última información mostrada en HUD;
- caché de entidades activas.

### 6.5 Migraciones

Debe existir `migrations.js` desde el inicio.

La migración desde el port actual debe:

1. reconocer tags y propiedades existentes;
2. recuperar la lista de modificadores si es posible;
3. corregir la fórmula de vida sin curar ni matar incorrectamente;
4. convertir el 1UP antiguo basado en clonación al estado correcto;
5. regenerar categoría y nombre si faltan;
6. escribir el esquema nuevo una sola vez;
7. no volver a procesar el mismo mob como spawn nuevo.

Si el estado antiguo es irrecuperable, conservar el mob sin corromper el mundo y registrar un aviso solo en modo debug.

---

## 7. Configuración del mundo

Valores predeterminados derivados del Java actual:

| Clave                     |       Valor |
| ------------------------- | ----------: |
| `eliteRarity`           |          15 |
| `ultraRarity`           |           7 |
| `infernoRarity`         |           7 |
| `modHealthFactor`       |         1.0 |
| `maxDamage`             |          10 |
| `healthChangesDisabled` |       false |
| `disableHealthBar`      |       false |
| `modCooldownFactor`     |         1.0 |
| `dimensionBlacklist`    |      vacío |
| todos los modificadores   | habilitados |

También debe permitir:

- blacklist/whitelist de tipos de entidad;
- entidades siempre infernales;
- vida base sobrescrita por tipo;
- listas de botín configurables;
- nombres/HUD activables;
- loot y XP activables;
- debug;
- intervalos internos si se necesita diagnóstico.

### 7.1 Validación

- rarezas: enteros mayores que cero;
- factor de vida: número mayor que cero;
- daño máximo: número no negativo;
- radios e intervalos dentro de límites seguros;
- IDs de entidad y dimensión normalizados;
- modificadores referenciados existentes.

Una configuración inválida no debe detener el script. Debe rechazarse el cambio y mantenerse el valor anterior.

---

## 8. Elegibilidad y procesamiento de spawns

### 8.1 Candidatos

Java procesa enemigos. En Bedrock, usar una evaluación por capacidad y configuración:

1. entidad válida y viva;
2. tiene componente de salud;
3. no es jugador;
4. no es objeto, proyectil, experiencia, vehículo vacío ni entidad técnica;
5. no es domesticada si puede determinarse;
6. no está bloqueada por configuración;
7. dimensión permitida;
8. no fue procesada previamente.

Para entidades de addons, permitir infernalización si cumplen el contrato mínimo y no están bloqueadas.

### 8.2 Momento de procesamiento

Procesar entidades nuevas con eventos de spawn disponibles y cubrir entidades cargadas mediante un escaneo distribuido inicial. Nunca recorrer todas las entidades de todas las dimensiones cada tick.

### 8.3 Probabilidades

La secuencia exacta es:

1. Tirada Elite: `randomInt(15) === 0`.
2. Si pasa, base de 2–4 modificadores.
3. Tirada Ultra: `randomInt(7) === 0`.
4. Si pasa, añadir 3–4.
5. Tirada Infernal: `randomInt(7) === 0`.
6. Si pasa, añadir otros 3–4.

No convertirlo en tres probabilidades paralelas.

Rangos resultantes:

| Ruta                 | Cantidad posible |
| -------------------- | ---------------: |
| Elite sin upgrade    |             2–4 |
| Con upgrade Ultra    |             5–8 |
| Con upgrade Infernal |            8–12 |

La selección puede terminar con menos modificadores únicamente si no quedan candidatos compatibles.

### 8.4 Clasificación visual

La clase final depende de la cantidad efectiva de modificadores:

| Cantidad | Clase    | Color sugerido |
| -------: | -------- | -------------- |
|     1–5 | Rare     | aqua           |
|    6–10 | Ultra    | amarillo       |
|      11+ | Infernal | dorado         |

La ruta aleatoria de creación y la categoría visual no deben confundirse.

---

## 9. Selección de modificadores

Algoritmo:

1. copiar la lista de modificadores habilitados;
2. elegir un índice aleatorio;
3. retirar ese candidato de la lista, se acepte o se rechace;
4. comprobar blacklist por especie;
5. comprobar incompatibilidad con todos los ya seleccionados;
6. si es válido, añadirlo a la cadena;
7. repetir hasta completar la cantidad o agotar candidatos.

No permitir duplicados.

### 9.1 Blacklists originales

| Modificador | Prohibido en         |
| ----------- | -------------------- |
| 1UP         | creeper              |
| Berserk     | creeper              |
| LifeSteal   | creeper              |
| Sticky      | creeper              |
| Cloaking    | spider y cave spider |

La comprobación debe contemplar variantes equivalentes y no depender únicamente de una coincidencia textual frágil.

### 9.2 Incompatibilidades originales

| A        | B      |
| -------- | ------ |
| Blastoff | Webber |
| Gravity  | Webber |
| Sticky   | Storm  |

La matriz debe normalizarse como relación bidireccional.

Eliminar incompatibilidades incorrectas del port actual:

- Blastoff con Gravity;
- Ender con Ninja;
- Sprint con Quicksand.

---

## 10. Vida

Fórmula normativa:

```text
infernalMaxHealth = baseMaxHealth × modifierCount × modHealthFactor
```

Ejemplo:

```text
zombie: 20
modificadores: 4
factor: 1.0
vida final: 80
```

No usar la fórmula antigua del port Bedrock:

```text
base × (1 + count × 0.5)
```

### 10.1 Aplicación

1. capturar vida máxima original antes de alterarla;
2. calcular vida infernal;
3. actualizar el atributo máximo si es modificable;
4. curar al máximo únicamente durante la creación inicial;
5. guardar ambos valores;
6. en recarga, restaurar máximo sin duplicar multiplicación;
7. conservar la proporción o vida actual durante migración según el caso documentado.

### 10.2 `healthChangesDisabled`

Si está activo:

- conservar vida vanilla;
- no romper 1UP, Regen ni HUD;
- el HUD debe usar el máximo real;
- el botín sigue dependiendo de modificadores.

---

## 11. Resolución de objetivos

Varios poderes requieren “steady target”. Crear un `targetResolver` común.

Debe distinguir:

- atacante directo;
- proyectil directo;
- dueño del proyectil;
- objetivo actual inferido;
- jugador más cercano elegible;
- objetivo estable durante suficientes ticks.

Reglas:

- no atacar espectadores;
- respetar jugadores creativos cuando la mecánica Java los excluye;
- comprobar dimensión;
- comprobar validez antes de cada uso;
- limpiar referencia al morir, salir o cambiar dimensión;
- no elegir al propio infernal;
- no asumir que todo `damagingEntity` es jugador.

### 11.1 Línea de visión

Implementar una utilidad compartida mediante raycast. El primer bloque sólido entre origen y destino bloquea la visión. Para entidades altas, probar centro corporal y posición de ojos aproximada.

### 11.2 Exposición al cielo

Storm requiere cielo visible. La comprobación debe buscar obstrucciones sobre la posición objetivo hasta el límite vertical de la dimensión o usar la API equivalente disponible.

---

## 12. Pipeline de daño

El pipeline es central. Ningún modificador debe suscribirse de forma independiente al mismo evento y alterar daño sin orden definido.

### 12.1 Daño recibido por un infernal

Orden requerido:

1. validar víctima, fuente y estado infernal;
2. detectar si es daño interno del sistema;
3. resolver atacante directo y responsable;
4. tomar snapshot del daño original;
5. ejecutar transformadores/canceladores defensivos en el orden de la cadena;
6. ejecutar reacciones que dependen del golpe;
7. escribir daño final o cancelar;
8. programar tareas posteriores al daño;
9. comprobar condiciones posteriores como 1UP;
10. actualizar HUD/caché.

Transformadores/canceladores:

- Bulwark;
- Ender;
- Ninja;
- Unyielding solo cuando se implemente al final.

Reacciones:

- Blastoff;
- Choke;
- Cloaking;
- Darkness;
- Fiery;
- Poisonous;
- Rust;
- Sticky;
- Vengeance;
- Weakness;
- Wither.

### 12.2 Daño causado por un infernal

1. validar atacante infernal y víctima;
2. resolver ataque directo/proyectil;
3. guardar daño original;
4. ejecutar Berserk;
5. limitar el daño alterado a `maxDamage` donde Java lo hace;
6. ejecutar LifeSteal;
7. aplicar efectos de contacto;
8. aplicar desgaste de Rust;
9. actualizar estados/HUD.

### 12.3 Daño interno y recursión

Usar un registro temporal por entidad/par de entidades y tick. Tipos mínimos:

```text
berserk_self
vengeance_reflect
ender_reflect
ninja_reflect
choke_damage
ghastly_explosion
```

El registro debe impedir:

- Vengeance contra Vengeance infinito;
- LifeSteal por daño reflejado propio;
- Berserk reactivándose por autodaño;
- efectos de contacto por daños ambientales;
- doble procesamiento del mismo golpe.

Limpiar flags incluso si una operación lanza error; usar bloques de limpieza controlados.

### 12.4 Ataques directos

Los poderes que Java limita a `source.getDirectEntity()` deben respetarlo. Un daño de caída, cactus, fuego ambiental o comando no debe simular un golpe cuerpo a cuerpo.

Para proyectiles, documentar individualmente si se usa el proyectil o su dueño como responsable.

---

## 13. Cooldowns y tiempo

Minecraft ejecuta 20 ticks por segundo. Centralizar conversiones:

```text
1 s = 20 ticks
3 s = 60 ticks
5 s = 100 ticks
6 s = 120 ticks
10 s = 200 ticks
15 s = 300 ticks
25 s = 500 ticks
```

Aplicar `modCooldownFactor` de manera uniforme a los cooldowns que en Java dependen de ese factor.

Guardar tiempos como tick absoluto del mundo/sistema cuando sea posible:

```text
nextAllowedTick = currentTick + duration
```

Esto evita acumulación de errores y simplifica comprobaciones.

---

## 14. Especificación de los 28 modificadores

## 14.1 1UP

**Disparador:** tick/comprobación posterior al daño.
**Restricción:** no permitido en creepers.
**Estado persistente:** `oneUpConsumed`.

Comportamiento:

1. si no fue consumido;
2. si la vida actual cae por debajo del 25% de la vida máxima real;
3. curar inmediatamente hasta el máximo;
4. marcarlo como consumido;
5. reproducir sonido equivalente a subir de nivel.

No debe:

- esperar a la muerte;
- cancelar la muerte mediante clonación;
- crear otra entidad;
- duplicar equipamiento o botín;
- reactivarse descargando el chunk.

Pruebas:

- 26%: no activa;
- menos de 25%: activa;
- después de activar: nunca vuelve a activar;
- daño letal que no deja oportunidad de tick: verificar si el evento previo permite detectar el resultado y curar antes de morir.

## 14.2 Alchemist

**Disparador:** objetivo estable.
**Cooldown:** 6 segundos.
**Alcance:** jugador más cercano dentro de 12.
**Requisitos:** línea de visión; distancia mínima mayor que la comprobación Java equivalente.

Selección:

1. si distancia `>= 8` y no tiene Slowness: Slowness;
2. de lo contrario, si vida del objetivo `>= 8` y no tiene Poison: Poison;
3. de lo contrario, si distancia `<= 3`, no tiene Weakness y pasa probabilidad de 25%: Weakness;
4. en cualquier otro caso: Harming.

Acciones:

- lanzar una poción splash real o proyectil equivalente;
- asignar propietario si la API lo permite;
- calcular trayectoria al objetivo;
- reproducir sonido de lanzamiento de bruja;
- no aplicar el efecto instantáneamente sin proyectil salvo fallback documentado.

Probar objetivo móvil, techo bajo, varios jugadores y efectos ya presentes.

## 14.3 Berserk

**Disparador:** ataque del infernal.**Restricción:** no permitido en creepers.

1. infligir al atacante infernal autodaño igual al daño original;
2. marcar ese daño como interno;
3. duplicar el daño dirigido a la víctima;
4. limitar el daño resultante a `maxDamage`, predeterminado 10.

El autodaño no debe disparar efectos defensivos como si un enemigo hubiese golpeado al mob.

## 14.4 Blastoff

**Disparador:** objetivo estable o golpe directo recibido.**Cooldown:** 15 segundos.**Incompatible:** Webber.

- aplicar impulso vertical aproximado `Y = 1.1`;
- conservar una componente horizontal mínima o la existente, sin convertirlo en Gravity;
- reproducir sonido equivalente de salto de slime;
- no activarse por daño ambiental.

## 14.5 Bulwark

**Disparador:** antes de recibir daño.

```text
damageFinal = max(damageEntrante / 2, 1)
```

Debe alterar el daño real, no curar después. Probar cantidades fraccionarias, daño 1, daño masivo, proyectiles y explosiones.

## 14.6 Choke

**Disparador:** objetivo estable y visible.
**Objetivo:** entidad viva atacada, principalmente jugador.
**Daño al agotarse:** 2 por ahogamiento.

Java reduce progresivamente el aire del objetivo. Cuando cae por debajo del límite, reinicia el ciclo y causa daño de ahogamiento. Cuando el objetivo golpea al infernal, recupera 60 unidades de aire hasta el máximo.

### Backend nativo preferido

En runtime:

1. obtener `minecraft:breathable`;
2. comprobar que existe `airSupply` y que acepta escritura;
3. respetar límites `suffocateTime`/`totalSupply` expuestos;
4. modificar aire fuera de restricted execution;
5. capturar errores y degradar al fallback sin romper el tick.

No asumir disponibilidad solo porque la página de documentación usa `view=stable`: `airSupply` continúa marcado pre-release y no figura en los tipos npm estables 2.10.0.

### Fallback estable

- contador interno por combinación infernal/objetivo;
- decremento equivalente;
- daño de ahogamiento de 2 al alcanzar el umbral;
- recuperación de 60 al golpear al infernal;
- restauración/limpieza al cambiar objetivo, morir, invalidarse o salir de dimensión;
- indicador visual opcional, sin fingir que es la barra vanilla.

El comando debug debe indicar `chokeBackend=native|simulated`.

## 14.7 Cloaking

**Disparador:** objetivo estable o golpe directo recibido.
**Cooldown:** 10 segundos.
**Duración:** invisibilidad durante 10 segundos.
**Restricción:** spiders y cave spiders.

No renovar continuamente la invisibilidad ignorando cooldown. Los efectos visuales/equipamiento seguirán las limitaciones vanilla de Bedrock.

## 14.8 Darkness

**Disparador:** contacto directo entrante o saliente.
**Efecto:** Blindness durante 120 ticks/6 segundos.

Aplicar al oponente, no al infernal. No activarlo con daño ambiental.

## 14.9 Ender

**Disparador:** daño recibido de atacante directo.
**Cooldown:** 15 segundos.

Si el teletransporte tiene éxito:

1. cancelar el daño entrante;
2. reflejar al atacante el mismo daño, limitado a 10;
3. marcar reflejo contra recursión.

Algoritmo de teletransporte:

- si la distancia al atacante supera 8, realizar hasta 5 intentos orientados hacia él;
- si fallan o no aplica, realizar hasta 5 intentos aleatorios;
- rango aleatorio aproximado: ±32 en horizontal y vertical;
- buscar suelo seguro;
- evitar agua/líquidos y bloques sin espacio;
- validar pies y cabeza;
- reproducir sonido de teletransporte de enderman en destino.

Si todos los intentos fallan, el golpe no debe cancelarse ni reflejarse.

## 14.10 Exhaust

**Disparador:** contacto directo entrante o saliente con jugador.

Añadir exactamente 1 punto de agotamiento mediante el componente de exhaustion. No sustituir por efecto Hunger: Sapper ya cubre esa mecánica.

Respetar los límites del atributo y ejecutar la mutación fuera de restricted execution si es necesario.

## 14.11 Fiery

**Disparador:** contacto directo entrante o saliente.

- incendiar al oponente durante 3 segundos;
- cuando el infernal es golpeado, extinguir el fuego del propio infernal;
- no hacer inmune permanentemente al infernal al fuego ambiental;
- evitar reencender por ticks duplicados del mismo golpe.

## 14.12 Ghastly

**Disparador:** objetivo estable.**Cooldown:** 6 segundos.**Alcance:** hasta 12; distancia mínima mayor que 3.**Requisito:** línea de visión.**Explosión:** potencia 1.

- crear una bola de fuego grande compatible;
- configurar dueño como el infernal;
- disparar hacia la posición anticipada/central del jugador;
- usar `EntityProjectileComponent.shoot` cuando corresponda;
- reproducir sonido de disparo de ghast;
- no generar la explosión inmediatamente en el objetivo;
- impedir que un error de dirección dispare dentro del propio caster.

Probar griefing según reglas vanilla y configuración del mundo.

## 14.13 Gravity

**Disparador:** objetivo jugador estable.
**Cooldown:** 5 segundos.
**Requisitos:** línea de visión.
**Incompatible:** Webber.

Empujar al objetivo **alejándolo** del infernal:

- vector horizontal normalizado del infernal hacia el jugador;
- intensidad horizontal aproximada 0.8;
- componente vertical limitada a 0.4;
- sonido equivalente de iron golem.

El port actual lo atraía; eso es incorrecto.

## 14.14 LifeSteal

**Disparador:** ataque del infernal.**Restricción:** no permitido en creepers.

- curar al infernal por la cantidad de daño correspondiente al ataque;
- no exceder vida máxima;
- no curar por daño reflejado, ambiental o cancelado;
- definir mediante pruebas si Bedrock permite usar daño final confirmado; preferir daño realmente aplicado cuando se pueda observar de forma fiable.

## 14.15 Ninja

**Disparador:** daño recibido de atacante directo.
**Cooldown:** 15 segundos.

Comparte estructura de Ender:

1. intentar teletransporte seguro;
2. si tiene éxito, cancelar golpe;
3. reflejar daño limitado a 10;
4. emitir sonido de explosión y partículas de explosión en la posición inicial;
5. no usar el sonido de destino de Ender.

Ender y Ninja no son incompatibles. Si un mob tiene ambos, el orden de la cadena y los cooldowns individuales deben producir un resultado determinista sin doble cancelación/reflejo del mismo golpe. Una vez cancelado por uno, el segundo no debe reflejar otra vez el mismo evento.

## 14.16 Poisonous

**Disparador:** contacto directo entrante o saliente.
**Efecto:** Poison durante 120 ticks/6 segundos si no está ya presente.

No reiniciar innecesariamente el efecto cada tick.

## 14.17 Quicksand

**Disparador:** objetivo estable, permitido y visible.
**Intervalo:** cada 50 ticks.
**Efecto:** Slowness I durante 45 ticks.

El intervalo ligeramente mayor que la duración debe permitir una pausa breve como en Java. No convertirlo en slowness permanente de duración arbitraria.

## 14.18 Regen

**Intervalo:** una vez por segundo.
**Curación:** 1 punto.

Condiciones:

- vida menor al máximo;
- infernal no está ardiendo.

No aplicar un efecto Regeneration genérico si cambia la velocidad o partículas. Modificar la vida directamente para conservar el ritmo exacto.

## 14.19 Rust

Dos direcciones distintas:

### Jugador golpea al infernal

- requiere atacante directo jugador;
- dañar 4 puntos de durabilidad al objeto en la mano principal;
- si no es dañable, no hacer nada;
- respetar rotura del objeto.

### Infernal golpea al jugador

- buscar la primera pieza de armadura dañable siguiendo un orden definido equivalente;
- daño de durabilidad: `max(1, floor(0.75 × daño))`;
- no dañar objeto de mano en esta dirección;
- respetar Unbreaking si la API/operación vanilla utilizada lo procesa; documentar si el cambio directo de durabilidad no lo hace.

## 14.20 Sapper

**Disparador:** contacto directo entrante o saliente.
**Efecto:** Hunger durante 120 ticks/6 segundos si no está presente.

No confundir con Exhaust.

## 14.21 Sprint

**Disparador:** objetivo estable.
**Cambio de estado:** cada 5 segundos.

Java alterna estado de sprint y ajusta velocidad hacia la dirección de movimiento/objetivo con aceleración y límites. No usar Speed permanente.

Estrategia Bedrock:

1. mantener `sprinting=true|false` por entidad;
2. alternar cada 100 ticks mientras exista objetivo estable;
3. durante estado activo, aplicar aceleraciones pequeñas hacia la ruta/objetivo;
4. limitar magnitud horizontal;
5. no anular gravedad, salto, caída ni navegación vanilla;
6. durante estado inactivo, dejar decaer o cesar el impulso;
7. limpiar estado al perder objetivo.

Probar mobs terrestres, acuáticos y voladores; excluir o adaptar tipos donde el impulso destruya la navegación.

## 14.22 Sticky

**Disparador:** jugador golpea directamente al infernal.
**Cooldown:** 15 segundos.
**Restricción:** no creepers.
**Incompatible:** Storm.

Condiciones:

- atacante jugador;
- jugador no está en creativo;
- tiene una pila en mano principal.

Acción:

1. copiar la pila completa;
2. vaciar la mano;
3. soltar la pila como item entity en el mundo;
4. aplicar retraso de recogida equivalente a 50 ticks si la API lo permite;
5. reproducir sonido apropiado;
6. si falla el spawn del item, restaurar la pila para evitar pérdida.

Debe ser transaccional para impedir duplicación o destrucción por errores.

## 14.23 Storm

**Disparador:** objetivo jugador estable.
**Cooldown:** 25 segundos.
**Incompatible:** Sticky.

Condiciones:

- jugador válido;
- no montado;
- línea de visión;
- distancia mayor de 3;
- exposición al cielo.

Acción:

- invocar `minecraft:lightning_bolt` en la posición del objetivo;
- el rayo debe ser real;
- daño y fuego sobre el objetivo son intencionales y forman parte del comportamiento Java;
- no invocar el rayo sobre el infernal;
- no convertirlo en efecto puramente visual.

Si el caster recibe daño colateral por estar demasiado cerca, primero comprobar que distancia/posición se implementaron correctamente. No añadir inmunidad artificial sin evidencia.

## 14.24 Vengeance

**Disparador:** infernal recibe daño directo.

```text
reflected = min(max(incomingDamage / 2, 1), maxDamage)
```

- aplicar al atacante directo;
- marcar daño interno;
- no cancelar el golpe original;
- no reflejar daño ambiental;
- impedir bucle entre dos mobs con Vengeance.

## 14.25 Weakness

**Disparador:** contacto directo entrante o saliente.
**Efecto:** Weakness durante 120 ticks/6 segundos.

## 14.26 Webber

**Disparador:** objetivo estable o atacante directo.
**Cooldown:** 15 segundos.
**Requisito:** línea de visión.
**Incompatibles:** Gravity y Blastoff.

Colocación:

1. obtener bloque bajo los pies del objetivo;
2. si es aire, colocar `minecraft:web` allí;
3. si no, comprobar el bloque ocupado por el objetivo;
4. si ese bloque es aire, colocar la telaraña;
5. si ninguno es reemplazable, no colocar;
6. reproducir sonido de spider.

La telaraña es permanente como en Java; no programar eliminación automática.

Respetar altura mínima/máxima, chunks cargados y permisos de modificación del mundo.

## 14.27 Wither

**Disparador:** contacto directo entrante o saliente.
**Efecto:** Wither durante 120 ticks/6 segundos.

## 14.28 Unyielding — implementar al final

No implementar una solución provisional.

Requisitos finales:

- cancelar el retroceso hostil producido al recibir golpes;
- no congelar al mob;
- no cancelar gravedad ni movimiento normal;
- no romper impulsos deliberados de otros modificadores;
- funcionar con cuerpo a cuerpo, Knockback, flechas, tridentes, explosiones, iron golem y ravager;
- soportar golpes simultáneos;
- utilizar el método proporcionado por Cesar.

Orden obligatorio: Unyielding se desarrolla después de que los otros 27 modificadores, HUD, comandos y botín estén estables.

---

## 15. Nombres y traducciones

### 15.1 Datos

Portar las claves originales de:

- clase Rare/Ultra/Infernal;
- nombres de modificadores;
- prefijos;
- sufijos;
- nombres conocidos de entidades.

Idiomas mínimos:

- `en_US`;
- `es_ES`;
- `es_MX`.

Conservar IDs internos en inglés y minúsculas; la traducción solo afecta presentación.

### 15.2 Generación

El nombre no es la concatenación de todos los modificadores.

Guardar las elecciones lógicas del nombre:

- modificador elegido para prefijo;
- modificador elegido para sufijo;
- especie/tipo de entidad.

Luego renderizar según idioma disponible.

El nombre debe ser estable: no cambiar al recargar mundo ni cada vez que se mira el mob.

### 15.3 NameTag

No usar el `nameTag` para mostrar la lista completa y la vida. Eso produjo la línea gigantesca observada.

Opciones aceptables:

- nombre generado corto encima del mob;
- o `nameTag` vacío y toda la información en HUD si se decide así.

Nunca más de una línea razonable en `nameTag`.

---

## 16. HUD

### 16.1 Activación

Por jugador:

1. raycast desde la cámara/mirada;
2. localizar entidad infernal señalada;
3. mostrar HUD;
4. conservarlo hasta 3 segundos después de perder la mirada, como Java;
5. retirar al expirar, morir el mob o cambiar dimensión.

### 16.2 Contenido

- clase y nombre generado;
- lista de modificadores dividida en grupos de máximo 5;
- vida actual/máxima;
- barra segmentada;
- color por categoría.

Ejemplo conceptual:

```text
Infernal — Burning Zombie of Lightning
Fiery · Storm · Regen · Darkness · Vengeance
████████░░ 119/130
```

Para más de cinco modificadores, repartir en hasta tres líneas siguiendo el comportamiento visual Java.

### 16.3 Multijugador

El HUD es individual. Cada jugador puede mirar un infernal diferente. No usar `world.sendMessage` ni títulos globales.

### 16.4 Frecuencia

- raycast: no necesariamente cada tick; 2–5 veces por segundo puede bastar;
- vida: actualizar mientras el HUD esté visible;
- evitar enviar el mismo texto si nada cambió.

### 16.5 Preferencia

Guardar por jugador `hudEnabled`. El comando público permite cambiarla.

---

## 17. Botín y experiencia

### 17.1 Cantidad

Al morir un infernal:

```text
extraDrops = ceil(modifierCount / 5)
```

| Modificadores | Drops adicionales |
| ------------: | ----------------: |
|          1–5 |                 1 |
|         6–10 |                 2 |
|        11–15 |                 3 |

Dar además 25 puntos de experiencia, una sola vez.

### 17.2 Tabla Rare/Elite

- iron shovel;
- iron pickaxe;
- iron axe;
- iron sword;
- iron hoe;
- chainmail helmet;
- chainmail boots;
- chainmail chestplate;
- chainmail leggings;
- iron helmet;
- iron boots;
- iron chestplate;
- iron leggings;
- 5 cookies.

### 17.3 Tabla Ultra

- iron hoe;
- bow;
- las 4 piezas de chainmail;
- las 4 piezas de iron;
- las 4 piezas de golden armor;
- 3 golden apples;
- 5 blaze powder;
- enchanted book.

### 17.4 Tabla Infernal

- enchanted book;
- 3 diamonds;
- diamond sword;
- diamond axe;
- diamond hoe;
- diamond pickaxe;
- diamond shovel;
- las 4 piezas de chainmail;
- las 4 piezas de diamond armor;
- 3 ender pearls.

### 17.5 Selección

Usar la tabla que corresponde a la categoría por cantidad efectiva de modificadores. Repetir la selección `extraDrops` veces.

### 17.6 Encantamientos

Para objetos encantables:

- aplicar encantamientos aleatorios válidos;
- evitar combinaciones incompatibles;
- no aplicar encantamientos a objetos que no los aceptan;
- escalar potencia según fuerza/cantidad de modificadores como en Java;
- validar límites Bedrock;
- si un libro encantado no puede construirse de la misma forma, documentar la equivalencia exacta utilizada.

### 17.7 Idempotencia

Una marca `deathProcessed` en memoria debe impedir duplicar loot si varios eventos observan la misma muerte. Limpiarla tras invalidarse la entidad.

---

## 18. Custom commands

Los comandos personalizados son la interfaz oficial. Los `/scriptevent` quedan para pruebas.

### 18.1 Registro

- registrar durante `system.beforeEvents.startup` mediante `customCommandRegistry`;
- usar namespace `infernalmobs`;
- registrar enums antes de comandos que dependan de ellos;
- no intentar cambiar firmas después de inicializar el mundo;
- devolver `CustomCommandResult` claro.

Los callbacks se ejecutan en restricted execution. Toda mutación debe aplazarse con `system.run` después de validar origen y parámetros.

### 18.2 Comandos públicos — permiso `Any`

#### `/infernalmobs:help`

- `cheatsRequired: false`;
- lista comandos disponibles según permiso.

#### `/infernalmobs:info`

- `cheatsRequired: false`;
- inspecciona el infernal señalado;
- muestra nombre, clase, vida y modificadores;
- mensaje útil si no se señala ninguno.

#### `/infernalmobs:modifier <modifier>`

- enum con los 28 IDs;
- explica comportamiento de forma localizada.

#### `/infernalmobs:hud <on|off>`

- guarda preferencia individual;
- confirma estado.

### 18.3 Comandos administrativos — permiso `Admin`

`Admin` permite operadores y excluye command blocks, que es lo deseado para acciones manuales sensibles.

#### `/infernalmobs:config`

Muestra configuración actual, versión de esquema y capacidades detectadas.

#### `/infernalmobs:set <option> <value>`

Opciones:

- `elite_rarity`;
- `ultra_rarity`;
- `infernal_rarity`;
- `health_factor`;
- `max_damage`;
- `cooldown_factor`;
- `health_changes`;
- `hud`;
- `names`;
- `loot`;
- `xp`;
- `debug`.

Usar comandos separados o enums tipados si la API no permite un valor union seguro en una sola firma.

#### `/infernalmobs:modifierconfig <modifier> <on|off>`

Habilita/deshabilita para nuevos spawns. No retirar automáticamente un modificador de mobs existentes salvo comando explícito.

#### `/infernalmobs:make [rare|ultra|infernal|random]`

- actúa sobre entidad señalada;
- rechaza objetivo inelegible;
- no vuelve a multiplicar vida si ya es infernal;
- permite convertir uno existente solo mediante `reroll`.

#### `/infernalmobs:setmods <...>`

Asigna combinación de prueba validando duplicados, blacklist e incompatibilidades. Debido a límites de parámetros, puede ofrecer variantes por lista delimitada o varios parámetros opcionales documentados.

#### `/infernalmobs:remove`

- restaura vida máxima base;
- limita vida actual al nuevo máximo;
- limpia propiedades y cachés;
- limpia efectos/estados propios que sigan activos cuando sea posible;
- no elimina efectos ajenos indistinguibles.

#### `/infernalmobs:reroll [tier]`

Recrea modificadores y nombre de forma segura.

#### `/infernalmobs:scan [radius]`

- máximo seguro de radio;
- lista resumida;
- paginar o truncar salida.

#### `/infernalmobs:debug`

Muestra entidad señalada:

- ID/tipo;
- esquema;
- modificadores ordenados;
- vida base, máxima y actual;
- nombre lógico;
- cooldowns;
- 1UP;
- objetivo;
- flags internos;
- backend de Choke;
- último tick procesado.

#### `/infernalmobs:reload`

Recarga datos persistidos y limpia cachés. No vuelve a registrar comandos.

#### `/infernalmobs:resetconfig confirm`

Requiere confirmación literal.

### 18.4 Comandos para automatización

Si en el futuro se desea soporte de command blocks, registrar comandos específicos con `GameDirectors`; no reducir permisos de los comandos Admin existentes.

---

## 19. Script events de pruebas

No son interfaz para jugadores.

Reservar:

```text
infernalmobs:test
infernalmobs:dump
infernalmobs:benchmark
infernalmobs:scenario
```

Usos:

- generar escenarios deterministas;
- forzar un modificador;
- avanzar cooldowns;
- probar botín muchas veces;
- medir entidades procesadas por tick;
- volcar estado compacto;
- integrar GameTest posteriormente.

En builds públicas pueden permanecer deshabilitados salvo `debug=true`.

---

## 20. Rendimiento

### 20.1 Prohibiciones

- no escanear todas las dimensiones cada tick;
- no ejecutar raycast de HUD por entidad;
- no serializar JSON cada tick;
- no consultar repetidamente componentes invariantes;
- no enviar actionbar si el texto no cambió;
- no mantener referencias inválidas indefinidamente.

### 20.2 Estrategia

- eventos para spawn, daño y muerte;
- caché de infernales activos;
- scheduler distribuido por buckets;
- ticks pasivos cada 20 ticks cuando sea suficiente;
- cooldowns largos comprobados en intervalos razonables;
- HUD por jugador;
- limpieza periódica de caché;
- persistir solo al cambiar estado durable.

### 20.3 Presupuesto

Instrumentar en debug:

- infernales activos;
- modificadores procesados por tick;
- tiempo aproximado por scheduler;
- errores por modificador;
- tamaño de propiedades dinámicas;
- raycasts por segundo.

Un error de una entidad no debe cancelar el procesamiento de las demás.

---

## 21. Manejo de errores

Toda API de entidad puede fallar si esta se invalida entre comprobación y uso.

Reglas:

- validar antes de usar;
- capturar errores en límites de entidad, no envolver toda la aplicación en un `try/catch` silencioso;
- logs detallados solo en debug;
- rate-limit de mensajes repetidos;
- incluir modificador, entidad y operación en el diagnóstico;
- degradar capacidades opcionales como `airSupply` sin detener el addon.

---

## 22. Seguridad e integridad

- comandos públicos no deben permitir seleccionar o modificar entidades arbitrarias;
- comandos Admin confían en el nivel de permiso registrado;
- Sticky debe ser transaccional;
- loot debe ser idempotente;
- nunca ejecutar texto del usuario como comando concatenado;
- validar namespaces/IDs;
- imponer límites a radios, cantidades y listas;
- no almacenar objetos Entity dentro de propiedades persistentes;
- no revelar dumps internos a jugadores sin permiso.

---

## 23. Fases de implementación

## Fase 0 — Congelación de referencia

Entregables:

- registrar commit exacto de AtomicStryker usado como referencia;
- registrar versión de `@minecraft/server`;
- copiar autorización/atribución según corresponda;
- crear tabla de desviaciones conocidas;
- conservar fixtures de configuración predeterminada.

No desarrollar comportamiento hasta fijar la fuente.

## Fase 1 — Núcleo y persistencia

Entregables:

- bootstrap;
- propiedades dinámicas;
- esquema versionado;
- estado procesado no infernal;
- caché de infernales;
- migración del port existente;
- comandos debug mínimos internos.

Criterios:

- recargar mundo no cambia estado;
- descargar chunk no vuelve a tirar spawn;
- no hay doble vida;
- entidades inválidas salen de caché.

## Fase 2 — Generación y vida

Entregables:

- elegibilidad;
- probabilidades encadenadas;
- selección compatible;
- tiers;
- fórmula de vida;
- forced entities/config blacklist.

Prueba estadística sugerida:

- simular al menos 100 000 tiradas con RNG inyectable;
- verificar rangos y proporciones esperadas;
- verificar cero duplicados/incompatibilidades.

## Fase 3 — Pipeline de combate

Entregables:

- daño entrante/saliente;
- resolución directa/proyectil;
- guardas de recursión;
- orden de hooks;
- cooldown service.

No empezar Ender/Ninja/Vengeance antes de que las guardas estén probadas.

## Fase 4 — Modificadores simples

Orden recomendado:

1. Bulwark;
2. Darkness;
3. Exhaust;
4. Fiery;
5. LifeSteal;
6. Poisonous;
7. Quicksand;
8. Regen;
9. Sapper;
10. Weakness;
11. Wither;
12. Vengeance;
13. 1UP.

Cada uno se integra solo después de pasar pruebas aisladas.

## Fase 5 — Modificadores complejos de reacción

1. Berserk;
2. Blastoff;
3. Cloaking;
4. Rust;
5. Sticky;
6. Ender;
7. Ninja.

## Fase 6 — Modificadores de objetivo/mundo

1. Alchemist;
2. Ghastly;
3. Gravity;
4. Webber;
5. Storm;
6. Sprint;
7. Choke con ambos backends.

## Fase 7 — Nombres, traducciones y HUD

- trasladar claves;
- nombre estable;
- raycast por jugador;
- retención 3 s;
- barra de vida;
- preferencia individual;
- eliminar nameTag gigante.

## Fase 8 — Loot y experiencia

- tablas exactas;
- cantidades;
- encantamientos;
- XP;
- idempotencia;
- pruebas estadísticas.

## Fase 9 — Custom commands

- registro startup;
- enums;
- comandos Any;
- comandos Admin;
- mutaciones aplazadas con `system.run`;
- mensajes localizados;
- validación de origen.

## Fase 10 — Compatibilidad y optimización

- singleplayer;
- multijugador;
- servidor dedicado;
- dimensiones;
- mobs vanilla y addons;
- chunks;
- estrés;
- watchdog;
- profiling debug.

## Fase 11 — Unyielding

- recibir el método de Cesar;
- integrarlo sin cambiar el pipeline aprobado;
- comprobar interacción con Blastoff/Gravity;
- ejecutar suite exclusiva de knockback.

## Fase 12 — Cierre 1:1

- ejecutar matriz completa;
- resolver diferencias;
- actualizar README;
- atribución/licencia;
- changelog;
- empaquetado BP/RP;
- prueba en mundo limpio y mundo migrado.

---

## 24. Estrategia de pruebas

### 24.1 RNG determinista

Las funciones aleatorias deben aceptar una fuente inyectable en pruebas. Esto permite reproducir:

- tiers;
- selección de modificadores;
- Alchemist;
- teletransportes;
- loot;
- nombres.

### 24.2 Prueba mínima por modificador

Para cada uno documentar:

```text
precondición
acción
resultado esperado
cooldown esperado
estado persistente afectado
resultado tras recarga
interacción multijugador
caso negativo
```

### 24.3 Matriz de daño

Probar cada modificador relevante con:

- melee de jugador;
- melee de mob;
- flecha;
- tridente;
- explosión;
- fuego;
- caída;
- ahogamiento;
- cactus;
- comando;
- proyectil cuyo dueño ya no es válido.

### 24.4 Multijugador

Casos:

- dos jugadores golpean el mismo infernal;
- infernal cambia de objetivo;
- HUD diferente por jugador;
- Sticky roba al atacante correcto;
- Vengeance refleja al atacante correcto;
- Storm no elige observador cercano incorrecto;
- Choke limpia el objetivo anterior;
- jugador abandona durante cooldown/efecto.

### 24.5 Persistencia

Repetir con:

- salir y entrar al mundo;
- descargar/cargar chunk;
- reiniciar servidor;
- cambiar dimensión;
- actualizar esquema;
- deshabilitar un modificador en config;
- borrar un infernal mediante comando.

### 24.6 Rendimiento

Escenarios:

- 1 infernal con 12 modificadores;
- 20 infernales activos;
- 100 infernales cargados sin combate;
- 10 jugadores observando mobs diferentes;
- tormenta de eventos de daño;
- muchas muertes simultáneas.

No aceptar watchdog, crecimiento permanente de caché ni spam de errores.

---

## 25. Criterios de aceptación globales

El port se considera listo cuando:

- los 28 modificadores pasan su suite;
- las probabilidades y cantidades coinciden con Java;
- vida usa la fórmula exacta;
- no hay incompatibilidades inventadas;
- 1UP cura y no clona;
- Gravity empuja y no atrae;
- Storm usa rayo real sobre el objetivo;
- Sticky suelta la pila correcta sin duplicarla;
- Rust diferencia mano y armadura;
- Choke informa su backend y funciona en estable;
- Unyielding usa la técnica entregada por Cesar;
- el HUD no depende de un nameTag enorme;
- la muerte entrega 25 XP y `ceil(modifiers/5)` premios;
- todos los comandos tienen permisos correctos;
- comandos mutadores difieren ejecución fuera del callback restringido;
- el estado sobrevive recargas;
- no existen loops de reflejo;
- no se recorren todas las entidades cada tick;
- README enumera las diferencias técnicas reales;
- el proyecto se empaqueta sin archivos de desarrollo innecesarios.

---

## 26. Lista de errores conocidos del port actual que deben corregirse

- fórmula de vida incorrecta;
- rangos Ultra/Infernal incorrectos;
- 1UP implementado como clon/revivir;
- Gravity con dirección inversa;
- Sticky simplificado o incorrecto;
- Rust solo sobre mano y dirección equivocada;
- loot simplificado;
- incompatibilidades inventadas;
- nameTag excesivamente largo;
- falta de pipeline central robusto;
- falta de persistencia completa por modificador;
- ausencia de comandos personalizados;
- posibles activaciones por daño ambiental;
- ausencia de paridad detallada de cooldowns/condiciones.

Antes de reutilizar código actual, Antigravity debe evaluar cada función contra esta especificación; no asumir que lo ya escrito es correcto.

---

## 27. Decisiones cerradas

- JavaScript directo.
- API estable 2.10.0 como requisito base.
- `airSupply` por detección de capacidad, con fallback.
- custom commands para usuarios y administradores.
- `/scriptevent` solo para pruebas/debug.
- permisos públicos `Any`.
- permisos administrativos `Admin`.
- entidades vanilla enriquecidas, no reemplazadas.
- Unyielding se implementa de último.
- el rayo de Storm es real y puede dañar/incendiar al objetivo.
- recursos del addon antiguo de 2020 no se reutilizan sin autorización separada.

---

## 28. Preguntas que Antigravity no debe decidir por su cuenta

Detenerse y consultar a Cesar si surge alguna de estas decisiones:

- activar una API experimental obligatoria;
- cambiar balance respecto a Java;
- retirar un modificador por dificultad;
- añadir incompatibilidades nuevas;
- hacer Storm visual solamente;
- modificar botín original;
- usar recursos del addon de 2020;
- reemplazar mobs vanilla;
- cambiar la técnica acordada para Unyielding;
- publicar o subir cambios al repositorio;
- cambiar licencia o atribución.

En cuestiones puramente internas, Antigravity puede elegir la solución más segura siempre que conserve el contrato observable y documente la decisión.

---

## 29. Formato de reporte de progreso para Antigravity

Al terminar cada fase, entregar:

```markdown
## Fase completada

### Archivos modificados
- ...

### Comportamientos implementados
- ...

### Pruebas ejecutadas
- escenario: resultado

### Diferencias respecto a Java
- ninguna / detalle

### Riesgos o pendientes
- ...

### Próxima fase
- ...
```

No afirmar “1:1” únicamente porque el código compila. Cada afirmación debe estar respaldada por una prueba observable.

---

## 30. Instrucción final para Antigravity

Implementa el proyecto por fases y utiliza este documento como contrato. No hagas una reescritura completa en una sola entrega. Antes de cada fase, compara el código Bedrock existente con la fuente Java correspondiente. Después de cada fase, ejecuta sus pruebas y reporta cualquier limitación real de la API.

Prioriza en este orden:

1. corrección funcional;
2. persistencia e integridad;
3. fidelidad al Java;
4. multijugador;
5. rendimiento;
6. presentación.

No publiques, no hagas push y no uses recursos externos no autorizados sin aprobación expresa de Cesar.
