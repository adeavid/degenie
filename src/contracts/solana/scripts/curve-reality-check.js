#!/usr/bin/env node

/**
 * Reality Check: Bonding Curves in Practice
 * What actually works vs theory
 */

const LAMPORTS_PER_SOL = 1_000_000_000;

class CurveRealityCheck {
    constructor() {
        this.initialPrice = 1000; // 0.001 SOL
    }

    analyzeRealWorld() {
        console.log('🎯 BONDING CURVES: TEORÍA vs REALIDAD\n');

        console.log('📊 DATOS DUROS DE PUMP.FUN:');
        console.log('- Solo 1.41% de tokens completan la curva');
        console.log('- 98.6% FALLAN antes de llegar a Raydium');
        console.log('- Graduación a $69k market cap');
        console.log('- $12k liquidez depositada en Raydium\n');

        console.log('💡 TOKENS EXITOSOS Y SUS PATRONES:');
        console.log('┌─────────────────┬──────────────┬─────────────────────────────┐');
        console.log('│ Token           │ Multiplicador│ Observación                 │');
        console.log('├─────────────────┼──────────────┼─────────────────────────────┤');
        console.log('│ $SC (Shark Cat) │ 100x+        │ Días para llegar a $100M    │');
        console.log('│ $MICHI          │ 200x+        │ Rompió $200M market cap     │');
        console.log('│ $GME            │ 30x          │ Meme conocido + timing      │');
        console.log('│ $JENNER         │ 160x         │ Una noche, puro FOMO        │');
        console.log('│ $PNUT           │ Variable     │ Comunidad fuerte            │');
        console.log('└─────────────────┴──────────────┴─────────────────────────────┘\n');

        this.explainWhyCurvesWork();
    }

    explainWhyCurvesWork() {
        console.log('🧠 POR QUÉ FUNCIONA CADA CURVA:\n');

        console.log('1️⃣ CURVA LINEAL:');
        console.log('   Precio = Base + (Incremento × Supply)');
        console.log('   ✅ Justo matemáticamente');
        console.log('   ❌ NO crea urgencia de compra');
        console.log('   ❌ NO recompensa risk-takers');
        console.log('   📊 Resultado: Tokens mueren sin hype\n');

        console.log('2️⃣ CURVA EXPONENCIAL (1-2%):');
        console.log('   Precio = Base × (1.01)^(Supply/1000)');
        console.log('   ✅ Crea FOMO controlado');
        console.log('   ✅ Early buyers ganan 10-20x');
        console.log('   ✅ Aún accesible en etapas medias');
        console.log('   📊 Resultado: Balance óptimo\n');

        console.log('3️⃣ CURVA EXPONENCIAL (5%+):');
        console.log('   Precio = Base × (1.05)^(Supply/1000)');
        console.log('   ❌ Precio explota muy rápido');
        console.log('   ❌ Solo 100 personas pueden comprar barato');
        console.log('   ❌ Se ve como scam/ponzi');
        console.log('   📊 Resultado: Pump & dump inevitable\n');

        this.showPriceProgression();
    }

    showPriceProgression() {
        console.log('💰 PROGRESIÓN DE PRECIO CON $100 DE INVERSIÓN:\n');

        const investment = 100; // $100 USD
        const solPrice = 150; // $150 per SOL
        const solInvested = investment / solPrice;
        const lamportsInvested = solInvested * LAMPORTS_PER_SOL;

        console.log(`Inversión: $${investment} = ${solInvested.toFixed(3)} SOL\n`);

        const curves = [
            { name: 'Linear', rate: 0 },
            { name: 'Exp 1%', rate: 100 },
            { name: 'Exp 2%', rate: 200 },
            { name: 'Exp 5%', rate: 500 }
        ];

        const stages = [
            { supply: 1000, stage: 'Muy temprano' },
            { supply: 10000, stage: 'Temprano' },
            { supply: 50000, stage: 'Medio' },
            { supply: 100000, stage: 'Tarde' },
            { supply: 500000, stage: 'Muy tarde' }
        ];

        curves.forEach(curve => {
            console.log(`\n${curve.name.toUpperCase()}:`);
            console.log('Etapa        | Tokens obtenidos | Valor si llega a $69k');
            console.log('-------------|------------------|---------------------');

            stages.forEach(stage => {
                let price;
                if (curve.rate === 0) {
                    // Linear
                    price = this.initialPrice + (100 * stage.supply / 1000);
                } else {
                    // Exponential
                    const scaleFactor = 1000;
                    const supplyScaled = Math.floor(stage.supply / scaleFactor);
                    const growthMultiplier = 1 + (curve.rate / 10000);
                    price = Math.floor(this.initialPrice * Math.pow(growthMultiplier, supplyScaled));
                }

                const tokensObtained = Math.floor(lamportsInvested / price);
                const valueAt69k = (tokensObtained * 0.000086 * solPrice).toFixed(0);

                console.log(`${stage.stage.padEnd(12)} | ${tokensObtained.toString().padEnd(16)} | $${valueAt69k}`);
            });
        });

        this.showRecommendations();
    }

    showRecommendations() {
        console.log('\n\n🎯 RECOMENDACIONES BASADAS EN DATOS:\n');

        console.log('1. GROWTH RATE CONFIGURABLE: ❌ NO RECOMENDADO');
        console.log('   - Confunde a los usuarios');
        console.log('   - Mayoría elegiría rates muy altos (codicia)');
        console.log('   - Crearía muchos scams\n');

        console.log('2. MEJOR ESTRATEGIA: EXPONENCIAL 1%');
        console.log('   - Probado por pump.fun');
        console.log('   - Balance entre FOMO y sostenibilidad');
        console.log('   - Permite que miles participen\n');

        console.log('3. POR QUÉ NO LINEAL:');
        console.log('   - Sin incentivo para comprar temprano');
        console.log('   - No genera emoción/FOMO');
        console.log('   - Históricamente no funciona para memecoins\n');

        console.log('4. DIFERENCIADOR DE DEGENIE:');
        console.log('   - NO cambiar la curva (1% está bien)');
        console.log('   - SÍ dar 0.5% revenue share a creators');
        console.log('   - SÍ integrar AI marketing desde día 1');
        console.log('   - SÍ predecir virality con ML\n');

        console.log('📌 CONCLUSIÓN:');
        console.log('La curva exponencial 1% NO es "injusta", es PSICOLOGÍA DE MERCADO.');
        console.log('Los memecoins son especulación pura - la gente QUIERE la posibilidad de 10-100x.');
        console.log('Una curva "justa" (lineal) = token muerto sin volumen.\n');

        console.log('🚀 MANTÉN EL 1% Y ENFÓCATE EN:');
        console.log('1. Graduación automática a Raydium');
        console.log('2. AI para contenido viral');
        console.log('3. Revenue share para creators');
        console.log('4. Mejor UX que pump.fun');
    }
}

// Run analysis
if (require.main === module) {
    const analysis = new CurveRealityCheck();
    analysis.analyzeRealWorld();
}

module.exports = CurveRealityCheck;