const ids = [202, 200, 199, 197, 201, 354, 528, 522];
const decode = value => value
  .replace(/<[^>]+>/g, '')
  .replace(/&#8217;/g, '’').replace(/&#8211;/g, '–').replace(/&#038;/g, '&')
  .replace(/&nbsp;|&amp;|&#\d+;|&[a-z]+;/gi, ' ')
  .replace(/\s+/g, ' ').trim();
const result = await Promise.all(ids.map(async id => {
  const page = await fetch(`https://flsc.org/wordpress/wp-json/wp/v2/pages/${id}`).then(r => r.json());
  const html = page.content.rendered;
  return {
    id,
    slug: page.slug,
    title: page.title.rendered,
    headings: [...html.matchAll(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi)].map(m => decode(m[1])).filter(Boolean),
    images: [...html.matchAll(/<img[^>]+src=["']([^"']+)/gi)].map(m => m[1]),
    links: [...html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map(m => ({ href: m[1], text: decode(m[2]) })).filter(x => x.text)
  };
}));
console.log(JSON.stringify(result, null, 2));
