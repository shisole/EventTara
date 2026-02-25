import Image from "next/image";

import EventCarousel from "@/components/events/EventCarousel";
import { createClient } from "@/lib/supabase/server";

export default async function TestimonialsSection() {
  const supabase = await createClient();

  const { data: testimonials } = await supabase
    .from("app_testimonials")
    .select("id, name, role, text, avatar_url")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .limit(6);

  if (!testimonials || testimonials.length === 0) return null;

  return (
    <section className="py-20 bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-heading font-bold text-center text-gray-900 dark:text-white mb-4">
          What Adventurers Say
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
          Hear from the community that makes EventTara special.
        </p>
        <EventCarousel infinite speed={30}>
          {testimonials.map((t: any) => (
            <div key={t.id} className="min-w-[300px] max-w-[380px] flex-shrink-0">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-gray-950/20 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-lime-100 dark:bg-lime-900/30 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {t.avatar_url ? (
                      <Image
                        src={t.avatar_url}
                        alt={t.name}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-lime-600 dark:text-lime-400 font-bold text-sm">
                        {t.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  &ldquo;{t.text}&rdquo;
                </p>
              </div>
            </div>
          ))}
        </EventCarousel>
      </div>
    </section>
  );
}
