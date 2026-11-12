import type { ComponentParams, ComponentRendering, LinkField, RichTextField, TextField } from '@/lib/sitecore';

/** Datasource fields. Keep names identical to the Sitecore template field names. */
export interface {{name}}Fields {
  heading: TextField;
  body?: RichTextField;
  link?: LinkField;
}

/** Rendering parameters. */
export interface {{name}}Params extends ComponentParams {
  styles?: string;
  RenderingIdentifier?: string;
}

export interface {{name}}Props {
  rendering: ComponentRendering;
  fields?: {{name}}Fields;
  params?: {{name}}Params;
}
