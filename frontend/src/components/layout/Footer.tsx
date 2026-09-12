const FOOTER_COLUMNS: { title: string; links: string[] }[] = [
  { title: "Shop", links: ["All Products", "Home Decor", "Car Accessories", "Toys & Figurines", "Gadgets & Tech"] },
  { title: "Company", links: ["About Us", "Our Process", "Blog", "Contact"] },
  { title: "Support", links: ["Shipping Policy", "Returns", "FAQ", "Privacy Policy"] },
];

// lucide-react removed brand/social icons entirely — use initials instead
// rather than pulling in a separate icon-set dependency for placeholder links.
const SOCIALS = ["IG", "FB", "X"];

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-12 md:px-16">
      <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <span className="font-display text-xl font-bold text-text-primary">
            Spectacle<span className="text-accent-primary">3D</span>
          </span>
          <p className="mt-3 font-body text-sm text-text-secondary">
            A full catalog of premium 3D printed products — home decor, car
            accessories, toys, gadgets, and art. Designed and made with care.
          </p>
          <div className="mt-4 flex gap-3">
            {SOCIALS.map((label) => (
              <a
                key={label}
                href="#"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border font-body text-[10px] font-semibold text-text-secondary transition-colors hover:text-text-primary"
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <h4 className="font-body text-sm font-semibold text-text-primary">
              {column.title}
            </h4>
            {column.links.map((link) => (
              <a
                key={link}
                href="#"
                className="font-body text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                {link}
              </a>
            ))}
          </div>
        ))}
      </div>

      <p className="mt-10 border-t border-border pt-6 font-body text-xs text-text-secondary">
        © {new Date().getFullYear()} Spectacle3D. All rights reserved.
      </p>
    </footer>
  );
}
