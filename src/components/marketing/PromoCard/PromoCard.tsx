import { Link, RichText, Text } from '@/lib/sitecore';
import styles from './PromoCard.module.css';
import type { PromoCardProps } from './PromoCard.types';

export default function PromoCard({ fields, params }: PromoCardProps) {
  if (!fields) {
    return <div className={styles.empty}>Promo Card: datasource is not set.</div>;
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
