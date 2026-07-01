import type { ApifyItem } from '../reel-pipeline/types';
import { asString } from '../reel-pipeline/utils';
import type { CarouselSlide, PostKind } from './types';

export function detectPostKind(item: ApifyItem): PostKind {
  const type = (asString(item.type) ?? '').toLowerCase();
  const productType = (asString(item.productType) ?? '').toLowerCase();
  const childPosts = Array.isArray(item.childPosts) ? item.childPosts : [];
  const images = Array.isArray(item.images) ? item.images : [];

  if (
    type === 'sidecar' ||
    productType.includes('carousel') ||
    childPosts.length > 1 ||
    images.length > 1
  ) {
    return 'carousel';
  }

  if (type === 'video' || asString(item.videoUrl)) {
    return 'reel';
  }

  return 'image';
}

export function extractCarouselSlides(item: ApifyItem): CarouselSlide[] {
  const childPosts = Array.isArray(item.childPosts) ? item.childPosts : [];
  const imageUrls = Array.isArray(item.images)
    ? item.images.filter((url): url is string => typeof url === 'string')
    : [];

  if (childPosts.length) {
    return childPosts.map((child, index) => {
      const row = child as ApifyItem;
      return {
        index,
        shortCode: asString(row.shortCode) ?? asString(row.shortcode),
        type: asString(row.type) ?? 'Image',
        displayUrl:
          asString(row.displayUrl) ??
          asString(row.displayURL) ??
          imageUrls[index] ??
          '',
        alt: asString(row.alt),
        url: asString(row.url),
      };
    }).filter((slide) => slide.displayUrl);
  }

  const fallbackUrl =
    asString(item.displayUrl) ?? asString(item.displayURL) ?? '';

  const urls = imageUrls.length ? imageUrls : fallbackUrl ? [fallbackUrl] : [];

  return urls.map((displayUrl, index) => ({
    index,
    type: 'Image',
    displayUrl,
    alt: index === 0 ? asString(item.alt) : undefined,
  }));
}

export function maxCarouselSlides() {
  return Number(process.env.MAX_CAROUSEL_SLIDES ?? '10');
}
