import { redirect } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

/** Old URL /post/[slug] → redirect to /[slug] */
export default async function PostSlugRedirect({ params }: Props) {
  const { slug } = await params;
  redirect(`/${slug}`);
}
