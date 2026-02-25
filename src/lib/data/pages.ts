import { readJson, writeJson } from "../store";

export type PageSlug =
  | "about"
  | "disclaimer"
  | "terms"
  | "privacy"
  | "cookies"
  | "ccpa"
  | "contact";

export interface IPage {
  slug: PageSlug;
  title: string;
  content: string; // HTML
  createdAt: string;
  updatedAt: string;
}

const FILE = "pages.json";

const DEFAULT_PAGES: Array<Pick<IPage, "slug" | "title" | "content">> = [
  {
    slug: "about",
    title: "About Us",
    content: `
      <p><strong>Football Live</strong> is a sports media platform dedicated to bringing you live football matches and the latest news from the world of football.</p>
      <p>We cover major leagues, including the Premier League, and provide up-to-date scores, schedules, and analysis.</p>
      <p>For any inquiries, please visit our <a href="/contact">Contact</a> page.</p>
    `,
  },
  {
    slug: "disclaimer",
    title: "Disclaimer",
    content: `
      <p>The information provided on Football Live is for general informational and entertainment purposes only.</p>
      <p>We do not host or stream any copyrighted content. All stream links are provided by third parties and we do not have control over external streams.</p>
      <p>If you are a rights holder and believe content on this site infringes your rights, please contact us via the DMCA email on the Contact page.</p>
    `,
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    content: `
      <p>By accessing and using Football Live, you accept and agree to be bound by these Terms and Conditions.</p>
      <h2>Use of Service</h2>
      <p>You agree to use this service only for lawful purposes and in a way that does not infringe the rights of others.</p>
      <h2>Content</h2>
      <p>Content may include links to third-party streams. We do not endorse or assume responsibility for third-party content.</p>
      <h2>Changes</h2>
      <p>We may update these terms from time to time. Continued use of the site after changes constitutes acceptance.</p>
    `,
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    content: `
      <p>Football Live respects your privacy. This policy describes how we collect, use, and protect your information.</p>
      <h2>Information We Collect</h2>
      <p>We may collect information you provide (e.g. when contacting us), usage data (e.g. pages visited), and technical data (e.g. IP address) for analytics and security.</p>
      <h2>Cookies</h2>
      <p>We use cookies and similar technologies as described in our <a href="/cookies">Cookies Policy</a>.</p>
      <h2>Your Rights</h2>
      <p>You may have rights to access, correct, or delete your data depending on your jurisdiction. Contact us for privacy requests.</p>
    `,
  },
  {
    slug: "cookies",
    title: "Cookies Policy",
    content: `
      <p>Football Live uses cookies and similar technologies to improve your experience, analyze traffic, and support advertising.</p>
      <h2>What Are Cookies</h2>
      <p>Cookies are small text files stored on your device when you visit a website.</p>
      <h2>Managing Cookies</h2>
      <p>You can control or delete cookies through your browser settings. Disabling cookies may affect site features.</p>
    `,
  },
  {
    slug: "ccpa",
    title: "CCPA (California Consumer Privacy Act)",
    content: `
      <p>If you are a California resident, the CCPA may give you certain rights regarding your personal information.</p>
      <h2>Your Rights</h2>
      <p>You may have the right to know what personal information we collect, request deletion, and opt-out of the sale of personal information (we do not sell personal information).</p>
      <h2>How to Exercise Your Rights</h2>
      <p>To submit a request, please contact us via the <a href="/contact">Contact Us</a> page.</p>
    `,
  },
  {
    slug: "contact",
    title: "Contact Us",
    content: `
      <p>For general inquiries, feedback, or support, please reach out using the information below.</p>
      <h2>DMCA / Copyright</h2>
      <p>If you are a rights holder and believe content on this site infringes your copyright, please contact our DMCA agent at:</p>
      <div style="padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.03);">
        <strong>DMCA Contact:</strong><br />
        Email: <a href="mailto:dmca@example.com">dmca@example.com</a>
      </div>
      <p><em>Replace dmca@example.com with your real DMCA email before production.</em></p>
      <h2>General Contact</h2>
      <p>Email: <a href="mailto:contact@example.com">contact@example.com</a></p>
    `,
  },
];

async function getPages(): Promise<IPage[]> {
  return readJson<IPage[]>(FILE);
}

async function savePages(pages: IPage[]): Promise<void> {
  await writeJson(FILE, pages);
}

export async function ensureDefaultPages(): Promise<void> {
  const pages = await getPages();
  if (pages.length > 0) return;
  const now = new Date().toISOString();
  const seeded: IPage[] = DEFAULT_PAGES.map((p) => ({
    ...p,
    createdAt: now,
    updatedAt: now,
  })) as IPage[];
  await savePages(seeded);
}

export async function listPages(): Promise<IPage[]> {
  await ensureDefaultPages();
  const pages = await getPages();
  return pages.sort((a, b) => a.slug.localeCompare(b.slug));
}

export async function getPage(slug: PageSlug): Promise<IPage | null> {
  await ensureDefaultPages();
  const pages = await getPages();
  return pages.find((p) => p.slug === slug) ?? null;
}

export async function updatePage(
  slug: PageSlug,
  data: Partial<Pick<IPage, "title" | "content">>
): Promise<IPage | null> {
  await ensureDefaultPages();
  const pages = await getPages();
  const idx = pages.findIndex((p) => p.slug === slug);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  pages[idx] = {
    ...pages[idx],
    ...data,
    slug,
    updatedAt: now,
  };
  await savePages(pages);
  return pages[idx];
}

