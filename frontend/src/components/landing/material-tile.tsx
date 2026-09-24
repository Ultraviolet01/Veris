import { CoverPhoto } from "./screens/cover-photo";

interface MaterialTileProps {
  image: string;
  title: string;
  caption: string;
  headingClassName?: string;
}

export function MaterialTile({
  image,
  title,
  caption,
  headingClassName = "text-white text-lg font-medium",
}: MaterialTileProps) {
  return (
    <div className="animate-on-scroll [animation:fadeInUp_0.8s_ease-out_0.7s_both] col-span-1 md:col-span-1 min-h-[280px] md:min-h-0 overflow-hidden group flex flex-col bg-[#0A0A0A] hover:border-red-500/20 transition-colors border-white/5 border rounded-3xl pt-6 pr-6 pb-6 pl-6 relative items-center justify-end">
      <CoverPhoto
        image={image}
        imageClassName="opacity-40 group-hover:opacity-100 transition-opacity duration-700"
      />
      <h3 className={`z-10 leading-tight ${headingClassName} text-center relative`}>{title}</h3>
      <p className="z-10 text-[10px] text-neutral-500 relative mt-1">{caption}</p>
    </div>
  );
}
