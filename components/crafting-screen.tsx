'use client';
import { ArrowLeft, Gem, Star, Zap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ConstellationPanel,
  CurrencyPanel,
} from '@/components/progression-panels';
import {
  format,
  production,
  type GameState,
  type GameAction,
} from '@/lib/game';

export function CraftingScreen({
  game,
  onAction,
  onBack,
}: {
  game: GameState;
  onAction: (action: GameAction) => void;
  onBack: () => void;
}) {
  return (
    <section className="crafting-screen" aria-label="Crafting workshop">
      <header className="crafting-header">
        <button className="lab-button" onClick={onBack}>
          <ArrowLeft size={17} /> Back to universe
        </button>
        <div>
          <small>ORBITAL WORKSHOP</small>
          <h1>Craft</h1>
        </div>
        <div className="crafting-balance">
          <strong>
            {format(game.dust)} <small>dust</small>
          </strong>
          <span>
            <Zap size={13} /> +{format(production(game))}/s · Collectors active
          </span>
        </div>
      </header>
      <Tabs defaultValue="constellations" className="crafting-tabs">
        <TabsList className="crafting-tab-list">
          <TabsTrigger value="constellations">
            <Star size={17} /> Constellations
          </TabsTrigger>
          <TabsTrigger value="currencies">
            <Gem size={17} /> Currencies & shop
          </TabsTrigger>
        </TabsList>
        <TabsContent value="constellations" className="crafting-content">
          <ConstellationPanel game={game} onAction={onAction} />
        </TabsContent>
        <TabsContent value="currencies" className="crafting-content">
          <CurrencyPanel game={game} onAction={onAction} />
        </TabsContent>
      </Tabs>
    </section>
  );
}
