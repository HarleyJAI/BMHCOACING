import { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX,
  Settings,
  Loader2,
  X,
  ChevronDown
} from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from './ui/dropdown-menu';
import { fetchApi } from '../lib/utils';
import { toast } from 'sonner';

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const VOICE_OPTIONS = [
  { id: 'dr_marcus', name: 'Dr. Marcus', description: 'Authoritative male voice' },
  { id: 'dr_amara', name: 'Dr. Amara', description: 'Warm professional female' },
  { id: 'coach_jordan', name: 'Coach Jordan', description: 'Energetic motivational' },
];

export function AudioPlayer({ 
  text, 
  title = 'Listen to this content',
  compact = false,
  onPlayStateChange,
  className = ''
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState('dr_amara');
  const [showPlayer, setShowPlayer] = useState(false);
  
  const audioRef = useRef(null);

  useEffect(() => {
    // Load user preferences
    const loadPreferences = async () => {
      try {
        const prefs = await fetchApi('/user/voice-preference');
        setSelectedVoice(prefs.voice_id || 'dr_amara');
        setPlaybackSpeed(prefs.playback_speed || 1);
      } catch (e) {
        // Use defaults
      }
    };
    loadPreferences();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const generateAudio = async () => {
    if (!text || text.trim().length === 0) {
      toast.error('No content to read');
      return;
    }

    setIsLoading(true);
    setShowPlayer(true);
    
    try {
      const response = await fetchApi('/tts/generate', {
        method: 'POST',
        body: JSON.stringify({
          text: text,
          voice_id: selectedVoice,
          speed: playbackSpeed
        })
      });
      
      setAudioUrl(response.audio_url);
      setDuration(response.duration_estimate);
      
      // Auto-play after generation
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }, 100);
      
    } catch (error) {
      toast.error('Failed to generate audio');
      setShowPlayer(false);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    if (!audioUrl) {
      generateAudio();
      return;
    }
    
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const dur = audioRef.current.duration || duration;
      setCurrentTime(current);
      setProgress((current / dur) * 100);
    }
  };

  const handleSeek = (value) => {
    if (audioRef.current && audioRef.current.duration) {
      const newTime = (value[0] / 100) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setProgress(value[0]);
    }
  };

  const skip = (seconds) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const handleVoiceChange = async (voiceId) => {
    setSelectedVoice(voiceId);
    setAudioUrl(null); // Clear cached audio
    setProgress(0);
    setCurrentTime(0);
    
    // Save preference
    try {
      await fetchApi('/user/voice-preference', {
        method: 'POST',
        body: JSON.stringify({
          voice_id: voiceId,
          playback_speed: playbackSpeed,
          auto_play: false
        })
      });
    } catch (e) {
      // Silent fail
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    onPlayStateChange?.(false);
  };

  const selectedVoiceName = VOICE_OPTIONS.find(v => v.id === selectedVoice)?.name || 'Dr. Amara';

  // Compact button only mode
  if (compact && !showPlayer) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={generateAudio}
        disabled={isLoading}
        className={`gap-2 ${className}`}
        data-testid="audio-play-btn"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
        {isLoading ? 'Generating...' : 'Listen'}
      </Button>
    );
  }

  return (
    <div className={`bg-card border rounded-xl overflow-hidden ${className}`} data-testid="audio-player">
      {/* Hidden audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setDuration(audioRef.current.duration);
            }
          }}
        />
      )}

      {/* Player Header */}
      <div className="px-4 py-3 bg-primary/5 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        {showPlayer && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowPlayer(false);
              if (audioRef.current) audioRef.current.pause();
              setIsPlaying(false);
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Player Controls */}
      <div className="p-4">
        {!showPlayer ? (
          <Button
            onClick={generateAudio}
            disabled={isLoading}
            className="w-full btn-primary-pill"
            data-testid="generate-audio-btn"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating audio...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Listen to this content
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <Slider
                value={[progress]}
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                className="w-full"
                data-testid="audio-progress"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => skip(-15)}
                data-testid="rewind-btn"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
              
              <Button
                size="lg"
                onClick={togglePlay}
                className="w-14 h-14 rounded-full"
                disabled={isLoading}
                data-testid="play-pause-btn"
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-1" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => skip(15)}
                data-testid="forward-btn"
              >
                <RotateCw className="w-5 h-5" />
              </Button>
            </div>

            {/* Secondary Controls */}
            <div className="flex items-center justify-between">
              {/* Volume */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  onValueChange={(v) => {
                    setVolume(v[0] / 100);
                    setIsMuted(false);
                  }}
                  max={100}
                  className="w-20"
                />
              </div>

              {/* Speed Control */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    {playbackSpeed}x
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Playback Speed</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {SPEED_OPTIONS.map((speed) => (
                    <DropdownMenuItem
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={playbackSpeed === speed ? 'bg-primary/10' : ''}
                    >
                      {speed}x {speed === 1 && '(Normal)'}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Voice Selection */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Settings className="w-3 h-3" />
                    {selectedVoiceName}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Voice Selection</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {VOICE_OPTIONS.map((voice) => (
                    <DropdownMenuItem
                      key={voice.id}
                      onClick={() => handleVoiceChange(voice.id)}
                      className={selectedVoice === voice.id ? 'bg-primary/10' : ''}
                    >
                      <div>
                        <div className="font-medium">{voice.name}</div>
                        <div className="text-xs text-muted-foreground">{voice.description}</div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Compact inline audio button for chatbot responses
export function AudioButton({ text, className = '' }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const audioRef = useRef(null);

  const handleClick = async () => {
    if (audioUrl) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetchApi('/tts/chatbot', {
        method: 'POST',
        body: JSON.stringify({ text, voice_id: 'dr_amara' })
      });
      setAudioUrl(response.audio_url);
      
      // Auto-play
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }, 100);
    } catch (error) {
      toast.error('Failed to generate audio');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
        />
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        disabled={isLoading}
        className={`h-8 w-8 p-0 rounded-full ${className}`}
        data-testid="audio-btn"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </Button>
    </>
  );
}
