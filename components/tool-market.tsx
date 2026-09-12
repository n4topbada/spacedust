'use client';
/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- The tool catalog needs keyboard scrolling even when every purchase is disabled. */
import {
  Bot,
  FlaskConical,
  LockKeyhole,
  Radio,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResearchPanel } from '@/components/progression-panels';
import {
  ROBOTS,
  MAX_TOOLS,
  TOOL_LEVELS,
  quote,
  robotRate,
  toolLevel,
  toolUnlocked,
  toolUnlockLabel,
  format,
  type GameState,
  type GameAction,
} from '@/lib/game';
import { equipmentStyle } from '@/lib/visuals';

type Props = {
  game: GameState;
  quantity: number | 'max';
  onQuantity: (value: number | 'max') => void;
  onPurchase: (index: number) => void;
  onAction: (action: GameAction) => void;
  onCraft: () => void;
};
export function ToolMarket({
  game,
  quantity,
  onQuantity,
  onPurchase,
  onAction,
  onCraft,
}: Props) {
  return (
    <aside className="equipment-shop" aria-label="Tools and research">
      <div className="equipment-heading">
        <div>
          <span className="eyebrow">COLLECTION SYSTEM</span>
          <h2>
            Tools & research{' '}
            <span>
              {ROBOTS.filter((_, i) => toolUnlocked(game, i)).length} / 14
            </span>
          </h2>
        </div>
        <button className="craft-entry lab-button" onClick={onCraft}>
          <Sparkles size={17} /> Craft
        </button>
      </div>
      <Tabs defaultValue="tools" className="equipment-tabs">
        <TabsList className="shop-tab-list">
          <TabsTrigger value="tools">
            <Bot size={16} /> Tools
          </TabsTrigger>
          <TabsTrigger value="research">
            <FlaskConical size={16} /> Research
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tools" className="equipment-panel">
          <div className="equipment-toolbar">
            <span>Click a tool to purchase</span>
            <div className="quantity-options" aria-label="Purchase quantity">
              {([1, 10, 'max'] as const).map((n) => (
                <button
                  key={n}
                  aria-pressed={quantity === n}
                  className={quantity === n ? 'active' : ''}
                  onClick={() => onQuantity(n)}
                >
                  {n === 'max' ? 'Max' : `×${n}`}
                </button>
              ))}
            </div>
          </div>
          <div className="tool-list-heading" aria-hidden="true">
            <span>COLLECTOR</span>
            <span>PRICE</span>
            <span>OWNED</span>
          </div>
        <div className="tool-market-list" role="region" aria-label="Tool catalog" tabIndex={0}>
            {ROBOTS.map((tool, i) => {
              const owned = game.robots[i],
                locked = !toolUnlocked(game, i),
                offer = quote(game, i, quantity),
                level = toolLevel(owned),
                maxed = owned >= MAX_TOOLS;
              const available =
                !locked && !maxed && offer.count > 0 && game.dust >= offer.cost;
              return (
                <button
                  key={tool.id}
                  className={`tool-purchase-row ${locked ? 'locked' : ''} ${available ? 'affordable' : ''} ${owned ? 'working' : ''}`}
                  onClick={() => onPurchase(i)}
                  disabled={!available}
                  aria-label={`Buy ${offer.count || (quantity === 'max' ? 1 : quantity)} ${tool.name} for ${format(offer.cost || tool.base)} dust`}
                  title={tool.desc}
                >
                  <span className="tool-portrait">
                    <span
                      className="equipment-art"
                      style={equipmentStyle(i)}
                      aria-hidden="true"
                    />
                    <small>{String(i + 1).padStart(2, '0')}</small>
                  </span>
                  <span className="tool-purchase-copy">
                    <strong>{tool.name}</strong>
                    <small>{tool.model}</small>
                    <span>
                      {locked ? (
                        <>
                          <LockKeyhole size={12} /> Requires{' '}
                          {toolUnlockLabel(i)}
                        </>
                      ) : (
                        <>
                          <Zap size={12} />{' '}
                          {format(owned ? robotRate(game, i) : tool.rate)}/s{' '}
                          {owned ? 'total' : 'per unit'}
                        </>
                      )}
                    </span>
                  </span>
                  <span className="tool-price">
                    <b>
                      {maxed
                        ? 'Max owned'
                        : locked
                          ? 'Locked'
                          : !offer.count
                            ? 'Need dust'
                            : format(offer.cost)}
                    </b>
                    {!maxed && !locked && (
                      <small>
                        {offer.count ? `+${offer.count} units` : 'dust'}
                      </small>
                    )}
                  </span>
                  <span className="tool-owned">
                    <b>{owned}</b>
                    <small>Lv.{level}</small>
                    <span className="owned-meter" aria-hidden="true">
                      <i
                        style={{
                          width: `${Math.min(100, (owned / (TOOL_LEVELS[level] ?? 300)) * 100)}%`,
                        }}
                      />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="equipment-tip">
            <Radio size={14} /> Output doubles at 25, 75, 150 and 300 owned
            units.
          </p>
        </TabsContent>
        <TabsContent value="research" className="progression-tab">
          <ResearchPanel game={game} onAction={onAction} />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
