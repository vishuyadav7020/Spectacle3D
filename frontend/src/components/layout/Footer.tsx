const FOOTER_COLUMNS: { title: string; links: string[] }[] = [
  { title: "Shop", links: ["Miniatures", "Home Decor", "Cosplay Props", "Gifts"] },
  { title: "Company", links: ["About Us", "Custom Orders", "Blog"] },
  { title: "Support", links: ["Contact", "Shipping", "Returns", "FAQ"] },
];

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-12 md:px-16">
      <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <span className="font-display text-xl font-bold text-accent-primary">
            Spectacle3D
          </span>
          <p className="mt-3 font-body text-sm text-text-secondary">
            Custom 3D printed products, designed and printed in-house.
          </p>
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

      <p className="mt-10 font-body text-xs text-text-secondary">
        © {new Date().getFullYear()} Spectacle3D. All rights reserved.
      </p>
    </footer>
  );
}
