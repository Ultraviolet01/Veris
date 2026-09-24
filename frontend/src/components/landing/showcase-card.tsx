import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { CoverPhoto } from "./screens/cover-photo";

interface ShowcaseCardProps {
  image: string;
  icon: LucideIcon;
  title: string;
  caption: string;
  href?: string;
  onClick?: () => void;
}

export function ShowcaseCard({ image, icon: Icon, title, caption, href = "#", onClick }: ShowcaseCardProps) {
  const inner = (
    <div className="flex-1 min-h-[220px] overflow-hidden hover:border-white/10 transition-all group bg-[#080808] border-white/5 border rounded-3xl pt-6 pr-6 pb-6 pl-6 relative">
      <CoverPhoto
        image={image}
        frameClassName="z-10"
        motionClassName="transition-transform duration-700 group-hover:scale-105"
        imageClassName="group-hover:opacity-80 transition-opacity duration-700 opacity-40"
      />
      <div className="z-10 flex flex-col h-full relative justify-end">
        <div className="mb-auto p-2 bg-white/5 w-fit rounded-lg border border-white/10 backdrop-blur-md">
          <Icon size={20} className="text-white" />
        </div>
        <h3 className="text-xl font-normal text-white mt-4">{title}</h3>
        <div className="h-px w-full bg-white/10 my-3" />
        <div className="flex justify-between items-center">
          <span className="text-xs text-neutral-500">{caption}</span>
          <ArrowUpRight
            size={16}
            className="text-neutral-500 group-hover:text-white transition-colors"
          />
        </div>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <div onClick={onClick} className="flex-1 cursor-pointer">
        {inner}
      </div>
    );
  }

  return (
    <a href={href} className="flex-1">
      {inner}
    </a>
  );
}
