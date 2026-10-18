import type { Command } from "./types.js";
import { playCommand } from "./play.js";
import { pauseCommand } from "./pause.js";
import { resumeCommand } from "./resume.js";
import { skipCommand } from "./skip.js";
import { stopCommand } from "./stop.js";
import { queueCommand } from "./queue.js";
import { nowPlayingCommand } from "./nowplaying.js";
import { volumeCommand } from "./volume.js";
import { loopCommand } from "./loop.js";
import { shuffleCommand } from "./shuffle.js";
import { seekCommand } from "./seek.js";
import { removeCommand } from "./remove.js";
import { clearCommand } from "./clear.js";
import { filterCommand } from "./filter.js";
import { playlistCommand } from "./playlist.js";
import { favoriteCommand } from "./favorite.js";
import { importCommand } from "./import.js";
import { autoplayCommand } from "./autoplay.js";
import { historyCommand } from "./history.js";
import { skiptoCommand } from "./skipto.js";
import { previousCommand } from "./previous.js";
import { moveCommand } from "./move.js";
import { restoreCommand } from "./restore.js";
import { alwaysOnCommand } from "./alwayson.js";
import { componentsCommand } from "./components.js";
import { lyricsCommand } from "./lyrics.js";
import { statusCommand } from "./status.js";
import { diagnoseCommand } from "./diagnose.js";
import { fixmatchCommand } from "./fixmatch.js";
import { statsCommand } from "./stats.js";
import { radioCommand } from "./radio.js";
import { settingsCommand } from "./settings.js";
import { forgetCommand } from "./forget.js";
import { libraryCommand } from "./library.js";
import { scrobbleCommand } from "./scrobble.js";
import { whythisCommand } from "./whythis.js";
import { podcastCommand } from "./podcast.js";
import { sleeptimerCommand } from "./sleeptimer.js";
import { sfxCommand } from "./sfx.js";
import { moodCommand } from "./mood.js";
import { backupCommand } from "./backup.js";
import { audiofxCommand } from "./audiofx.js";
import { wrappedCommand } from "./wrapped.js";
import { djCommand } from "./dj.js";
import { crossfadeCommand } from "./crossfade.js";
import { quizCommand } from "./quiz.js";
import { askCommand } from "./ask.js";

export const commands: Command[] = [
  playCommand,
  pauseCommand,
  resumeCommand,
  skipCommand,
  stopCommand,
  queueCommand,
  nowPlayingCommand,
  volumeCommand,
  loopCommand,
  shuffleCommand,
  seekCommand,
  removeCommand,
  clearCommand,
  filterCommand,
  playlistCommand,
  favoriteCommand,
  importCommand,
  autoplayCommand,
  historyCommand,
  skiptoCommand,
  previousCommand,
  moveCommand,
  restoreCommand,
  alwaysOnCommand,
  componentsCommand,
  lyricsCommand,
  statusCommand,
  diagnoseCommand,
  fixmatchCommand,
  statsCommand,
  radioCommand,
  settingsCommand,
  forgetCommand,
  libraryCommand,
  scrobbleCommand,
  whythisCommand,
  podcastCommand,
  sleeptimerCommand,
  sfxCommand,
  moodCommand,
  backupCommand,
  audiofxCommand,
  wrappedCommand,
  djCommand,
  crossfadeCommand,
  quizCommand,
  askCommand,
];

export const commandMap = new Map<string, Command>(
  commands.map((cmd) => [cmd.data.name, cmd])
);
