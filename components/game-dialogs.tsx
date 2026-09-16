'use client';
import { useState } from 'react';
import {
  ArrowRight,
  AudioLines,
  Bot,
  Hand,
  Orbit,
  Sparkles,
  Telescope,
  Volume2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { celestialStyle } from '@/lib/visuals';
import {
  STAGES,
  FINAL_STAGE,
  stageIndex,
  format,
  type GameState,
} from '@/lib/game';

export type GameModal = 'help' | 'settings' | 'journey' | 'complete' | null;
type Props = {
  game: GameState;
  modal: GameModal;
  onClose: () => void;
  onPreferenceChange: (key: 'sound' | 'reducedMotion', value: boolean) => void;
  onSave: () => void;
  onReset: () => void;
};

export function GameDialogs({
  game,
  modal,
  onClose,
  onPreferenceChange,
  onSave,
  onReset,
}: Props) {
  const [confirmReset, setConfirmReset] = useState(false);
  const stage = stageIndex(game.mass);
  const robotsOwned = game.robots.reduce((total, count) => total + count, 0);
  return (
    <Dialog
      open={modal !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          setConfirmReset(false);
        }
      }}
    >
      <DialogContent
        className={`game-dialog expanded-dialog ${modal === 'journey' ? 'journey-dialog' : ''}`}
      >
        <DialogTitle>
          {modal === 'settings'
            ? 'Universe settings'
            : modal === 'journey'
              ? 'From dust to infinity'
              : modal === 'complete'
                ? 'Your universe is complete'
                : 'How to grow your universe'}
        </DialogTitle>
        <DialogDescription>
          {modal === 'settings'
            ? 'Set your sound and motion preferences.'
            : modal === 'journey'
              ? 'Your celestial body evolves as total mass increases.'
              : modal === 'complete'
                ? 'From dust to galaxies to an entire universe. All twelve stages are complete.'
                : 'Collect dust, deploy robotic tools and discover new celestial forms.'}
        </DialogDescription>
        {modal === 'help' && (
          <div className="help-content">
            <p>
              <Hand />
              <span>
                <b>Click the celestial body to collect dust.</b>Critical clicks
                give ×5 dust. You can also focus it with Tab and press Enter or
                Space.
              </span>
            </p>
            <p>
              <Bot />
              <span>
                <b>Click a tool to purchase it.</b>Collectors produce dust
                automatically. Research improves tools and manual clicks.
                Spending dust never reduces your total growth mass.
              </span>
            </p>
            <p>
              <Sparkles />
              <span>
                <b>Catch passing comets.</b>Rewards scale with your growth.
                Golden comets give ×3 rewards. Each comet stays for 14 seconds.
              </span>
            </p>
            <p>
              <Telescope />
              <span>
                <b>Your game saves in this browser.</b>Collectors earn up to 8
                hours of offline production. Saves do not sync across devices.
              </span>
            </p>
            <p>
              <Orbit />
              <span>
                <b>Open Craft to build constellations.</b>Each star consumes the
                displayed materials. Complete 5, 10 and 15 constellations to
                unlock the last three tools. Growth rewards add mass, not
                spendable dust.
              </span>
            </p>
            <small>
              Celestial evolution is a fantasy progression created for this
              game.
            </small>
          </div>
        )}
        {modal === 'settings' && (
          <div className="settings-content">
            <label htmlFor="sound-toggle">
              <span>
                <Volume2 size={18} /> Sound effects
              </span>
              <Switch
                id="sound-toggle"
                checked={game.sound}
                onCheckedChange={(checked) =>
                  onPreferenceChange('sound', checked)
                }
                aria-label="Sound effects"
              />
            </label>
            <label htmlFor="motion-toggle">
              <span>
                <AudioLines size={18} /> Reduce motion
              </span>
              <Switch
                id="motion-toggle"
                checked={game.reducedMotion}
                onCheckedChange={(checked) =>
                  onPreferenceChange('reducedMotion', checked)
                }
                aria-label="Reduce motion"
              />
            </label>
            <div className="stats-grid">
              <div>
                <span>Total clicks</span>
                <b>{format(game.clicks, 0)}</b>
              </div>
              <div>
                <span>Comets captured</span>
                <b>{game.comets}</b>
              </div>
              <div>
                <span>Collectors</span>
                <b>{robotsOwned}</b>
              </div>
              <div>
                <span>Time explored</span>
                <b>{Math.floor(game.playSeconds / 60)} min</b>
              </div>
            </div>
            <button className="secondary-button" onClick={onSave}>
              Save now
            </button>
            <div className="reset-area">
              {confirmReset ? (
                <>
                  <p>
                    All dust, tools and progress will be erased. Start a new
                    universe?
                  </p>
                  <div>
                    <button
                      className="danger-button"
                      onClick={() => {
                        setConfirmReset(false);
                        onReset();
                      }}
                    >
                      Erase progress and restart
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() => setConfirmReset(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <button onClick={() => setConfirmReset(true)}>
                  Start over
                </button>
              )}
            </div>
          </div>
        )}
        {modal === 'journey' && (
          <div className="journey-grid">
            {STAGES.map((s, i) => (
              <div key={s.en} className={i > stage ? 'undiscovered' : ''}>
                <div
                  className="journey-art celestial-sprite"
                  style={celestialStyle(i)}
                />
                <span className="eyebrow">
                  PHASE {String(i + 1).padStart(2, '0')}
                </span>
                <h3>{s.name}</h3>
                <p>{i <= stage ? 'Discovered' : `${format(s.mass)} mass`}</p>
              </div>
            ))}
          </div>
        )}
        {modal === 'complete' && (
          <div className="completion">
            <div
              className="completion-art celestial-sprite"
              style={celestialStyle(FINAL_STAGE)}
            />
            <p>
              {robotsOwned} tools · {format(game.clicks, 0)} clicks ·{' '}
              {game.comets} comets
            </p>
            <button className="primary-button" onClick={() => onClose()}>
              Keep growing <ArrowRight size={17} />
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
