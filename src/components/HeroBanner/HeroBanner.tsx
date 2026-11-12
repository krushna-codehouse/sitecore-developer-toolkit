import { Link, RichText, Text } from '@/lib/sitecore';
import styles from './HeroBanner.module.css';
import type { HeroBannerProps } from './HeroBanner.types';

export default function HeroBanner({ fields, params }: HeroBannerProps) {
  if (!fields) {
    return <div className={styles.empty}>Hero Banner: datasource is not set.</div>;
  }

  const className = [styles.root, params?.styles].filter(Boolean).join(' ');

  return (
    <section className={className} id={params?.RenderingIdentifier || undefined}>
      <Text tag="h2" field={fields.heading} className={styles.heading} />
      <RichText field={fields.body} className={styles.body} />
      <Link field={fields.link} className={styles.link} />
    </section>
  );
}
