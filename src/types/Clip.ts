import { Transform } from "./Transform";

export type ImageClip = {
  name: string;
  source: string;
  timelineTrackStart: number;
  duration: number;
  sourceStartOffset: number;
  clipType: "image";
  transform: Transform;
  metadata?: any;
};

export type VideoClip = {
  name: string;
  source: string;
  timelineTrackStart: number;
  duration: number;
  sourceStartOffset: number;
  clipType: "video";
  transform: Transform;
  metadata?: any;
};

export type AudioClip = {
  name: string;
  source: string;
  timelineTrackStart: number;
  duration: number;
  sourceStartOffset: number;
  clipType: "audio";
  volume: number;
  metadata?: any;
};

export type TextClip = {
  name: string;
  source: string;
  timelineTrackStart: number;
  duration: number;
  sourceStartOffset: number;
  clipType: "text";
  transform: Transform;
  metadata?: any;
};

export type Clip = VideoClip | AudioClip | ImageClip | TextClip;
