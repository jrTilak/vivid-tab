import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CardProps {
  title: string;
  description: string;
  className?: string;
  bodyClassName?: string;
  showIcons?: boolean;
  featuredIcon?: React.ReactNode; // Corrected to ReactNode
}

const Icon = ({ className, ...rest }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    width={24}
    height={24}
    strokeWidth="1"
    stroke="currentColor"
    {...rest}
    className={cn("dark:text-white text-black size-6 absolute", className)}
    suppressHydrationWarning
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
  </svg>
);

interface CardBodyProps {
  title: string;
  description: string;
  featuredIcon?: React.ReactNode;
  className?: string;
}

const CardBody: React.FC<CardBodyProps> = ({
  title,
  description,
  className,
  featuredIcon,
}) => (
  <div
    className={cn("text-left flex flex-col gap-4", className)}
  >
    <div>
      {featuredIcon && (
        <Button variant={"outline"} className="rounded-[6px]" size={"icon"}>

          {featuredIcon}
        </Button>
      )}
    </div>
    <h3 className="text-xl font-bold mb-1 text-gray-900 dark:text-gray-100">
      {title}
    </h3>
    <p className="text-gray-700 dark:text-gray-300">{description}</p>
  </div>
);

const Card: React.FC<CardProps> = ({
  title,
  description,
  className = "",
  bodyClassName = "p-6",
  showIcons = true,
  featuredIcon,
}) => (
  <div
    className={cn(
      "border border-dashed hover:shadow-2xl transition-shadow border-zinc-400 dark:border-zinc-700 relative",
      className
    )}
  >
    {showIcons && (
      <>
        <Icon className="-top-3 -left-3 text-primary" />
        <Icon className="-top-3 -right-3 " />
        <Icon className="-bottom-3 -left-3" />
        <Icon className="-bottom-3 -right-3 text-primary" />
      </>
    )}
    <CardBody
      title={title}
      description={description}
      className={bodyClassName}
      featuredIcon={featuredIcon}
    />
  </div>
);

export default Card;
