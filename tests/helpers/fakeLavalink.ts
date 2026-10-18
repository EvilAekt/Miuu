// tests/helpers/fakeLavalink.ts: Fake Lavalink Player untuk Unit Testing Tanpa Server Lavalink
import type { Track } from "lavalink-client";
import { makeTrack } from "./factories.js";

export class FakeLavalinkPlayer {
  public guildId: string;
  public voiceChannelId: string;
  public textChannelId: string;
  public playing: boolean = false;
  public paused: boolean = false;
  public volume: number = 100;
  public position: number = 0;
  public repeatMode: "off" | "track" | "queue" = "off";

  public historyCalls: Array<{ method: string; args: any[] }> = [];

  public queue = {
    tracks: [] as Track[],
    current: null as Track | null,
    previous: [] as Track[],
    add: (track: Track | Track[], index?: number) => {
      this.recordCall("queue.add", [track, index]);
      const list = Array.isArray(track) ? track : [track];
      if (typeof index === "number") {
        this.queue.tracks.splice(index, 0, ...list);
      } else {
        this.queue.tracks.push(...list);
      }
    },
    shuffle: () => {
      this.recordCall("queue.shuffle", []);
      for (let i = this.queue.tracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.queue.tracks[i], this.queue.tracks[j]] = [this.queue.tracks[j], this.queue.tracks[i]];
      }
    },
  };

  public filterManager = {
    filters: {} as Record<string, any>,
    setEQ: async (eqBands: any) => {
      this.recordCall("filterManager.setEQ", [eqBands]);
      this.filterManager.filters.eq = eqBands;
    },
    setRotation: async (payload: any) => {
      this.recordCall("filterManager.setRotation", [payload]);
      this.filterManager.filters.rotation = payload;
    },
    setTimescale: async (payload: any) => {
      this.recordCall("filterManager.setTimescale", [payload]);
      this.filterManager.filters.timescale = payload;
    },
    toggleNightcore: async () => {
      this.recordCall("filterManager.toggleNightcore", []);
      this.filterManager.filters.nightcore = !this.filterManager.filters.nightcore;
    },
    toggleVaporwave: async () => {
      this.recordCall("filterManager.toggleVaporwave", []);
      this.filterManager.filters.vaporwave = !this.filterManager.filters.vaporwave;
    },
    resetFilters: async () => {
      this.recordCall("filterManager.resetFilters", []);
      this.filterManager.filters = {};
    },
  };

  private listeners: Map<string, Array<(...args: any[]) => void>> = new Map();

  constructor(guildId = "guild-fake", voiceChannelId = "voice-fake", textChannelId = "text-fake") {
    this.guildId = guildId;
    this.voiceChannelId = voiceChannelId;
    this.textChannelId = textChannelId;
  }

  private recordCall(method: string, args: any[]) {
    this.historyCalls.push({ method, args });
  }

  public async play(): Promise<void> {
    this.recordCall("play", []);
    if (!this.queue.current && this.queue.tracks.length > 0) {
      this.queue.current = this.queue.tracks.shift() || null;
    }
    this.playing = true;
    this.paused = false;
  }

  public async pause(): Promise<void> {
    this.recordCall("pause", []);
    this.paused = true;
    this.playing = false;
  }

  public async resume(): Promise<void> {
    this.recordCall("resume", []);
    this.paused = false;
    this.playing = true;
  }

  public async stop(destroy = false): Promise<void> {
    this.recordCall("stop", [destroy]);
    this.playing = false;
    this.paused = false;
    this.queue.current = null;
  }

  public async skip(): Promise<Track | null> {
    this.recordCall("skip", []);
    const prev = this.queue.current;
    if (prev) {
      this.queue.previous.push(prev);
    }
    if (this.queue.tracks.length > 0) {
      this.queue.current = this.queue.tracks.shift() || null;
      this.playing = true;
    } else {
      this.queue.current = null;
      this.playing = false;
    }
    return this.queue.current;
  }

  public async seek(position: number): Promise<void> {
    this.recordCall("seek", [position]);
    this.position = position;
  }

  public async setVolume(volume: number): Promise<void> {
    this.recordCall("setVolume", [volume]);
    this.volume = volume;
  }

  public setRepeatMode(mode: "off" | "track" | "queue"): void {
    this.recordCall("setRepeatMode", [mode]);
    this.repeatMode = mode;
  }

  public async search(query: any, requester?: any): Promise<any> {
    this.recordCall("search", [query, requester]);
    const track = makeTrack({
      title: typeof query === "string" ? query : query?.query || "Mock Search Song",
    });
    return {
      loadType: "track",
      tracks: [track],
      playlist: null,
    };
  }

  public async destroy(reason?: string): Promise<void> {
    this.recordCall("destroy", [reason]);
    this.playing = false;
    this.paused = false;
    this.queue.tracks = [];
    this.queue.current = null;
  }

  public on(event: string, listener: (...args: any[]) => void): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
    return this;
  }

  public emit(event: string, ...args: any[]): boolean {
    const list = this.listeners.get(event);
    if (!list || list.length === 0) return false;
    for (const fn of list) {
      fn(...args);
    }
    return true;
  }
}
