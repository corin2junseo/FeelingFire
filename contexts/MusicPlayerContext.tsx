"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
} from "react";
import type { Music } from "@/lib/types/musics";

interface MusicPlayerContextType {
  playlist: Music[];
  currentTrack: Music | null;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  volume: number;
  playTrack: (music: Music) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (ratio: number) => void;
  setVolume: (v: number) => void;
  setPlaylist: (musics: Music[]) => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null);

export function MusicPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playlist, setPlaylist] = useState<Music[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Music | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.volume = 1;
      audio.onended = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
      };
      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
        setProgress(
          audio.duration ? (audio.currentTime / audio.duration) * 100 : 0
        );
      };
      audio.onloadedmetadata = () => setDuration(audio.duration);
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  const playTrack = useCallback(
    (music: Music) => {
      if (music.status !== "completed" || !music.file_url) return;

      const audio = getAudio();

      if (currentTrack?.id === music.id) {
        if (audio.paused) {
          audio.play().then(() => setIsPlaying(true)).catch(() => {});
        } else {
          audio.pause();
          setIsPlaying(false);
        }
        return;
      }

      audio.src = music.file_url;
      audio.currentTime = 0;
      setCurrentTrack(music);
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    },
    [currentTrack, getAudio]
  );

  const togglePlay = useCallback(() => {
    if (!currentTrack) return;
    const audio = getAudio();
    if (audio.paused) {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [currentTrack, getAudio]);

  const getCompleted = useCallback(
    () => playlist.filter((m) => m.status === "completed" && m.file_url),
    [playlist]
  );

  const next = useCallback(() => {
    const completed = getCompleted();
    if (!currentTrack || completed.length === 0) return;
    const idx = completed.findIndex((m) => m.id === currentTrack.id);
    const nextTrack = completed[(idx + 1) % completed.length];
    if (nextTrack) playTrack(nextTrack);
  }, [currentTrack, getCompleted, playTrack]);

  const prev = useCallback(() => {
    const completed = getCompleted();
    if (!currentTrack || completed.length === 0) return;
    const audio = getAudio();
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    const idx = completed.findIndex((m) => m.id === currentTrack.id);
    const prevTrack = completed[(idx - 1 + completed.length) % completed.length];
    if (prevTrack) playTrack(prevTrack);
  }, [currentTrack, getCompleted, getAudio, playTrack]);

  const seek = useCallback(
    (ratio: number) => {
      const audio = getAudio();
      if (!audio.duration) return;
      audio.currentTime = ratio * audio.duration;
    },
    [getAudio]
  );

  const setVolume = useCallback(
    (v: number) => {
      const audio = getAudio();
      audio.volume = v;
      setVolumeState(v);
    },
    [getAudio]
  );

  return (
    <MusicPlayerContext.Provider
      value={{
        playlist,
        currentTrack,
        isPlaying,
        progress,
        currentTime,
        duration,
        volume,
        playTrack,
        togglePlay,
        next,
        prev,
        seek,
        setVolume,
        setPlaylist,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx)
    throw new Error("useMusicPlayer must be used within MusicPlayerProvider");
  return ctx;
}
