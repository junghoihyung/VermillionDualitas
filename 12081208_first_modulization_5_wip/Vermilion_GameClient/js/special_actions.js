// Vermilion_GameClient/js/special_actions.js
const SpecialActions = {
    startBurn: () => {
        State.interaction.mode = 'BURN_SELECT';
        Logger.sys("🔥 <b>BURNING</b>: Select a card to sacrifice.");
        Renderer.renderHand();
    },
    executeBurn: (idx) => {
        const card = State.player.hand.splice(idx, 1)[0];
        State.player.discard.push(card);
        State.player.diceSupply.white++; // Default to White for prototype
        Logger.log(`🔥 Burnt [${card.name}]. +1 ⬜ Die.`);
        State.interaction.mode = 'IDLE';
        Renderer.renderHand();
        Renderer.renderSidePanel();
    },
    startCondense: () => {
        if (State.player.diceSupply.white + State.player.diceSupply.red <= 0) {
            Logger.warn("Not enough dice!"); return;
        }
        // Priority: Pay White
        if (State.player.diceSupply.white > 0) { State.player.diceSupply.white--; Logger.log("💧 Condensed: Paid 1 ⬜."); }
        else { State.player.diceSupply.red--; Logger.log("💧 Condensed: Paid 1 🟥."); }

        // "Search" Effect -> Draw 1 (Simulated)
        Engine.drawCard(1);
        Renderer.renderSidePanel();
    }
};
