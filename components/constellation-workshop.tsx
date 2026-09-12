'use client';
/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- This named crafting region must stay keyboard-scrollable when actions are disabled. */
import { useState } from 'react';
import { Check, Gem, Gift, LockKeyhole, Star, Zap } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { equipmentStyle } from '@/lib/visuals';
import {
  CONSTELLATIONS,
  CONSTELLATION_MAPS,
  STAR_COUNTS,
  STAR_STARTS,
  TOTAL_STARS,
  ROBOTS,
  CURRENCIES,
  DOUBLE_UPGRADES,
  completedSets,
  starRecipe,
  craftReadiness,
  constellationMultiplier,
  starBonusCount,
  format,
  type GameState,
  type GameAction,
} from '@/lib/game';

function Material({
  name,
  have,
  need,
  substitute = false,
}: {
  name: string;
  have: number;
  need: number;
  substitute?: boolean;
}) {
  return (
    <div
      className={
        have >= need || substitute ? 'material-ready' : 'material-missing'
      }
    >
      <span>{name}</span>
      <b>
        {format(have)} / {format(need)}
      </b>
      {have >= need ? (
        <Check size={13} />
      ) : substitute ? (
        <Gem size={13} />
      ) : (
        <LockKeyhole size={13} />
      )}
    </div>
  );
}
export function ConstellationPanel({
  game,
  onAction,
}: {
  game: GameState;
  onAction: (action: GameAction) => void;
}) {
  const [viewStar, setViewStar] = useState<number | null>(null),
    [useJoker, setUseJoker] = useState(false);
  const sets = completedSets(game),
    selectedStar = viewStar ?? Math.min(game.stars, TOTAL_STARS - 1),
    recipe = starRecipe(selectedStar);
  const selected = recipe.set,
    start = STAR_STARTS[selected],
    map = CONSTELLATION_MAPS[selected],
    readiness = craftReadiness(game, useJoker);
  const isCurrent = selectedStar === game.stars && game.stars < TOTAL_STARS,
    completed = selectedStar < game.stars,
    available = isCurrent && readiness.available;
  const payment = isCurrent ? readiness.payment : null;
  const nextUnlock = sets < 5 ? 5 : sets < 10 ? 10 : sets < 15 ? 15 : null;
  return (
    <div
      className="lab-scroll constellation-panel"
      tabIndex={0}
      role="region"
      aria-label="Constellation crafting"
    >
      <div className="constellation-summary">
        <div>
          <small>CONSTELLATION ARCHIVE</small>
          <h3>Build your star charts</h3>
        </div>
        <span>
          <b>{sets}</b> / 15 sets{' '}
          <small>
            {game.stars} / {TOTAL_STARS} stars
          </small>
        </span>
      </div>
      <div className="set-picker" aria-label="Choose a constellation">
        {CONSTELLATIONS.map((name, i) => (
          <button
            key={name}
            onClick={() =>
              setViewStar(i === completedSets(game) ? null : STAR_STARTS[i])
            }
            aria-label={`Set ${i + 1}: ${name}`}
            aria-pressed={selected === i}
            className={i < sets ? 'complete-set' : ''}
          >
            {i < sets ? <Check size={13} /> : String(i + 1).padStart(2, '0')}
          </button>
        ))}
      </div>
      <section className="star-map-card">
        <svg
          className="constellation-map"
          viewBox="0 0 300 195"
          role="group"
          aria-label={`${CONSTELLATIONS[selected]}: ${STAR_COUNTS[selected]} stars`}
        >
          {map.edges.map(([a, b], i) => (
            <line
              key={i}
              x1={map.points[a]![0]}
              y1={map.points[a]![1]}
              x2={map.points[b]![0]}
              y2={map.points[b]![1]}
              className={
                game.stars > start + a && game.stars > start + b ? 'lit' : ''
              }
            />
          ))}
          {map.points.map(([x, y], i) => (
            <g
              key={i}
              role="button"
              tabIndex={0}
              aria-label={`Star ${i + 1}, ${game.stars > start + i ? 'complete' : game.stars === start + i ? 'next to craft' : 'preview recipe'}`}
              aria-pressed={recipe.node === i}
              onClick={() => setViewStar(start + i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setViewStar(start + i);
                }
              }}
              className={`${game.stars > start + i ? 'lit' : game.stars === start + i ? 'next-star' : ''} ${recipe.node === i ? 'selected-star' : ''}`}
            >
              <circle cx={x} cy={y} r="20" className="star-halo" />
              <circle cx={x} cy={y} r="6" />
              <text x={x} y={y + 34}>
                {i + 1}
              </text>
            </g>
          ))}
        </svg>
        <div>
          <small>
            SET {String(selected + 1).padStart(2, '0')} ·{' '}
            {STAR_COUNTS[selected]} STARS
          </small>
          <h3>{CONSTELLATIONS[selected]}</h3>
          <p>
            {selected < sets
              ? 'Constellation complete'
              : selected > sets
                ? 'Complete the earlier sets to unlock'
                : `Next objective: star ${game.stars - start + 1}`}
          </p>
          <span>
            <Star size={14} /> Each star: output +2% · click +1%
          </span>
          <span>
            <Zap size={14} /> Each set: output ×1.18
          </span>
          <small>Choose a star to inspect its materials.</small>
        </div>
      </section>
      <div className="constellation-buffs">
        <span>
          Collection multiplier{' '}
          <b>×{constellationMultiplier(game).toFixed(2)}</b>
        </span>
        <span>
          Click bonus <b>+{starBonusCount(game)}%</b>
        </span>
        {game.legacyStarCredit > 0 && (
          <small>
            Includes {game.legacyStarCredit} preserved legacy star bonuses.
          </small>
        )}
      </div>
      <div className="unlock-milestones">
        {[5, 10, 15].map((n, i) => (
          <div key={n} className={sets >= n ? 'unlocked' : ''}>
            <span
              className="equipment-art"
              style={equipmentStyle(11 + i)}
              aria-hidden="true"
            />
            <span>
              {n} sets<b>{ROBOTS[11 + i].name}</b>
            </span>
            {sets >= n ? <Check size={14} /> : <LockKeyhole size={14} />}
          </div>
        ))}
      </div>
      <section
        className={`lab-card recipe-card ${completed ? 'completed-recipe' : ''}`}
      >
        <div className="lab-heading">
          <h3>
            {completed ? <Check size={17} /> : <Star size={17} />} Star{' '}
            {recipe.node + 1} {completed ? 'complete' : 'recipe'}
          </h3>
          <small>Growth +{format(recipe.mass)} mass</small>
        </div>
        <p className="consumption-note">
          {completed
            ? 'This star is complete. Its permanent bonus is active.'
            : 'Crafting consumes every listed material. Used tools reduce your owned count and may lower their level.'}
        </p>
        <div className="recipe-materials">
          <Material name="Base dust" have={game.dust} need={recipe.dust} />
          {recipe.tools.map((t) => (
            <Material
              key={t.id}
              name={ROBOTS[t.id].name}
              have={game.robots[t.id]}
              need={t.count}
            />
          ))}
          {recipe.upgrade !== null && (
            <Material
              name={`${DOUBLE_UPGRADES[recipe.upgrade].name} research`}
              have={game.doubles[recipe.upgrade] ? 1 : 0}
              need={1}
            />
          )}
          {recipe.currencies.map(
            (need, i) =>
              need > 0 && (
                <Material
                  key={i}
                  name={CURRENCIES[i].name + (i === 4 ? ' (required)' : '')}
                  have={game.wallet[i]}
                  need={need}
                  substitute={i < 4 && useJoker && payment?.affordable}
                />
              ),
          )}
        </div>
        {!completed && recipe.set >= 5 && (
          <>
            <label className="joker-toggle">
              <span>
                <Gem size={16} /> Substitute missing currencies
                <small>Spacedust replaces common currencies 1:1.</small>
              </span>
              <Switch
                checked={useJoker}
                onCheckedChange={setUseJoker}
                aria-label="Use Spacedust substitution"
              />
            </label>
            {payment && payment.spent[4] > 0 && (
              <p className={payment.affordable ? 'joker-cost' : 'missing-cost'}>
                Spacedust cost: {format(payment.spent[4])} (
                {format(payment.requiredJoker)} required +{' '}
                {format(payment.substituted)} substitution) · Owned{' '}
                {format(game.wallet[4])}
              </p>
            )}
          </>
        )}
        <button
          className="lab-button prominent craft-button"
          disabled={!available}
          onClick={() => {
            onAction({ type: 'craft', useJoker });
            setViewStar(null);
          }}
        >
          <Star size={17} />
          {completed
            ? 'Star complete'
            : !isCurrent
              ? 'Complete earlier stars first'
              : available
                ? 'Use materials & craft star'
                : 'Gather required materials'}
        </button>
        {!isCurrent && game.stars < TOTAL_STARS && (
          <button
            className="lab-button current-star-link"
            onClick={() => setViewStar(null)}
          >
            Go to current star
          </button>
        )}
      </section>
      <section className="lab-card lucky-box">
        <Gift size={28} />
        <div>
          <h3>
            Lucky boxes <b>{game.luckyBoxes}</b>
          </h3>
          <p>
            Set reward · Currencies 55% · Dust 30% · Growth 14% · Spacedust 1%
          </p>
        </div>
        <button
          className="lab-button"
          disabled={!game.luckyBoxes}
          onClick={() => onAction({ type: 'box' })}
        >
          Open
        </button>
      </section>
      <p className="lab-note">
        {nextUnlock
          ? `${nextUnlock - sets} more sets to unlock ${ROBOTS[10 + nextUnlock / 5].name}.`
          : 'All constellations complete. The final tool is unlocked.'}
      </p>
    </div>
  );
}
