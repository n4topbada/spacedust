'use client';
/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- The named scrolling region needs a tab stop for Arrow/PageDown navigation even when every purchase button is disabled. */

import {
  Bot,
  Gem,
  Star,
  LockKeyhole,
  Radio,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  ROBOTS,
  quote,
  robotRate,
  format,
  toolUnlocked,
  toolUnlockLabel,
  toolLevel,
  TOOL_LEVELS,
  type GameAction,
  type GameState,
} from '@/lib/game';
import { equipmentStyle } from '@/lib/visuals';
import {
  ResearchPanel,
  CurrencyPanel,
  ConstellationPanel,
} from '@/components/progression-panels';

type Props = {
  game: GameState;
  quantity: number | 'max';
  onQuantity: (value: number | 'max') => void;
  onPurchase: (index: number) => void;
  onAction: (action: GameAction) => void;
};

export function EquipmentShop({
  game,
  quantity,
  onQuantity,
  onPurchase,
  onAction,
}: Props) {
  const discovered = ROBOTS.filter((_, i) => toolUnlocked(game, i)).length;
  return (
    <aside className="equipment-shop" aria-label="장비 구매와 업그레이드">
      <div className="equipment-heading">
        <div>
          <span className="eyebrow">COLLECTION SYSTEM</span>
          <h2>
            업그레이드{' '}
            <span>
              {discovered} / {ROBOTS.length}
            </span>
          </h2>
        </div>
        <Bot size={28} strokeWidth={1.3} aria-hidden="true" />
      </div>
      <Tabs defaultValue="equipment" className="equipment-tabs">
        <TabsList className="shop-tab-list">
          <TabsTrigger value="equipment">
            <Bot size={16} /> 수집 장비
          </TabsTrigger>
          <TabsTrigger value="enhance">
            <Zap size={16} /> 연구
          </TabsTrigger>
          <TabsTrigger value="currency">
            <Gem size={16} /> 특수 재화
          </TabsTrigger>
          <TabsTrigger value="stars">
            <Star size={16} /> 별자리
          </TabsTrigger>
        </TabsList>
        <TabsContent value="equipment" className="equipment-panel">
          <div className="equipment-toolbar">
            <span>먼지를 모으는 작은 동료들</span>
            <div className="quantity-options" aria-label="구매 수량">
              {([1, 10, 'max'] as const).map((value) => (
                <button
                  key={value}
                  className={quantity === value ? 'active' : ''}
                  aria-pressed={quantity === value}
                  onClick={() => onQuantity(value)}
                >
                  {value === 'max' ? '최대' : `×${value}`}
                </button>
              ))}
            </div>
          </div>
          <section
            className="equipment-scroll"
            tabIndex={0}
            aria-label="수집 장비 14종 목록, 아래로 스크롤"
          >
            <Table className="equipment-table">
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" className="art-column">
                    그림
                  </TableHead>
                  <TableHead scope="col">이름</TableHead>
                  <TableHead scope="col" className="price-column">
                    가격 <small>dust</small>
                  </TableHead>
                  <TableHead scope="col" className="owned-column">
                    보유량
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ROBOTS.map((item, i) => {
                  const owned = game.robots[i] ?? 0;
                  const locked = !toolUnlocked(game, i);
                  const offer = quote(game, i, quantity);
                  const atLimit = owned >= 500;
                  const available =
                    !locked && offer.count > 0 && offer.cost <= game.dust;
                  return (
                    <TableRow
                      key={item.id}
                      className={`${locked ? 'locked' : ''} ${available ? 'affordable' : ''} ${owned > 0 ? 'working' : ''}`}
                    >
                      <TableCell className="art-cell">
                        <span
                          className="equipment-art"
                          style={equipmentStyle(i)}
                          aria-hidden="true"
                        />
                        <span className="equipment-number">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                      </TableCell>
                      <TableCell className="equipment-name">
                        <strong>{item.name}</strong>
                        <span>{item.localName}</span>
                        <span className="equipment-detail">
                          {locked ? (
                            <>
                              <LockKeyhole size={12} /> {toolUnlockLabel(i)} 시
                              해금
                            </>
                          ) : (
                            <>
                              <Zap size={12} />{' '}
                              {format(owned ? robotRate(game, i) : item.rate)}{' '}
                              /초{owned > 0 ? ' · 합계' : ''}
                            </>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="price-cell">
                        <button
                          onClick={() => onPurchase(i)}
                          disabled={!available}
                          aria-label={`${item.name} ${offer.count || 1}개 구매, 먼지 ${format(offer.cost || item.base)}`}
                          title={item.desc}
                        >
                          <span>
                            {locked ? (
                              <LockKeyhole size={13} />
                            ) : (
                              <Sparkles size={13} />
                            )}
                            {atLimit
                              ? '최대 보유'
                              : locked
                                ? '잠김'
                                : quantity === 'max' && !offer.count
                                  ? '먼지 부족'
                                  : format(offer.cost)}
                          </span>
                          {!locked && !atLimit && (
                            <small>
                              {quantity === 'max' && offer.count
                                ? `+${offer.count}개`
                                : `+${offer.count || quantity}개`}
                            </small>
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="owned-cell">
                        <b>{owned}</b>
                        <small className="tool-level">
                          Lv.{toolLevel(owned)}
                        </small>
                        <span className="owned-meter" aria-hidden="true">
                          <i
                            style={{
                              width: `${Math.min(100, (owned / (TOOL_LEVELS[toolLevel(owned)] ?? 300)) * 100)}%`,
                            }}
                          />
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </section>
          <p className="equipment-tip">
            <Radio size={14} /> 같은 장비 25 · 75 · 150 · 300개에서 레벨과
            효율이 2배씩 증가합니다.
          </p>
        </TabsContent>
        <TabsContent value="enhance" className="progression-tab">
          <ResearchPanel game={game} onAction={onAction} />
        </TabsContent>
        <TabsContent value="currency" className="progression-tab">
          <CurrencyPanel game={game} onAction={onAction} />
        </TabsContent>
        <TabsContent value="stars" className="progression-tab">
          <ConstellationPanel game={game} onAction={onAction} />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
