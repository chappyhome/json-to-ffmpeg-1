import { OneClickAsset, ScriptSegment } from "./types";

/**
 * Find the best matching asset for a script segment.
 * Scoring is based on the number of overlapping tags/keywords.
 * 
 * @param segment - The current script segment
 * @param assets - Available assets
 * @param usedAssetIds - Set of already used asset IDs to prefer variety (optional logic could punish reuse)
 */
export function findBestAsset(
    segment: ScriptSegment,
    assets: OneClickAsset[],
    usedAssetIds: Set<string>
): OneClickAsset | null {
    const visualAssets = assets.filter(a => a.type === "video" || a.type === "image");

    if (visualAssets.length === 0) {
        return null;
    }

    const keywords = (segment.keywords || []).map(k => k.toLowerCase());

    let bestAsset: OneClickAsset | null = null;
    let maxScore = -1;

    for (const asset of visualAssets) {
        let score = 0;

        // Tag matching score
        if (asset.tags && keywords.length > 0) {
            const assetTags = asset.tags.map(t => t.toLowerCase());
            const matchCount = keywords.filter(k => assetTags.includes(k)).length;
            score += matchCount * 10;
        }

        // Reuse penalty (try to avoid showing same clip twice if possible)
        if (usedAssetIds.has(asset.id)) {
            score -= 5;
        }

        // Type preference: Video > Image (optional preference)
        if (asset.type === 'video') {
            score += 2;
        }

        if (score > maxScore) {
            maxScore = score;
            bestAsset = asset;
        }
    }

    // Fallback: if no keywords matches, pick a random unused one, or just random
    if (maxScore <= 0 && !bestAsset) {
        const unusedAssets = visualAssets.filter(a => !usedAssetIds.has(a.id));
        if (unusedAssets.length > 0) {
            return unusedAssets[Math.floor(Math.random() * unusedAssets.length)];
        }
        return visualAssets[Math.floor(Math.random() * visualAssets.length)];
    }

    return bestAsset;
}
