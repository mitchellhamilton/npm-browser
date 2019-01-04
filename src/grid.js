/** @jsx jsx */
import { jsx } from "@emotion/core";

export function Grid({
  columnCount,
  rowCount,
  gap,
  rowGap,
  columnGap,
  ...rest
}) {
  return (
    <div
      css={{
        display: "grid",
        gridTemplateColumns: columnCount
          ? `repeat(${columnCount}, 1fr)`
          : "auto",
        gridTemplateRows: rowCount ? `repeat(${rowCount}, 1fr)` : "auto",
        gridColumnGap: columnGap || gap || 0,
        gridRowGap: rowGap || gap || 0
      }}
      {...rest}
    />
  );
}

export function Item({ x = [], y = [], spanX, spanY, ...rest }) {
  const startColumnLine = x[0] ? x[0] : "auto";
  const endColumnLine = spanX ? `span ${spanX}` : x[1] ? x[1] : "auto";

  const startRowLine = y[0] ? y[0] : "auto";
  const endRowLine = spanY ? `span ${spanY}` : y[1] ? y[1] : "auto";

  return (
    <div
      css={[
        {
          gridColumn: `${startColumnLine} / ${endColumnLine}`,
          gridRow: `${startRowLine} / ${endRowLine}`
        }
      ]}
      {...rest}
    />
  );
}
