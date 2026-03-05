const steps = [
  {
    icon: "\u{1F50D}",
    title: "Browse Events",
    description: "Discover adventure events happening near you or across the country.",
  },
  {
    icon: "\u{1F3AB}",
    title: "Book Your Spot",
    description: "Reserve your slot in seconds. No hassle, no long forms.",
  },
  {
    icon: "\u{1F3D4}\uFE0F",
    title: "Go Adventure!",
    description: "Show up, have fun, and collect badges for your achievements.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-12 bg-white dark:bg-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-heading font-bold text-center text-gray-900 dark:text-white mb-12">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <div key={idx} className="text-center">
              <div className="text-5xl mb-4">{step.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {step.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
