import React from "react";

export interface LoadingSkeletonProps {
  className?: string;
  count?: number;
  height?: string | number;
  width?: string | number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = "",
  count = 1,
  height,
  width,
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`cimas-skeleton ${className}`}
          style={{
            height: typeof height === "number" ? `${height}px` : height,
            width: typeof width === "number" ? `${width}px` : width,
          }}
        />
      ))}
    </>
  );
};
