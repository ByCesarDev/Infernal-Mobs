# Infernal Mobs Bedrock

Port autorizado de **AtomicStryker's Infernal Mobs** para Minecraft Bedrock Edition estable 1.26.x.

## Estado

Versión inicial `0.1.0`. Incluye:

- Conversión aleatoria de criaturas hostiles vanilla y compatibles de otros addons.
- Niveles Elite, Ultra e Infernal.
- Los 28 modificadores presentes en la versión actual del código fuente de Java.
- Vida ampliada, nombre con vida y modificadores, persistencia y botín por nivel.
- Soporte multijugador basado en lógica del servidor.
- Comando de pruebas mediante `/scriptevent`.

## Instalación

Importa `InfernalMobsBedrock.mcaddon` y activa ambos packs en el mundo. El Behavior Pack enlaza automáticamente el Resource Pack. No requiere APIs experimentales.

## Prueba rápida

1. Invoca un mob hostil.
2. Ponte a menos de 12 bloques.
3. Ejecuta uno de estos comandos con trucos activados:

```mcfunction
/scriptevent infernal:spawn elite
/scriptevent infernal:spawn ultra
/scriptevent infernal:spawn infernal
```

El comando transforma el mob hostil más cercano.

## Configuración

Edita `behavior_pack/scripts/config.js`:

- `eliteRarity`: probabilidad base; `15` equivale a 1 entre 15.
- `ultraRarity`: posibilidad de que un Elite ascienda a Ultra.
- `infernalRarity`: posibilidad de que un Ultra ascienda a Infernal.
- `healthPerModifier`: vida adicional por cada modificador.
- `entityBlacklist`, `dimensionsBlacklist` y `modifiersDisabled`.

## Modificadores

`1UP`, `Alchemist`, `Berserk`, `Blastoff`, `Bulwark`, `Choke`, `Cloaking`,
`Darkness`, `Ender`, `Exhaust`, `Fiery`, `Ghastly`, `Gravity`, `LifeSteal`,
`Ninja`, `Poisonous`, `Quicksand`, `Regen`, `Rust`, `Sapper`, `Sprint`,
`Sticky`, `Storm`, `Unyielding`, `Vengeance`, `Weakness`, `Webber` y `Wither`.

Algunas mecánicas están adaptadas a las capacidades de Bedrock. Por ejemplo, Webber inmoviliza mediante efectos en vez de colocar telarañas y la información del mob se muestra con su `nameTag` en lugar de la interfaz de Forge.

## Desarrollo

Los scripts son JavaScript ES modules directos; no existe paso de compilación.

```bash
npm install
npm run check
npm run pack
```

## Créditos y autorización

- Diseño y mod original: AtomicStryker.
- Port para Minecraft Bedrock: CesarDev.
- Código fuente original: https://github.com/AtomicStryker/atomicstrykers-minecraft-mods

Este proyecto se distribuye con autorización del titular del mod original. Antes de una publicación pública, adjunta la autorización o conserva una referencia verificable a ella y acuerda con AtomicStryker la licencia final del port.
