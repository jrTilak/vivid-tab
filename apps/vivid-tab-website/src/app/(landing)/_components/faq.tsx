import { FAQS } from "@/constants/faqs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


const FAQs = () => {
  return (
    <section id="faqs" className="container flex px-8 flex-col gap-16">
      <div className="flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold text-center md:text-4xl lg:text-5xl max-w-md w-full ">
          FAQs
        </h2>
      </div>
      <Accordion type="single" collapsible className="max-w-4xl mx-auto w-full">
        {FAQS.map((acc, index) => (
          <AccordionItem value={index.toString()} key={index}>
            <AccordionTrigger>
              {acc.question}
            </AccordionTrigger>
            <AccordionContent>
              {acc.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};
export default FAQs;
