import Card from "@/components/ui/featured-card";
import { FEATURES } from "@/constants/features";


const Features = () => {
  return (
    <section className="container flex px-8 flex-col gap-16">
      <div id="features" className="flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold text-center md:text-4xl lg:text-5xl max-w-md w-full ">
          Product Features
        </h2>
        <p className="text-center text-muted-foreground mt-4 max-w-xl ">
          A customizable, feature-rich new tab with shortcuts, search, widgets, and productivity tools—free and open-source! 🚀
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:md:grid-cols-3 gap-12">
        {FEATURES.map(({ icon: Icon, ...feature }, index) => (
          <Card
            key={index}
            title={feature.title}
            description={feature.desc}
            featuredIcon={<Icon />}
          />
        ))}
      </div>
    </section>
  );
};
export default Features;
