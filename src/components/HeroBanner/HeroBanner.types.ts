import type { ComponentParams, ComponentRendering, LinkField, RichTextField, TextField } from '@/lib/sitecore';

/** Datasource fields. Keep names identical to the Sitecore template field names. */
export interface HeroBannerFields {
  heading: TextField;
  body?: RichTextField;
  link?: LinkField;
}

/** Rendering parameters. */
export interface HeroBannerParams extends ComponentParams {
  styles?: string;
  RenderingIdentifier?: string;
}

export interface HeroBannerProps {
  rendering: ComponentRendering;
  fields?: HeroBannerFields;
  params?: HeroBannerParams;
}
