'use client';
/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- Named scroll regions must remain keyboard-scrollable when their purchase controls are disabled. */
import { useState, type CSSProperties } from 'react';
import {
  ArrowRight,
  Check,
  Gem,
  Hand,
  Link2,
  LockKeyhole,
  Orbit,
  Sparkles,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { equipmentStyle } from '@/lib/visuals';
import {
  ROBOTS,
  DOUBLE_UPGRADES,
  SYNERGIES,
  MANUAL_UPGRADES,
  CURRENCIES,
  SPECIALS,
  canBuyDouble,
  canBuySynergy,
  CONVERSION_PACKAGES,
  GALAXY_GROWTH_COST,
  GALAXY_EXCHANGE_COST,
  GALAXY_EXCHANGE_YIELD,
  conversionTarget,
  specialCost,
  specialRequirements,
  paymentPlan,
  galaxyMassReward,
  format,
  type GameState,
  type GameAction,
} from '@/lib/game';

type Props = { game: GameState; onAction: (action: GameAction) => void };
export function ResearchPanel({ game, onAction }: Props) {
  const [category, setCategory] = useState<'double' | 'synergy' | 'manual'>(
    'double',
  );
  return (
    <div className="research-panel lab-panel">
      <div className="research-filters" aria-label="Research category">
        {(
          [
            ['double', 'Tool ×2', 28],
            ['synergy', 'Synergies', 12],
            ['manual', 'Manual clicks', 3],
          ] as const
        ).map(([id, name, count]) => (
          <button
            key={id}
            aria-pressed={category === id}
            onClick={() => setCategory(id)}
          >
            {name} <small>{count}</small>
          </button>
        ))}
      </div>
      <div
        className="lab-scroll"
        tabIndex={0}
        role="region"
        aria-label="Research list"
      >
        <p className="lab-note">
          {category === 'double'
            ? 'Two upgrades per tool. Each gives ×2 output; together they give ×4.'
            : category === 'synergy'
              ? 'Link two tools. Source units boost target output, up to +300%.'
              : 'Permanently increase each manual click. Purchase these upgrades in order.'}
        </p>
        {category === 'double' &&
          DOUBLE_UPGRADES.map((u) => (
            <article
              className={`research-card ${game.doubles[u.id] ? 'researched' : ''}`}
              key={u.id}
            >
              <span
                className="equipment-art"
                style={equipmentStyle(u.tool)}
                aria-hidden="true"
              />
              <div className="research-copy">
                <small>
                  {ROBOTS[u.tool].localName} · Tier {u.tier + 1}
                </small>
                <h3>
                  {u.name} <b>×2</b>
                </h3>
                <p>
                  Own {u.required} units
                  {u.tier ? ' · First upgrade required' : ''}
                </p>
              </div>
              <button
                className="lab-button"
                disabled={!canBuyDouble(game, u.id)}
                onClick={() => onAction({ type: 'double', id: u.id })}
                aria-label={`Buy ${u.name}`}
              >
                {game.doubles[u.id] ? (
                  <>
                    <Check size={15} /> Installed
                  </>
                ) : (
                  <>
                    {format(u.cost)}
                    <small>Base dust</small>
                  </>
                )}
              </button>
            </article>
          ))}
        {category === 'synergy' &&
          SYNERGIES.map((u, i) => (
            <article
              className={`research-card synergy-card ${game.synergies[i] ? 'researched' : ''}`}
              key={u.name}
            >
              <span className="research-icon">
                <Link2 size={22} />
              </span>
              <div className="research-copy">
                <small>
                  {ROBOTS[u.source].localName} → {ROBOTS[u.target].localName}
                </small>
                <h3>{u.name}</h3>
                <p>
                  Target +{Math.round(u.bonus * 100)}% per {u.every} source
                  units · 5 of each tool required
                </p>
              </div>
              <button
                className="lab-button"
                disabled={!canBuySynergy(game, i)}
                onClick={() => onAction({ type: 'synergy', id: i })}
              >
                {game.synergies[i] ? (
                  'Linked'
                ) : (
                  <>
                    {format(u.cost)}
                    <small>Base dust</small>
                  </>
                )}
              </button>
            </article>
          ))}
        {category === 'manual' &&
          MANUAL_UPGRADES.map((u, i) => (
            <article
              className={`research-card ${game.manualLevel > i ? 'researched' : ''}`}
              key={u.name}
            >
              <span className="research-icon">
                <Hand size={22} />
              </span>
              <div className="research-copy">
                <small>Manual clicks · Tier {i + 1}</small>
                <h3>{u.name}</h3>
                <p>Click power ×{u.multiplier} · Stacks with previous tiers</p>
              </div>
              <button
                className="lab-button"
                disabled={game.manualLevel !== i || game.dust < u.cost}
                onClick={() => onAction({ type: 'manual' })}
              >
                {game.manualLevel > i ? (
                  'Active'
                ) : game.manualLevel < i ? (
                  <>
                    <LockKeyhole size={14} /> Previous tier required
                  </>
                ) : (
                  <>
                    {format(u.cost)}
                    <small>Base dust</small>
                  </>
                )}
              </button>
            </article>
          ))}
      </div>
    </div>
  );
}
function CurrencyMark({ index }: { index: number }) {
  return (
    <Gem
      size={16}
      style={{ color: CURRENCIES[index].color }}
      aria-hidden="true"
    />
  );
}
export function Wallet({ game }: { game: GameState }) {
  return (
    <div className="dust-wallet" aria-label="Currency balance">
      {CURRENCIES.map((c, i) => (
        <div key={c.name} style={{ '--dust-color': c.color } as CSSProperties}>
          <span>
            <CurrencyMark index={i} />
            {c.label}
          </span>
          <strong>{format(game.wallet[i], 0)}</strong>
          <small>{c.name}</small>
        </div>
      ))}
    </div>
  );
}
function JokerToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="joker-toggle">
      <span>
        <CurrencyMark index={4} /> Use Spacedust for missing currencies{' '}
        <small>1:1 substitution · Cost shown before use</small>
      </span>
      <Switch
        checked={value}
        onCheckedChange={onChange}
        aria-label="Use Spacedust substitution"
      />
    </label>
  );
}
export function CurrencyPanel({ game, onAction }: Props) {
  const [useJoker, setUseJoker] = useState(false);
  const target = conversionTarget(game.conversionMilestones);
  return (
    <div
      className="lab-scroll currency-panel"
      tabIndex={0}
      role="region"
      aria-label="Currency exchange and permanent upgrades"
    >
      <Wallet game={game} />
      <div className="currency-workbench">
        <div className="currency-converter">
          <section className="lab-card conversion-card">
            <div className="lab-heading">
              <div>
                <small>MATTER CONVERTER</small>
                <h3>
                  <Orbit size={19} /> Dust conversion
                </h3>
              </div>
            </div>
            <p>
              Each package awards its entire amount in one common currency,
              chosen at random. Stardust, Moondust, Galaxydust and Solardust
              each have a 25% chance.
            </p>
            <div className="conversion-packages">
              {CONVERSION_PACKAGES.map((pack, i) => (
                <button
                  key={pack.cost}
                  className="conversion-package"
                  disabled={game.dust < pack.cost}
                  onClick={() => onAction({ type: 'convert', packageId: i })}
                  aria-label={
                    'Convert ' +
                    format(pack.cost) +
                    ' dust into ' +
                    format(pack.amount) +
                    ' random currency'
                  }
                >
                  <span>
                    <small>PAY DUST</small>
                    <b>{format(pack.cost)}</b>
                  </span>
                  <ArrowRight size={20} />
                  <span>
                    <small>RECEIVE</small>
                    <strong>{format(pack.amount)}</strong>
                  </span>
                  <em>
                    {i
                      ? '+' +
                        Math.round((pack.amount / pack.cost - 1) * 100) +
                        '% value'
                      : 'Standard'}
                  </em>
                  <small>
                    2% bonus chance: {pack.joker}–{pack.joker * 2} Spacedust
                  </small>
                </button>
              ))}
            </div>
            <small>
              Spacedust is a separate rare bonus, added to your full package
              reward.
            </small>
            <div className="conversion-meter">
              <span>
                Total converted {format(game.convertedDust)} / {format(target)}
                <b>
                  Spacedust +{1 + Math.floor(game.conversionMilestones / 4)}
                </b>
              </span>
              <progress
                value={Math.min(1, game.convertedDust / target)}
                max={1}
                aria-label="Total converted reward progress"
              />
              <small>
                Convert {format(Math.max(0, target - game.convertedDust))} more
                dust for a guaranteed reward
              </small>
            </div>
          </section>
          <section className="lab-card galaxy-exchange">
            <h3>
              <CurrencyMark index={2} /> Galaxydust exchange
            </h3>
            <p>
              Growth adds mass only. Exchange 1K Galaxydust for 600 of another
              common currency.
            </p>
            <div className="galaxy-options">
              <button
                className="lab-button"
                disabled={game.wallet[2] < GALAXY_GROWTH_COST}
                onClick={() => onAction({ type: 'exchange', target: -1 })}
              >
                Mass +{format(galaxyMassReward(game))}
                <small>{format(GALAXY_GROWTH_COST)} Galaxydust</small>
              </button>
              {[0, 1, 3].map((i) => (
                <button
                  className="lab-button"
                  key={i}
                  disabled={game.wallet[2] < GALAXY_EXCHANGE_COST}
                  onClick={() => onAction({ type: 'exchange', target: i })}
                >
                  {CURRENCIES[i].label} +{format(GALAXY_EXCHANGE_YIELD)}
                  <small>{format(GALAXY_EXCHANGE_COST)} Galaxydust</small>
                </button>
              ))}
            </div>
          </section>
        </div>
        <div className="currency-upgrades">
          <JokerToggle value={useJoker} onChange={setUseJoker} />
          <div className="lab-heading">
            <h3>Permanent upgrades</h3>
            <small>Costs rise with each level</small>
          </div>
          {SPECIALS.map((u, i) => {
            const level = game.specialLevels[i],
              plan = paymentPlan(game, specialRequirements(game, i), useJoker),
              maxed = level >= u.max;
            return (
              <article className="research-card special-card" key={u.name}>
                <span className="research-icon">
                  <CurrencyMark index={u.currency} />
                </span>
                <div className="research-copy">
                  <small>
                    LV. {level} / {u.max} · Permanent effect
                  </small>
                  <h3>{u.name}</h3>
                  <p>
                    {u.detail} +{Math.round(level * u.step * 100)}%
                    {!maxed && ` → +${Math.round((level + 1) * u.step * 100)}%`}
                  </p>
                  <small>
                    {!maxed &&
                      `${CURRENCIES[u.currency].name} ${format(specialCost(game, i))}`}
                    {!maxed &&
                      useJoker &&
                      plan.spent[4] > 0 &&
                      ` · Uses ${format(plan.spent[4])} Spacedust`}
                  </small>
                </div>
                <button
                  className="lab-button"
                  disabled={maxed || !plan.affordable}
                  onClick={() => onAction({ type: 'special', id: i, useJoker })}
                >
                  {maxed ? 'Max level' : 'Upgrade'}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
export { ConstellationPanel } from './constellation-workshop';
