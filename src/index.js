import React from "react";
import { render } from "react-dom";
import { Stage, Layer, Rect, Transformer } from "react-konva";

const Rectangle = ({
  shapeProps,
  isSelected,
  onSelect,
  onChange,
  width,
  height,
}) => {
  const shapeRef = React.useRef();
  const trRef = React.useRef();

  React.useEffect(() => {
    if (isSelected) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const getCorner = (pivotX, pivotY, diffX, diffY, angle) => {
    const distance = Math.sqrt(diffX * diffX + diffY * diffY);

    angle += Math.atan2(diffY, diffX);

    const x = pivotX + distance * Math.cos(angle);
    const y = pivotY + distance * Math.sin(angle);

    return { x: x, y: y };
  };
  const getClientRect = (rotatedBox) => {
    const { x, y, width, height } = rotatedBox;
    const rad = rotatedBox.rotation;

    const p1 = getCorner(x, y, 0, 0, rad);
    const p2 = getCorner(x, y, width, 0, rad);
    const p3 = getCorner(x, y, width, height, rad);
    const p4 = getCorner(x, y, 0, height, rad);

    const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
    const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
    const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
    const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  };
  const getTotalBox = (box) => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
    // boxes.forEach((box) => {

    // });
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  };

  return (
    <React.Fragment>
      <Rect
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        {...shapeProps}
        draggable
        onDragEnd={(e) => {
          onChange({
            ...shapeProps,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          // we will reset it back
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...shapeProps,
            x: node.x(),
            y: node.y(),
            // set minimal value
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(node.height() * scaleY),
          });
        }}
        onDragMove={(pos) => {
          const node = pos.currentTarget;
          const image = node.getClientRect();
          const box = getTotalBox(image);
          const absPos = node.getAbsolutePosition();
          const offsetX = box.x - absPos.x;
          const offsetY = box.y - absPos.y;
          // we total box goes outside of viewport, we need to move absolute position of shape
          const newAbsPos = { ...absPos };
          if (box.x < 0) {
            newAbsPos.x = -offsetX;
          }
          if (box.y < 0) {
            newAbsPos.y = -offsetY;
          }
          if (box.x + box.width > width) {
            newAbsPos.x = width - box.width - offsetX;
          }
          if (box.y + box.height > height) {
            newAbsPos.y = height - box.height - offsetY;
          }
          node.setAbsolutePosition(newAbsPos);
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldPos, newPos) => {
            const box = getClientRect(newPos);
            const isOut =
              box.x < 0 ||
              box.y < 0 ||
              box.x + box.width > width ||
              box.y + box.height > height;

            if (isOut) {
              return oldPos;
            }
            return newPos;
          }}
        />
      )}
    </React.Fragment>
  );
};

const initialRectangles = [
  {
    x: 150,
    y: 150,
    width: 100,
    height: 100,
    fill: "green",
    id: "rect2",
  },
];

const rect2 = [
  {
    x: 150,
    y: 150,
    width: 100,
    height: 100,
    fill: "red",
    id: "rect1",
  },
];

const App = () => {
  const [rectangles, setRectangles] = React.useState(initialRectangles);
  const [rect, setRect] = React.useState(rect2);
  const [selectedId, selectShape] = React.useState(null);
  const [size, setSize] = React.useState({ width: 600, height: 400 });

  const checkDeselect = (e) => {
    // deselect when clicked on empty area
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectShape(null);
    }
  };

  return (
    <>
      <div style={{marginBottom: "1rem"}}>
        <Stage
          width={size.width}
          height={size.height}
          onMouseDown={checkDeselect}
          onTouchStart={checkDeselect}
        >
          <Layer>
            {rectangles.map((rect, i) => {
              return (
                <Rectangle
                  key={i}
                  shapeProps={rect}
                  isSelected={rect.id === selectedId}
                  onSelect={() => {
                    selectShape(rect.id);
                  }}
                  onChange={(newAttrs) => {
                    const rects = rectangles.slice();
                    rects[i] = newAttrs;
                    setRectangles(rects);
                  }}
                  height={size.height}
                  width={size.width}
                />
              );
            })}
          </Layer>
        </Stage>
      </div>
      <div>
        <Stage
          width={size.width}
          height={size.height}
          onMouseDown={checkDeselect}
          onTouchStart={checkDeselect}
        >
          <Layer>
            {rect.map((rec, i) => {
              return (
                <Rectangle
                  key={i}
                  shapeProps={rec}
                  isSelected={rec.id === selectedId}
                  onSelect={() => {
                    selectShape(rec.id);
                  }}
                  onChange={(newAttrs) => {
                    const rects = rect.slice();
                    rects[i] = newAttrs;
                    setRect(rects);
                  }}
                  height={size.height}
                  width={size.width}
                />
              );
            })}
          </Layer>
        </Stage>
      </div>
    </>
  );
};

render(<App />, document.getElementById("root"));
