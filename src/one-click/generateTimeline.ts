import { VideoEditorFormat } from "../types/VideoEditingFormat";
import { OneClickInput } from "./types";
import { findBestAsset } from "./matcher";
import { Inputs } from "../types/Inputs";
import { Transform } from "../types/Transform";

export function generateBatchTimelines(input: OneClickInput): VideoEditorFormat[] {
    const { config, scripts, assets, bgm } = input;

    return scripts.map((script, scriptIdx) => {
        const inputs: Inputs = {};
        const videoClips: any[] = [];
        const voiceoverClips: any[] = [];
        const subtitleClips: any[] = [];

        let cursor = 0;
        const usedAssetIds = new Set<string>();

        // 1. Process Script Segments
        script.forEach((segment, index) => {
            // --- Voiceover / Duration ---
            let segmentDuration = segment.duration || 3; // Default 3s if no audio and no duration
            let voiceoverSourceKey = "";

            if (segment.voiceoverFile) {
                voiceoverSourceKey = `voiceover_${index}`;
                if (!inputs[voiceoverSourceKey]) {
                    inputs[voiceoverSourceKey] = {
                        type: "audio",
                        file: segment.voiceoverFile,
                        hasAudio: true,
                        hasVideo: false,
                        duration: segmentDuration,
                    };
                }

                voiceoverClips.push({
                    name: `vo_clip_${index}`,
                    source: voiceoverSourceKey,
                    timelineTrackStart: cursor,
                    duration: segmentDuration,
                    sourceStartOffset: 0,
                    clipType: "audio",
                    volume: 1.0,
                });
            }

            // --- Visual Match ---
            const asset = findBestAsset(segment, assets, usedAssetIds);
            if (asset) {
                usedAssetIds.add(asset.id);
                const visualSourceKey = `asset_${asset.id}`;

                // Register Visual Input
                if (!inputs[visualSourceKey]) {
                    inputs[visualSourceKey] = {
                        type: asset.type === "video" ? "video" : "image",
                        file: asset.url,
                        hasAudio: asset.type === "video", // Assuming video has audio? Often matched videos might be muted.
                        hasVideo: true,
                        duration: asset.duration,
                    };
                }

                // Create Video Clip
                let transform: Transform = {
                    x: 0,
                    y: 0,
                    width: config.width,
                    height: config.height,
                    rotation: 0,
                    opacity: 1
                };

                videoClips.push({
                    name: `video_clip_${index}`,
                    source: visualSourceKey,
                    timelineTrackStart: cursor,
                    duration: segmentDuration,
                    sourceStartOffset: 0,
                    clipType: asset.type === "video" ? "video" : "image",
                    transform: transform,
                    // If it's a video, we might want to mute its original audio if there is voiceover
                    volume: 0,
                });

            } else {
                // Fallback: Black/Color background if no asset found? 
                // For now, skip visual or assume placeholder
            }

            // --- Subtitle ---
            if (segment.text) {
                const textSourceKey = `text_${index}`;
                inputs[textSourceKey] = {
                    type: "text",
                    file: "", // Virtual source
                    hasAudio: false,
                    hasVideo: true,
                    duration: segmentDuration,
                    metadata: {
                        text: segment.text,
                        fontSize: Math.floor(config.height / 20),
                        fontColor: "#ffffff",
                        backgroundColor: "#00000080", // Semi-transparent background
                    }
                };

                subtitleClips.push({
                    name: `sub_clip_${index}`,
                    source: textSourceKey,
                    timelineTrackStart: cursor,
                    duration: segmentDuration, // Match segment duration
                    sourceStartOffset: 0,
                    clipType: "text",
                    transform: {
                        x: config.width * 0.1,
                        y: config.height * 0.85,
                        width: config.width * 0.8,
                        height: config.height * 0.1,
                        rotation: 0,
                        opacity: 1
                    }
                });
            }

            cursor += segmentDuration;
        });

        const totalDuration = cursor;

        // --- Background Music ---
        const bgmClips: any[] = [];
        if (bgm) {
            const bgmKey = "global_bgm";
            inputs[bgmKey] = {
                type: "audio",
                file: bgm.url,
                hasAudio: true,
                hasVideo: false,
                duration: 1000,
            };

            bgmClips.push({
                name: "bgm_main",
                source: bgmKey,
                timelineTrackStart: 0,
                duration: totalDuration,
                sourceStartOffset: 0,
                clipType: "audio",
                volume: bgm.volume || 0.5,
                metadata: {
                    audioType: "bgm",
                    loop: !!bgm.loop
                }
            });
        }

        // Assemble Tracks
        const tracks: VideoEditorFormat["tracks"] = {
            video_main: {
                type: "video",
                clips: videoClips
            },
            subtitle_main: {
                type: "video",
                clips: subtitleClips
            }
        };

        if (voiceoverClips.length > 0) {
            tracks.voiceover_main = {
                type: "audio",
                clips: voiceoverClips
            };
        }

        if (bgmClips.length > 0) {
            tracks.bgm_main = {
                type: "audio",
                clips: bgmClips
            };
        }

        return {
            version: 1,
            inputs,
            tracks,
            transitions: [],
            output: {
                tempDir: "./tmp",
                file: `one-click-output-${scriptIdx + 1}.mp4`,
                videoCodec: "libx264",
                audioCodec: "aac",
                audioBitrate: "320k",
                preset: "veryfast",
                crf: 23,
                flags: ["-pix_fmt", "yuv420p"],
                width: config.width,
                height: config.height,
                framerate: config.framerate || 30,
                startPosition: 0,
                endPosition: totalDuration,
                scaleRatio: 1
            }
        };
    });
}
