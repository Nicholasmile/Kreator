import { useEffect, useRef, useState } from 'react';
import Konva from 'konva';
import { populateLayer } from './render';
import { useEditor } from './store';
import type { Page } from './model';
export function Canvas({
  page,
  width,
  height,
  zoom = 1,
  interactive = false,
  onError,
}: {
  page: Page;
  width: number;
  height: number;
  zoom?: number;
  interactive?: boolean;
  onError?: (message: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    stageRef = useRef<Konva.Stage | null>(null);
  const selected = useEditor((s) => s.selected);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!host.current) return;
    let cancelled = false;
    setReady(false);
    const stage = new Konva.Stage({
      container: host.current,
      width: width * zoom,
      height: height * zoom,
      scaleX: zoom,
      scaleY: zoom,
    });
    stageRef.current = stage;
    const layer = new Konva.Layer();
    stage.add(layer);
    void populateLayer(layer, page, width, height)
      .then(() => {
        if (cancelled) return;
        if (interactive) {
          const guides = new Konva.Group({ listening: false });
          layer.add(guides);
          const transformer = new Konva.Transformer({
            name: 'selection',
            rotateEnabled: true,
            flipEnabled: false,
            borderStroke: '#8155de',
            anchorStroke: '#8155de',
            anchorFill: 'white',
            anchorSize: 9 / zoom,
            borderStrokeWidth: 1.5 / zoom,
            rotateAnchorOffset: 28 / zoom,
            boundBoxFunc: (oldBox, newBox) =>
              newBox.width < 12 || newBox.height < 12 ? oldBox : newBox,
          });
          layer.add(transformer);
          const attach = (id: string | null) => {
            const target = id ? layer.findOne(`#${id}`) : null;
            transformer.nodes(target ? [target] : []);
          };
          attach(useEditor.getState().selected);
          stage.on('click tap', (e) => {
            if (e.target === stage || e.target.name() === 'page-background') {
              useEditor.getState().select(null);
              attach(null);
            }
          });
          for (const node of layer.find('.design-element')) {
            node.draggable(true);
            node.on('click tap', () => {
              useEditor.getState().select(node.id());
              attach(node.id());
            });
            node.on('dragstart', () => {
              useEditor.getState().select(node.id());
              attach(node.id());
            });
            node.on('dragmove', () => {
              guides.destroyChildren();
              const e = page.elements.find((e) => e.id === node.id())!;
              const centerX = node.x() + e.width / 2,
                centerY = node.y() + e.height / 2;
              if (Math.abs(centerX - width / 2) < 8 / zoom) {
                node.x(width / 2 - e.width / 2);
                guides.add(
                  new Konva.Line({
                    points: [width / 2, 0, width / 2, height],
                    stroke: '#a65de2',
                    strokeWidth: 1 / zoom,
                    dash: [6 / zoom, 4 / zoom],
                  }),
                );
              }
              if (Math.abs(centerY - height / 2) < 8 / zoom) {
                node.y(height / 2 - e.height / 2);
                guides.add(
                  new Konva.Line({
                    points: [0, height / 2, width, height / 2],
                    stroke: '#a65de2',
                    strokeWidth: 1 / zoom,
                    dash: [6 / zoom, 4 / zoom],
                  }),
                );
              }
            });
            node.on('dragend', () => {
              guides.destroyChildren();
              useEditor.getState().patchElement(node.id(), { x: node.x(), y: node.y() });
            });
            node.on('transformend', () => {
              const old = page.elements.find((e) => e.id === node.id())!;
              useEditor
                .getState()
                .patchElement(node.id(), {
                  x: node.x(),
                  y: node.y(),
                  width: Math.max(12, old.width * node.scaleX()),
                  height: Math.max(12, old.height * node.scaleY()),
                  rotation: node.rotation(),
                  fontSize: old.fontSize
                    ? old.fontSize * Math.min(node.scaleX(), node.scaleY())
                    : undefined,
                });
            });
          }
        }
        layer.draw();
        setReady(true);
      })
      .catch((e) => onError?.(String(e.message || e)));
    return () => {
      cancelled = true;
      stage.destroy();
      stageRef.current = null;
    };
  }, [page, width, height, zoom, interactive, onError]);
  useEffect(() => {
    if (!interactive || !ready) return;
    const stage = stageRef.current;
    const tr = stage?.findOne<Konva.Transformer>('.selection');
    const node = selected ? stage?.findOne(`#${selected}`) : null;
    tr?.nodes(node ? [node] : []);
  }, [selected, interactive, ready]);
  return (
    <div
      ref={host}
      className="design-canvas"
      role={interactive ? 'application' : 'img'}
      aria-label={
        interactive
          ? 'Design canvas. Select an element or use the Layers list to edit.'
          : 'Design preview'
      }
      style={{ width: width * zoom, height: height * zoom }}
    />
  );
}
