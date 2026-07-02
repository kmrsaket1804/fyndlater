export type DmSharePreview = {
  previewUrl: string;
  caption?: string;
  mediaId?: string;
  attachmentType: string;
};

export type ResolvedInstagramContent =
  | { kind: 'permalink'; postUrl: string; source: 'text' | 'webhook' | 'message_shares' | 'graph_media' }
  | { kind: 'dm_preview'; preview: DmSharePreview; source: 'ig_post_cdn' };
