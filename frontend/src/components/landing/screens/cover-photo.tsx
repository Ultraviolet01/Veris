import type { ReactNode } from "react";

interface CoverPhotoProps {
  image: string;
  sizes?: string;
  preload?: boolean;
  focusX?: number;
  frameClassName?: string;
  motionClassName?: string;
  imageClassName?: string;
  children?: ReactNode;
}

export function CoverPhoto({
  image,
  focusX = 0.5,
  frameClassName = "",
  motionClassName = "",
  imageClassName = "",
  children,
}: CoverPhotoProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden [container-type:size] ${frameClassName}`}>
      <div
        className={`absolute inset-0 ${motionClassName}`}
        style={{
          transformOrigin: `${String(focusX * 100)}% 50%`,
        }}
      >
        <img
          src={image}
          alt=""
          loading="eager"
          className={`w-full h-full object-cover ${imageClassName}`}
        />
        {children}
      </div>
    </div>
  );
}
