export type AssetType = "video" | "audio" | "image";

export interface OneClickAsset {
    id: string;
    url: string;
    type: AssetType;
    tags?: string[];
    duration: number;
}

export interface ScriptSegment {
    text: string;
    duration?: number;
    keywords?: string[];
    voiceoverFile?: string;
}

export interface OneClickConfig {
    width: number;
    height: number;
    framerate?: number;
    bgmVolume?: number;
}

export interface OneClickInput {
    config: OneClickConfig;
    scripts: ScriptSegment[][];
    assets: OneClickAsset[];
    bgm?: {
        url: string;
        loop?: boolean;
        volume?: number;
    };
}
