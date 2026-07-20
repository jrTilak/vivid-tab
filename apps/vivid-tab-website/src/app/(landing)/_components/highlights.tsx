"use client"
import { cn } from "@/lib/utils";
import { BrainCircuitIcon, BookmarkIcon, LayersIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";


const features = [
  {
    id: "unlimited-bookmarks",
    icon: BookmarkIcon,
    "title": "Unlimited Bookmarks",
    "description": "Choose and display unlimited bookmarks as shortcuts for quick access to your favorite sites.",
    image: "/preview.png",
  },
  {
    "title": "Smart Search",
    "description": "Search instantly with built-in AI, search engines, or directly on YouTube—right from your new tab.",
    "id": "smart-search",
    icon: BrainCircuitIcon,
    image: "/smart-search-preview.png",

  },
  {
    "title": "Fully Customizable & More",
    "description": "Drag and drop components, change backgrounds, and tailor your new tab to match your workflow and style.",
    "id": "customizable",
    icon: LayersIcon,
    image: "/custom-bg-preview.png",

  },

]

const Highlights = () => {
  const [activeTab, setActiveTab] = useState("unlimited-bookmarks")

  const activeFeature = features.find((feature) => feature.id === activeTab) || features[0]
  return (
    <section className="container flex px-8 flex-col gap-16">
      <div id="highlights" className="flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold text-center md:text-4xl lg:text-5xl max-w-md w-full ">
          Highlights
        </h2>
        <p className="text-center text-muted-foreground mt-4 max-w-xl ">
          Vivid Tab offers smart search, unlimited bookmarks, and complete customization, allowing you to personalize your new tab and boost productivity effortlessly.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 bg-background rounded-lg shadow-sm border max-w-7xl mx-auto">
        <div className="w-full h-full relative rounded-l-lg">
          <Image
            src={activeFeature.image || "/preview.svg"}
            alt={activeFeature.title}
            fill
            className="object-cover object-center transition-opacity duration-300 w-full h-full rounded-l-lg"
          />
        </div>
        <div className="p-6 bg-muted rounded-r-lg">
          <div className="space-y-8">
            {features.map(({ icon: Icon, ...feature }) => (
              <div
                key={feature.id}
                className={cn(
                  "flex items-start space-x-4 p-4 rounded-lg cursor-pointer transition-colors",
                  activeTab === feature.id ? "bg-background shadow-sm border" : "hover:bg-muted",
                )}
                onClick={() => setActiveTab(feature.id)}
              >
                <div className="shrink-0 p-2 rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
export default Highlights;
