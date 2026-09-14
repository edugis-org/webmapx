export function metadataLabel(metadata: Record<string, unknown> | null | undefined): string | null {
    for (const key of ['label', 'title', 'webmapx:title']) {
        const value = metadata?.[key];
        if (typeof value === 'string' && value.length > 0) return value;
    }
    return null;
}

export function styleSublayerLabel(
    sublayer: Record<string, unknown> | null | undefined,
    fallbackId?: string,
): string | null {
    const label = styleSublayerMetadataLabel(sublayer);
    if (label) return label;

    const rawId = typeof fallbackId === 'string' ? fallbackId : typeof sublayer?.id === 'string' ? sublayer.id : '';
    return rawId ? rawId.replace(/^style:/, '').replace(/-/g, ' ') : null;
}

export function styleSublayerMetadataLabel(sublayer: Record<string, unknown> | null | undefined): string | null {
    const metadata = sublayer?.metadata && typeof sublayer.metadata === 'object'
        ? sublayer.metadata as Record<string, unknown>
        : null;
    return metadataLabel(metadata);
}

export function styleSublayerTypeLabel(sublayer: Record<string, unknown> | null | undefined): string | null {
    const type = typeof sublayer?.type === 'string' ? sublayer.type : '';
    if (!type) return null;
    if (type === 'symbol') return 'label';
    if (type === 'circle') return 'points';
    return type;
}

export function legendSublayerLabel(
    parentMetadata: Record<string, unknown> | null | undefined,
    sublayer: Record<string, unknown> | null | undefined,
    fallbackId: string,
    singleSublayer: boolean,
): string {
    // A sublayer's own name wins even when it is the only one: that is where the
    // styler writes a rename, and a layer's name falling back in behind it is
    // what the style is called until someone gives it one of its own.
    return singleSublayer
        ? styleSublayerMetadataLabel(sublayer) ?? metadataLabel(parentMetadata) ?? styleSublayerTypeLabel(sublayer) ?? ''
        : styleSublayerMetadataLabel(sublayer) ?? styleSublayerTypeLabel(sublayer) ?? fallbackId.replace(/^style:/, '').replace(/-/g, ' ');
}
