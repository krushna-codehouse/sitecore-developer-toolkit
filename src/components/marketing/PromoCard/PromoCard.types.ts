import type { ComponentParams, ComponentRendering, LinkField, RichTextField, TextField } from '@/lib/sitecore';

/** Datasource fields. Keep names identical to the Sitecore template field names. */
export interface PromoCardFields {
  heading: TextField;
  body?: RichTextField;
  link?: LinkField;
}

/** Rendering parameters. */
export interface PromoCardParams extends ComponentParams {
  styles?: string;
  RenderingIdentifier?: string;
}

export interface PromoCardProps {
  rendering: ComponentRendering;
  fields?: PromoCardFields;
  params?: PromoCardParams;
}
