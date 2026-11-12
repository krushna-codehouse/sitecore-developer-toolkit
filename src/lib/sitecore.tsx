/**
 * Sitecore field adapter — the ONE swap point between this toolkit and a real
 * Content SDK application.
 *
 * Generated components import field types and field components from
 * "@/lib/sitecore" instead of the SDK directly. In a Content SDK app, replace
 * the contents of this file with:
 *
 *   export * from '@sitecore-content-sdk/nextjs';
 *
 * The names below (Field, TextField, RichTextField, ImageField, LinkField,
 * ComponentRendering, ComponentParams, Text, RichText, Image, Link) mirror the
 * SDK so generated code compiles unchanged. This lightweight version lets the
 * toolkit, its tests and the dashboard run without a Sitecore connection.
 */
import type { AnchorHTMLAttributes, ElementType, HTMLAttributes, ImgHTMLAttributes } from 'react';

export interface Field<T = string> {
  value?: T;
  /** Chrome markup supplied in editing mode. */
  editable?: string;
  metadata?: Record<string, unknown>;
}

export type TextField = Field<string>;
export type RichTextField = Field<string>;

export interface ImageFieldValue {
  src?: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
}
export type ImageField = Field<ImageFieldValue>;

export interface LinkFieldValue {
  href?: string;
  text?: string;
  target?: string;
  title?: string;
  anchor?: string;
  querystring?: string;
}
export type LinkField = Field<LinkFieldValue>;

export interface ComponentParams {
  [key: string]: string | undefined;
}

export interface ComponentRendering {
  componentName: string;
  uid?: string;
  dataSource?: string;
  params?: ComponentParams;
  placeholders?: Record<string, ComponentRendering[]>;
}

type TextProps = HTMLAttributes<HTMLElement> & {
  field?: TextField;
  tag?: ElementType;
  editable?: boolean;
};

export function Text({ field, tag: Tag = 'span', editable = true, ...rest }: TextProps) {
  if (!field || (!field.value && !field.editable)) return null;
  if (editable && field.editable) {
    return <Tag {...rest} dangerouslySetInnerHTML={{ __html: field.editable }} />;
  }
  return <Tag {...rest}>{field.value}</Tag>;
}

type RichTextProps = HTMLAttributes<HTMLElement> & {
  field?: RichTextField;
  tag?: ElementType;
  editable?: boolean;
};

/** Rich text is authored HTML from the CMS and is rendered as-is, as the SDK does. */
export function RichText({ field, tag: Tag = 'div', editable = true, ...rest }: RichTextProps) {
  if (!field || (!field.value && !field.editable)) return null;
  const html = editable && field.editable ? field.editable : (field.value ?? '');
  return <Tag {...rest} dangerouslySetInnerHTML={{ __html: html }} />;
}

type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & { field?: ImageField };

export function Image({ field, ...rest }: ImageProps) {
  const value = field?.value;
  if (!value?.src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={value.src} alt={value.alt ?? ''} width={value.width} height={value.height} {...rest} />;
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { field?: LinkField };

export function Link({ field, children, ...rest }: LinkProps) {
  const value = field?.value;
  if (!value?.href) return null;
  const href = `${value.href}${value.querystring ? `?${value.querystring}` : ''}${value.anchor ? `#${value.anchor}` : ''}`;
  return (
    <a
      href={href}
      target={value.target || undefined}
      title={value.title || undefined}
      rel={value.target === '_blank' ? 'noopener noreferrer' : undefined}
      {...rest}
    >
      {children ?? value.text ?? value.href}
    </a>
  );
}
