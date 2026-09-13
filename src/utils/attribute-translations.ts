/**
 * What a column is called, in words rather than in database.
 *
 * A configuration may name its columns (`metadata.attributes.translations`), and
 * the legend has always read that — so a class row says "Gemiddelde neerslag"
 * where the data says `mean`. Every panel that shows a column name should say
 * the same thing, which is why this lives here rather than inside the legend.
 *
 * `metadata.attributes` is either the object itself or a **string** naming a
 * shared definition in `layerData.attributeMetadata`, so that many layers with
 * the same column names can share one set of labels. Both spellings resolve
 * here; a name with no translation keeps the column's own name, because a
 * missing label must never hide which column is being styled.
 */

export interface AttributeTranslation {
    /** The column's name in words; the column's own name when there is none. */
    label: string;
    /** Unit string, carrying its own leading space by this repo's convention. */
    unit: string;
    maxvalue?: number;
    valuemap?: Array<{ value: unknown; label: string; operator?: string }>;
}

export type AttributeTranslations = Map<string, AttributeTranslation>;

/**
 * Reads a layer's column labels.
 *
 * `rawAttributes` is `metadata.attributes` as the layer carries it, and
 * `catalog` is `state.attributeMetadata`, consulted only when the layer refers
 * to a shared definition by name.
 */
export function attributeTranslations(
    rawAttributes: unknown,
    catalog?: Record<string, unknown> | null,
): AttributeTranslations {
    const attributes = typeof rawAttributes === 'string'
        ? catalog?.[rawAttributes]
        : rawAttributes;
    const translations = (attributes as { translations?: unknown } | null | undefined)?.translations;
    const map: AttributeTranslations = new Map();
    if (!Array.isArray(translations)) return map;

    for (const entry of translations) {
        const name = (entry as { name?: unknown } | null)?.name;
        if (typeof name !== 'string' || name.length === 0) continue;
        const translation = entry as Record<string, unknown>;
        map.set(name, {
            label: typeof translation.translation === 'string' && translation.translation.length > 0
                ? translation.translation
                : name,
            unit: typeof translation.unit === 'string' ? translation.unit : '',
            ...(typeof translation.maxvalue === 'number' ? { maxvalue: translation.maxvalue } : {}),
            ...(Array.isArray(translation.valuemap) ? { valuemap: translation.valuemap } : {}),
        });
    }
    return map;
}

/**
 * A column named for someone choosing between columns.
 *
 * Both halves, because neither alone is enough: the label is what the reader
 * understands, and the column name is what they will see in the data, in an
 * info popup and in every expression the styler writes. A column with no label
 * of its own is shown once, not twice.
 */
export function attributeChoiceLabel(name: string, translations?: AttributeTranslations): string {
    const translated = translations?.get(name)?.label;
    return translated && translated !== name ? `${translated} (${name})` : name;
}
