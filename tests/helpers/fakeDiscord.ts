// tests/helpers/fakeDiscord.ts: Fake Discord Interaction untuk Unit Testing Command Tanpa Gateway
import type { ChatInputCommandInteraction } from "discord.js";
import { makeUser, makeGuild } from "./factories.js";

export class FakeInteraction {
  public guildId: string;
  public channelId: string;
  public user: any;
  public member: any;
  public channel: any;
  public replied: boolean = false;
  public deferred: boolean = false;
  public ephemeral: boolean = false;

  public replies: Array<{ type: "reply" | "deferReply" | "editReply" | "followUp"; payload: any }> = [];
  public optionValues: Map<string, any> = new Map();
  public currentSubcommand: string = "";

  constructor(override: {
    guildId?: string;
    channelId?: string;
    userId?: string;
    voiceChannelId?: string | null;
    roles?: string[];
  } = {}) {
    this.guildId = override.guildId || "guild_123456";
    this.channelId = override.channelId || "channel_123456";
    this.user = makeUser({ id: override.userId || "user_123456" });

    const roleMap = new Map();
    if (override.roles) {
      for (const r of override.roles) {
        roleMap.set(r, { id: r, name: r });
      }
    }

    this.member = {
      user: this.user,
      voice: {
        channel: override.voiceChannelId === null
          ? null
          : { id: override.voiceChannelId || "voice_channel_123", name: "General Voice" },
      },
      roles: {
        cache: roleMap,
      },
    };

    this.channel = {
      id: this.channelId,
      send: async (payload: any) => {
        this.replies.push({ type: "followUp", payload });
        return payload;
      },
    };
  }

  public setOption(name: string, value: any): this {
    this.optionValues.set(name, value);
    return this;
  }

  public setSubcommand(name: string): this {
    this.currentSubcommand = name;
    return this;
  }

  public options = {
    getString: (name: string, required = false) => {
      const val = this.optionValues.get(name);
      if (val === undefined && required) throw new Error(`Missing required option string: ${name}`);
      return val !== undefined ? String(val) : null;
    },
    getInteger: (name: string, required = false) => {
      const val = this.optionValues.get(name);
      if (val === undefined && required) throw new Error(`Missing required option int: ${name}`);
      return val !== undefined ? Number(val) : null;
    },
    getNumber: (name: string, required = false) => {
      const val = this.optionValues.get(name);
      if (val === undefined && required) throw new Error(`Missing required option number: ${name}`);
      return val !== undefined ? Number(val) : null;
    },
    getBoolean: (name: string, required = false) => {
      const val = this.optionValues.get(name);
      if (val === undefined && required) throw new Error(`Missing required option bool: ${name}`);
      return val !== undefined ? Boolean(val) : null;
    },
    getSubcommand: () => this.currentSubcommand,
    getFocused: () => this.optionValues.get("focused") || "",
  };

  public async reply(payload: any): Promise<any> {
    this.replied = true;
    if (payload?.ephemeral) this.ephemeral = true;
    this.replies.push({ type: "reply", payload });
    return payload;
  }

  public async deferReply(options?: { ephemeral?: boolean }): Promise<void> {
    this.deferred = true;
    if (options?.ephemeral) this.ephemeral = true;
    this.replies.push({ type: "deferReply", payload: options });
  }

  public async editReply(payload: any): Promise<any> {
    this.replies.push({ type: "editReply", payload });
    return payload;
  }

  public async followUp(payload: any): Promise<any> {
    this.replies.push({ type: "followUp", payload });
    return payload;
  }

  public getLastReply(): any {
    return this.replies[this.replies.length - 1]?.payload;
  }
}
