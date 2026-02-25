import Link from "next/link";

const footerSections = [
  {
    title: "Content",
    links: [
      { href: "/", label: "Home" },
      { href: "/premier-league", label: "Premier League" },
      { href: "/football", label: "Football" },
      { href: "/news", label: "News" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/disclaimer", label: "Disclaimer" },
      { href: "/terms", label: "Terms & Conditions" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/cookies", label: "Cookies Policy" },
      { href: "/ccpa", label: "CCPA" },
    ],
  },
  {
    title: "Support",
    links: [{ href: "/contact", label: "Contact Us" }],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-dark-border bg-dark-card mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 text-lg font-bold text-white mb-4">
              <span className="text-primary">⚽</span>
              Football Live
            </Link>
            <p className="text-sm text-gray-400 max-w-xs">
              Watch live football matches and stay updated with the latest news from the world of football.
            </p>
          </div>
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-white mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-primary transition"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 pt-8 border-t border-dark-border text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Football Live. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
