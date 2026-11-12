import { Link, RichText, Text } from '@/lib/sitecore';
import styles from './{{name}}.module.css';
import type { {{name}}Props } from './{{name}}.types';

export default function {{name}}({ fields, params }: {{name}}Props) {
  if (!fields) {
    return <div className={styles.empty}>{{titleName}}: datasource is not set.</div>;
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
