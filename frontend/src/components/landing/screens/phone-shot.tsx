import type { ReactNode } from "react";

export function PhoneShot({
  image,
  feather,
  children,
}: {
  image: string;
  feather: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="relative h-full drop-shadow-2xl [container-type:size] flex items-center justify-center"
      style={{ aspectRatio: "600 / 1200" }}
    >
      <img
        src={image}
        alt=""
        className={`w-full h-full object-contain rounded-2xl ${
          feather
            ? "[mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_75%)]"
            : "rounded-2xl"
        }`}
      />
      {children}
    </div>
  );
}
