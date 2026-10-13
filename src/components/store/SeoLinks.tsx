import Link from 'next/link';

/** Wikipedia article per category slug — 1 relevant external link per page. */
export const WIKIPEDIA_BY_CATEGORY: Record<string, { title: string; url: string }> = {
  'air-fryer': { title: 'Air fryer', url: 'https://en.wikipedia.org/wiki/Air_fryer' },
  'rice-cooker': { title: 'Rice cooker', url: 'https://en.wikipedia.org/wiki/Rice_cooker' },
  'dc-fan': { title: 'Fan (machine)', url: 'https://en.wikipedia.org/wiki/Fan_(machine)' },
  'ceiling-fan': { title: 'Ceiling fan', url: 'https://en.wikipedia.org/wiki/Ceiling_fan' },
  'high-speed-fan': { title: 'Fan (machine)', url: 'https://en.wikipedia.org/wiki/Fan_(machine)' },
  'infrared-cooker': { title: 'Induction cooking', url: 'https://en.wikipedia.org/wiki/Induction_cooking' },
  'pressure-cooker': { title: 'Pressure cooker', url: 'https://en.wikipedia.org/wiki/Pressure_cooking' },
  'cookware': { title: 'Cookware and bakeware', url: 'https://en.wikipedia.org/wiki/Cookware_and_bakeware' },
  'blender': { title: 'Blender', url: 'https://en.wikipedia.org/wiki/Blender' },
  'iron': { title: 'Clothes iron', url: 'https://en.wikipedia.org/wiki/Clothes_iron' },
  'multi-cooker': { title: 'Multicooker', url: 'https://en.wikipedia.org/wiki/Multicooker' },
  'water-heater': { title: 'Water heating', url: 'https://en.wikipedia.org/wiki/Water_heating' },
  'light': { title: 'Light-emitting diode', url: 'https://en.wikipedia.org/wiki/Light-emitting_diode' },
  'ac-dc-light': { title: 'Light-emitting diode', url: 'https://en.wikipedia.org/wiki/Light-emitting_diode' },
  'battery': { title: 'Rechargeable battery', url: 'https://en.wikipedia.org/wiki/Rechargeable_battery' },
  'solar': { title: 'Solar power', url: 'https://en.wikipedia.org/wiki/Solar_power' },
  'electric-kettle': { title: 'Kettle', url: 'https://en.wikipedia.org/wiki/Kettle' },
  'microwave-oven': { title: 'Microwave oven', url: 'https://en.wikipedia.org/wiki/Microwave_oven' },
  'room-heater': { title: 'Space heater', url: 'https://en.wikipedia.org/wiki/Space_heater' },
};

export const HOME_APPLIANCE_WIKI = {
  title: 'Home appliance',
  url: 'https://en.wikipedia.org/wiki/Home_appliance',
};

/** Related category slugs for cross-linking. */
export const RELATED_CATEGORIES: Record<string, string[]> = {
  'air-fryer': ['infrared-cooker', 'multi-cooker', 'pressure-cooker', 'cookware'],
  'rice-cooker': ['pressure-cooker', 'multi-cooker', 'cookware', 'blender'],
  'infrared-cooker': ['air-fryer', 'multi-cooker', 'pressure-cooker', 'cookware'],
  'pressure-cooker': ['rice-cooker', 'multi-cooker', 'cookware', 'air-fryer'],
  'multi-cooker': ['air-fryer', 'infrared-cooker', 'pressure-cooker', 'cookware'],
  'cookware': ['pressure-cooker', 'air-fryer', 'multi-cooker', 'blender'],
  'blender': ['cookware', 'multi-cooker', 'rice-cooker', 'air-fryer'],
  'dc-fan': ['ceiling-fan', 'high-speed-fan', 'ac-dc-light', 'battery'],
  'ceiling-fan': ['dc-fan', 'high-speed-fan', 'light', 'ac-dc-light'],
  'high-speed-fan': ['dc-fan', 'ceiling-fan', 'battery', 'ac-dc-light'],
  'iron': ['water-heater', 'light', 'battery', 'cookware'],
  'light': ['ac-dc-light', 'battery', 'ceiling-fan', 'water-heater'],
  'ac-dc-light': ['light', 'battery', 'dc-fan', 'ceiling-fan'],
  'battery': ['dc-fan', 'ac-dc-light', 'light', 'high-speed-fan', 'solar'],
  'water-heater': ['iron', 'light', 'battery', 'blender'],
  'solar': ['battery', 'light', 'ac-dc-light', 'dc-fan'],
  'electric-kettle': ['blender', 'microwave-oven', 'multi-cooker', 'rice-cooker'],
  'microwave-oven': ['blender', 'electric-kettle', 'multi-cooker', 'air-fryer'],
  'room-heater': ['water-heater', 'light', 'blender', 'iron'],
};

export const CATEGORY_NAMES: Record<string, string> = {
  'air-fryer': 'Air Fryer',
  'rice-cooker': 'Rice Cooker',
  'dc-fan': 'DC Fan',
  'ceiling-fan': 'Ceiling Fan',
  'high-speed-fan': 'High Speed Fan',
  'infrared-cooker': 'Infrared Cooker',
  'pressure-cooker': 'Pressure Cooker',
  'cookware': 'Cookware',
  'blender': 'Blender',
  'iron': 'Iron',
  'multi-cooker': 'Multi Cooker',
  'water-heater': 'Water Heater',
  'light': 'Light',
  'ac-dc-light': 'AC DC Light',
  'battery': 'Battery',
  'solar': 'Solar Products',
  'electric-kettle': 'Electric Kettle',
  'microwave-oven': 'Microwave Oven',
  'room-heater': 'Room Heater',
};

interface Props {
  categorySlug: string;
  /** 'product' | 'category' — controls heading text */
  variant?: 'product' | 'category';
}

/**
 * Related-category internal links + 1 Wikipedia external link.
 * Drop at the bottom of product & category pages.
 */
export default function SeoLinks({ categorySlug, variant = 'product' }: Props) {
  const related = RELATED_CATEGORIES[categorySlug] ?? [];
  const wiki = WIKIPEDIA_BY_CATEGORY[categorySlug];
  if (related.length === 0 && !wiki) return null;

  return (
    <section
      className="bg-white rounded-md border border-[#e8e8e8] p-4 sm:p-5 mt-6"
      aria-label="Related links"
    >
      {related.length > 0 && (
        <>
          <h2 className="text-[15px] font-bold text-[#222] mb-2.5">
            {variant === 'product' ? 'Related Categories' : 'Explore More Categories'}
          </h2>
          <ul className="flex flex-wrap gap-2 mb-3">
            {related.map((slug) => (
              <li key={slug}>
                <Link
                  href={`/category/${slug}`}
                  className="inline-block text-[12.5px] font-medium text-link border border-[#e0e0e0] rounded-full px-3 py-1.5 hover:border-brand hover:text-brand transition-colors"
                >
                  {CATEGORY_NAMES[slug] ?? slug} price in Bangladesh
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      {wiki && (
        <p className="text-[12.5px] text-ink">
          Learn more about {wiki.title.toLowerCase()} on{' '}
          <a
            href={wiki.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link hover:underline"
          >
            Wikipedia
          </a>
          .
        </p>
      )}
    </section>
  );
}
