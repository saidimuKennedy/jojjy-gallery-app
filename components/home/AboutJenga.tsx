import OptimizedImage from "@/components/ui/OptimizedImage";
import { ArrowLink, Shell } from "@/components/home/primitives";
import { Reveal, RevealGroup, RevealItem } from "@/components/home/motion";

/**
 * Artist portrait. Uses the image committed in the repo (`public/images/`)
 * so the homepage always has a real portrait even if remote media is missing;
 * the About page links the same subject via Cloudinary.
 */
const ARTIST_PORTRAIT = "/images/joj-artist.png";

export default function AboutJenga() {
  return (
    <section className="border-t border-white/5 bg-black py-20 md:py-28 lg:py-32">
      <Shell>
        <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Reveal
            className="relative aspect-[4/5] overflow-hidden bg-black"
            y={22}
            duration={1.1}
          >
            <OptimizedImage
              src={ARTIST_PORTRAIT}
              alt="Portrait of JENGA"
              fill
              preset="hero"
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
          </Reveal>

          <RevealGroup className="max-w-2xl" stagger={0.1} delay={0.15}>
            <RevealItem y={20}>
              <h2 className="jenga-cream font-display text-5xl font-light tracking-tight md:text-6xl lg:text-7xl">
                JENGA
              </h2>
            </RevealItem>
            <RevealItem y={18} className="mt-7">
              <p className="jenga-cream font-display text-xl font-light leading-relaxed md:text-2xl">
                A multidisciplinary Kenyan artist working across visual art and
                music.
              </p>
            </RevealItem>
            <RevealItem y={16} className="mt-6">
              <p className="jenga-body-text text-sm leading-[1.95] md:text-base">
                His work explores memory, identity, love and the complexities of
                human connection. Through drawing and song, he gives form to the
                emotions that shape how we live, relate and transform.
              </p>
            </RevealItem>
            <RevealItem y={14} className="mt-10">
              <ArrowLink href="/about">Read about Jenga</ArrowLink>
            </RevealItem>
          </RevealGroup>
        </div>
      </Shell>
    </section>
  );
}
