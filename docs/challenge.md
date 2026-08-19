# Twin your Neobank — Challenge

> Fuente: https://twinfinance.notion.site/twin-your-neobank (LATAM Digital Assets Conference)

Armá tu propio neobanco integrando las stablecoins de Twin. En 24h se construye una wallet
de punta a punta (conexión, balance y transferencias) con el stack que prefieras.

## Formato
- Equipos de 2 personas (se puede solo).
- 24 horas.
- Stablecoins de Twin disponibles; integrar más de una suma puntos.

## Milestones (criterio de evaluación)
1. **M1** — Integrar balance y transfers de **ARGt**.
2. **M2** — Integrar el **vault de terceros (Morpho)** donde puede depositarse ARGt.
3. **M3** — Integrar el **bridge de ARGt** para moverse entre chains.
4. **Bonus** — Sumar una Twin stablecoin adicional.

## Entrega
- Cierra **jueves 20 de agosto, 18 h**.
- Formulario de submission en la página de Notion.
- Requiere: URL donde hosteaste la wallet, nombre, mail, handle de X (opcional).
- Consultas: Discord https://discord.gg/9BTkAe4waB

## Contratos y direcciones

### Token — ARGt (ERC-20, 18 decimals)
| Chain | Chain ID | Address |
|---|---|---|
| Arbitrum | 42161 | `0x59863989d080B22476DB95656d0C3CC18be92214` |

### M2 — Vault (ERC-4626, Morpho) en Arbitrum
- Vault "ARGt Prime": `0x9Dd3F844747AB78d616BF76DB92756E17A064aDD`
- Asset subyacente: ARGt (address de arriba)
- Interfaz estándar ERC-4626: `deposit`, `mint`, `withdraw`, `redeem`, `previewX`, `convertToX`, `balanceOf`.

### M3 — Bridge (OFT LayerZero V2), un adapter por chain
| Chain | Chain ID | LayerZero EID | Adapter |
|---|---|---|---|
| Arbitrum | 42161 | 30110 | `0x4821FBf47B261F0D52Ba0F941CF67b8648f82691` |
| Base | 8453 | 30184 | `0xe80Af1d12426dB4394b147e04f179a38e7C5Dfe7` |
| Polygon | 137 | 30109 | `0xD70ad085684b2A9f4B5d54D7BDB2ecA37a273216` |

Ethereum **no** está soportado en el bridge.

**Flujo del bridge (OFT V2):**
1. `approve` ARGt al adapter de la chain de origen.
2. `quoteSend(sendParam, false)` → devuelve `nativeFee`.
3. `send(sendParam, fee, refundAddress)` pagando `msg.value = nativeFee` (quema en origen, mintea en destino).

`sendParam = { dstEid, to (bytes32 del receiver), amountLD, minAmountLD, extraOptions, composeMsg, oftCmd }`.

El ABI del adapter está en `frontend/src/lib/abis/bridgeAdapter.ts` (fuente original: `bridge-adapter-abi.ts`).

> Twin Stablecoins son instrumentos de pago digital respaldados por reservas. No son valores
> negociables ni productos de inversión.
