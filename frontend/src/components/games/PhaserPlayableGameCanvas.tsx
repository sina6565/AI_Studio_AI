import React, { useEffect, useRef } from 'react';
import type PhaserTypes from 'phaser';
import { GameSession, PlayableGameDefinition } from '../../games/playableGame';

interface PhaserPlayableGameCanvasProps {
  definition: PlayableGameDefinition;
  onSnapshot: (snapshot: ReturnType<GameSession['snapshot']>) => void;
  onError: (message: string) => void;
}

const PhaserPlayableGameCanvas: React.FC<PhaserPlayableGameCanvasProps> = ({
  definition,
  onSnapshot,
  onError,
}) => {
  const parentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let disposed = false;
    let game: PhaserTypes.Game | undefined;

    const startGame = async () => {
      try {
        const phaserModule = await import('phaser');
        if (disposed || !parentRef.current) return;
        const Phaser = phaserModule.default;
        const session = new GameSession(definition);

        class CollectionGameScene extends Phaser.Scene {
          private player!: PhaserTypes.GameObjects.Arc;
          private playerCore!: PhaserTypes.GameObjects.Arc;
          private cursorKeys!: PhaserTypes.Types.Input.Keyboard.CursorKeys;
          private wasdKeys!: Record<'left' | 'right' | 'up' | 'down', PhaserTypes.Input.Keyboard.Key>;
          private crystalViews: PhaserTypes.GameObjects.Arc[] = [];
          private lastSnapshotKey = '';

          constructor() {
            super({ key: 'collection-game' });
          }

          create() {
            const { columns, rows, tileSize, layout } = definition.world;
            const width = columns * tileSize;
            const height = rows * tileSize;
            const graphics = this.add.graphics();
            graphics.fillStyle(0x09111f, 1);
            graphics.fillRect(0, 0, width, height);
            graphics.lineStyle(1, 0x1e293b, 0.55);

            for (let row = 0; row < rows; row += 1) {
              for (let column = 0; column < columns; column += 1) {
                const x = column * tileSize;
                const y = row * tileSize;
                if (layout[row][column] === '#') {
                  graphics.fillStyle(0x243149, 1);
                  graphics.fillRoundedRect(x + 2, y + 2, tileSize - 4, tileSize - 4, 5);
                  graphics.lineStyle(1, 0x3d4f6a, 0.7);
                  graphics.strokeRoundedRect(x + 2, y + 2, tileSize - 4, tileSize - 4, 5);
                } else {
                  graphics.strokeRect(x, y, tileSize, tileSize);
                }
              }
            }

            const exit = session.getExitPosition();
            this.add.rectangle(exit.column, exit.row, tileSize * 0.68, tileSize * 0.68, 0x22c55e)
              .setStrokeStyle(3, 0xbbf7d0)
              .setDepth(1);
            this.add.text(exit.column - 10, exit.row - 10, 'E', {
              fontFamily: 'monospace',
              fontSize: '18px',
              color: '#052e16',
              fontStyle: 'bold',
            }).setDepth(2);

            this.crystalViews = session.getCrystalPositions().map((crystal) =>
              this.add.circle(crystal.column, crystal.row, tileSize * 0.2, 0xfacc15)
                .setStrokeStyle(2, 0xfef3c7)
                .setDepth(3),
            );
            session.getHazardPositions().forEach((hazard) => {
              this.add.circle(hazard.column, hazard.row, tileSize * 0.29, 0xf43f5e)
                .setStrokeStyle(2, 0xffe4e6)
                .setDepth(3);
            });

            const initialState = session.snapshot();
            this.player = this.add.circle(
              initialState.x,
              initialState.y,
              tileSize * 0.28,
              0x22d3ee,
            ).setStrokeStyle(3, 0xe0f2fe).setDepth(4);
            this.playerCore = this.add.circle(initialState.x, initialState.y, tileSize * 0.08, 0xffffff)
              .setDepth(5)
              .setName('player-core');

            if (this.input.keyboard) {
              this.cursorKeys = this.input.keyboard.createCursorKeys();
              this.wasdKeys = this.input.keyboard.addKeys({
                left: 'A',
                right: 'D',
                up: 'W',
                down: 'S',
              }) as Record<'left' | 'right' | 'up' | 'down', PhaserTypes.Input.Keyboard.Key>;
            }

            this.add.text(8, 8, 'CRYSTALS', {
              fontFamily: 'monospace',
              fontSize: '10px',
              color: '#94a3b8',
              backgroundColor: '#09111f',
              padding: { x: 4, y: 3 },
            }).setDepth(6);
            this.publishSnapshot();
          }

          update(_time: number, delta: number) {
            const isDown = (key?: PhaserTypes.Input.Keyboard.Key) => Boolean(key?.isDown);
            const input = {
              left: isDown(this.cursorKeys?.left) || isDown(this.wasdKeys?.left),
              right: isDown(this.cursorKeys?.right) || isDown(this.wasdKeys?.right),
              up: isDown(this.cursorKeys?.up) || isDown(this.wasdKeys?.up),
              down: isDown(this.cursorKeys?.down) || isDown(this.wasdKeys?.down),
            };
            const snapshot = session.update(input, delta);
            this.player.setPosition(snapshot.x, snapshot.y);
            this.playerCore.setPosition(snapshot.x, snapshot.y);
            this.player.setAlpha(snapshot.invulnerable && Math.floor(this.time.now / 100) % 2 === 0 ? 0.4 : 1);
            this.crystalViews.forEach((crystal, index) => {
              if (session.isCrystalCollected(index)) crystal.setVisible(false);
            });
            this.publishSnapshot(snapshot);
          }

          private publishSnapshot(snapshot = session.snapshot()) {
            const signature = [
              snapshot.score,
              snapshot.collectedCrystals,
              snapshot.lives,
              snapshot.secondsRemaining,
              snapshot.status,
              snapshot.endReason || '',
              snapshot.invulnerable,
            ].join('|');
            if (signature === this.lastSnapshotKey) return;
            this.lastSnapshotKey = signature;
            onSnapshot(snapshot);
          }
        }

        game = new Phaser.Game({
          type: Phaser.AUTO,
          width: definition.world.columns * definition.world.tileSize,
          height: definition.world.rows * definition.world.tileSize,
          parent: parentRef.current,
          backgroundColor: '#09111f',
          scene: [CollectionGameScene],
          scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
          },
          render: { antialias: true, pixelArt: false },
        });
      } catch (error) {
        if (!disposed) {
          onError(error instanceof Error ? error.message : 'The game runtime could not start.');
        }
      }
    };

    void startGame();
    return () => {
      disposed = true;
      game?.destroy(true);
    };
  }, [definition, onError, onSnapshot]);

  return (
    <div
      ref={parentRef}
      aria-label={`${definition.title} playable 2D game`}
      style={{ width: '100%', height: 'min(72vh, 480px)', minHeight: 320, display: 'flex', justifyContent: 'center' }}
    />
  );
};

export default PhaserPlayableGameCanvas;
