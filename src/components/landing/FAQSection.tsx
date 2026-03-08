const faqs = [
  {
    question: "What types of events are available on EventTara?",
    answer:
      "EventTara features outdoor adventure events including hiking, trail running, mountain biking, road cycling, and running events across Panay Island and beyond.",
  },
  {
    question: "How do I book an event?",
    answer:
      "Browse available events, select the one you want to join, and click the Book button. You can pay online or choose cash payment at the event. Your spot is reserved immediately.",
  },
  {
    question: "Can I cancel my booking?",
    answer:
      "Yes, you can cancel your booking from the My Events page. Cancellation policies may vary by event, so check the event details for specifics.",
  },
  {
    question: "What are badges and how do I earn them?",
    answer:
      "Badges are collectible achievements you earn by participating in events and completing milestones. Check in at events to automatically earn badges. View your collection on your profile page.",
  },
  {
    question: "How do I create a club and host events?",
    answer:
      "Sign up for a free account and create a club. Once your club is set up, you can create events, manage check-ins, and coordinate with your members from the club dashboard.",
  },
  {
    question: "Is EventTara free to use?",
    answer:
      "Yes, creating an account and browsing events is completely free. Event prices are set by clubs and vary by event.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function FAQSection() {
  return (
    <section className="py-12 bg-gray-50 dark:bg-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-heading font-bold text-center text-gray-900 dark:text-white mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-10">
          Everything you need to know about EventTara.
        </p>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group bg-white dark:bg-slate-800 rounded-2xl shadow-sm dark:shadow-gray-950/20"
            >
              <summary className="flex items-center justify-between cursor-pointer p-5 font-semibold text-gray-900 dark:text-white list-none [&::-webkit-details-marker]:hidden">
                {faq.question}
                <span className="ml-4 shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180">
                  &#9662;
                </span>
              </summary>
              <p className="px-5 pb-5 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
