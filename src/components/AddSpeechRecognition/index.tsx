/**
 * 🎤 AddSpeechRecognitionComponent
 *
 * This component provides:
 * - A dialog with a textarea to type or transcribe speech.
 * - Speech recognition (Web Speech API) with microphone input.
 * - Siri-style animated voice waveform visualization (using Canvas + Simplex Noise).
 * - Controls for start, pause, resume, and stop.
 *
 * 🔑 Usage:
 *   import AddSpeechRecognitionComponent from "./AddSpeechRecognitionComponent";
 *   <AddSpeechRecognitionComponent />
 *
 * ⚡ Features:
 * - When active, captures audio input and visualizes it on canvas.
 * - Uses Web Speech API for live speech-to-text transcription.
 * - Provides Mic, Pause, Resume, and Cancel buttons.
 * - Cleans up microphone stream and animation frames when stopped.
 */

import { Mic, MicOff, Pause } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { useEffect, useRef, useState } from "react";
import { createNoise3D } from "simplex-noise";

// Local TS interfaces to strongly type Web Speech API

interface LocalSpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((this: LocalSpeechRecognition, ev: SpeechRecognitionEvent) => unknown) | null;
    onerror: ((this: LocalSpeechRecognition, ev: SpeechRecognitionErrorEvent) => unknown) | null;
}

interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
    readonly error:
    | "no-speech"
    | "aborted"
    | "audio-capture"
    | "network"
    | "not-allowed"
    | "service-not-allowed"
    | "bad-grammar"
    | "language-not-supported";
}

function smoothDataArray(data: Uint8Array, windowSize = 3): Uint8Array {
  const smoothed = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    let sum = 0, count = 0;
    for (let j = -windowSize; j <= windowSize; j++) {
      const idx = i + j;
      if (idx >= 0 && idx < data.length) {
        sum += data[idx];
        count++;
      }
    }
    smoothed[i] = sum / count;
  }
  return smoothed;
}

function AddSpeechRecognitionComponent() {
    // Refs for audio, canvas, and dialog
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream>(null);
    const animationFrameIdRef = useRef<number>(null);
    const dialogContentRef = useRef<HTMLDivElement>(null);

    // State management
    const [isActiveMic, setIsActiveMic] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [transcript, setTranscript] = useState("");

    // Ref for speech recognition instance
    const recognitionRef = useRef<LocalSpeechRecognition | null>(null);


    // Main effect: handles mic, audio visualization, and speech recognition
    useEffect(() => {
        if (isActiveMic) {
            if (!canvasRef.current) {
                console.log("Canvas not found");
                return;
            }

            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");

            if (!ctx) {
                console.error("2D context not available.");
                return;
            }

            canvas.width = (dialogContentRef.current as HTMLDivElement).getBoundingClientRect().width;
            canvas.height = 100;

            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    streamRef.current = stream;

                    console.log("Microphone Accessed")
                    const audioCtx = new AudioContext();
                    const source = audioCtx.createMediaStreamSource(stream);
                    const analyser = audioCtx.createAnalyser();

                    analyser.fftSize = 128;

                    const dataArray = new Uint8Array(analyser.frequencyBinCount);

                    source.connect(analyser);



                    // inside your useEffect where you create `analyser`, `dataArray`, etc.
                    // createNoise3D() is already imported
                    const noise = createNoise3D();
                    let nt = 0;
                    let smoothIntensity = 0; // persists across frames for stable amplification


                    const draw = () => {
                        animationFrameIdRef.current = requestAnimationFrame(draw);
                        analyser.getByteFrequencyData(dataArray);

                        if (!canvasRef.current) return;
                        const ctx = canvasRef.current.getContext("2d");
                        if (!ctx) return;

                        const canvas = canvasRef.current;
                        const w = canvas.width;
                        const h = canvas.height;

                        // clear
                        ctx.clearRect(0, 0, w, h);


                        // time
                        nt += 0.004; // tweak for speed

                        // compute a robust average loudness (RMS) and smooth it ===
                        let sumSq = 0;
                        for (let i = 0; i < dataArray.length; i++) {
                            sumSq += dataArray[i] * dataArray[i];
                        }
                        const rms = Math.sqrt(sumSq / dataArray.length) / 127; // 0..1
                        const smoothing = 0.85; // higher = smoother/laggy; lower = more reactive
                        smoothIntensity = smoothIntensity * smoothing + rms * (1 - smoothing);

                        // baseline strengths
                        const baselineStrength = 8;               // always-visible wiggle
                        const intensityScale = 35;                // how much loudness increases overall wiggle
                        const noiseBase = baselineStrength + smoothIntensity * intensityScale; // px scale

                        // center envelope params (how wide the "Siri" boost is)
                        const centerX = w / 2;
                        const halfWidth = w / 2;
                        const envelopeWidthFactor = 0.35; // smaller => narrower center boost; try 0.25..0.5

                        // waves (stroked)
                        const waves = [
                            { color: "rgba(45,212,191,0.95)", blur: 1, offset: -1, lineWidth: 1 },
                            { color: "rgba(255, 255, 224,0.92)", blur: 1, offset: 0, lineWidth: 1 },
                            { color: "rgba(45,212,191,0.95)", blur: 1, offset: -1, lineWidth: 1 },
                            { color: "rgba(255, 255, 224,0.92)", blur: 1, offset: 0, lineWidth: 1 },
                            { color: "rgba(45,212,191,0.95)", blur: 1, offset: -1, lineWidth: 1 },
                            { color: "rgba(255, 255, 224,0.92)", blur: 1, offset: 0, lineWidth: 1 },
                            { color: "rgba(99,102,241,1)", blur: 1, offset: 1, lineWidth: 1 },
                        ];

                        waves.forEach((wave, i) => {
                            ctx.beginPath();
                            ctx.filter = `blur(${wave.blur}px)`; // Add blur to soften the wave (glow-like effect)
                            ctx.strokeStyle = wave.color;        // Wave stroke color
                            ctx.lineWidth = wave.lineWidth;      // Thickness of the wave line

                            // Optional glowing effect
                            ctx.shadowBlur = Math.min(12, wave.blur);
                            ctx.shadowColor = wave.color;

                            const dataArraySmoothed = smoothDataArray(dataArray, 4);
                            /**
                             * Function to calculate the y-position of the wave
                             * at a given x-coordinate (from center outward).
                             */

                            const plot = (x: number, i: number) => {
                                const relativeX = Math.abs(x - centerX);
                                const dataIndex = Math.floor((relativeX / halfWidth) * dataArraySmoothed.length);
                                // const amplitude = (dataArray[dataIndex] || 0) / 255;
                                const amplitude = (dataArraySmoothed[dataIndex] || 0) / 255;

                                // Gaussian envelope
                                const dx = (x - centerX) / (halfWidth * envelopeWidthFactor);
                                const envelope = Math.exp(-0.5 * dx * dx);
                                const centerGain = 1 + envelope * (smoothIntensity * 0.5);

                                // phase shifts outward from center with distance
                                const phase = nt * 4 - relativeX / 100;
                                // nt*2 => animation speed, relativeX/60 => outward delay

                                const noiseY =
                                    noise(x / 1000, i * 0.6, phase) *
                                    noiseBase *
                                    (0.35 + amplitude * 0.95) *
                                    centerGain;

                                return h * 0.55 + wave.offset + noiseY;
                            };

                            // --- Draw right side of wave (center → right edge) ---
                            ctx.moveTo(centerX, plot(centerX, i));
                            for (let x = centerX; x <= w; x += 4) {
                                ctx.lineTo(x, plot(x, i));
                            }

                            // --- Draw left side of wave (center → left edge) ---
                            ctx.moveTo(centerX, plot(centerX, i));
                            for (let x = centerX; x >= 0; x -= 4) {
                                ctx.lineTo(x, plot(x, i));
                            }

                            // Stroke the path with the chosen style
                            ctx.stroke();
                            ctx.closePath();

                            // --- Draw fade-out overlay ---
                            const gradient = ctx.createLinearGradient(0, 0, w, 0);

                            // transparent on edges, opaque in middle
                            gradient.addColorStop(0, "rgba(255,255,255,0)");
                            gradient.addColorStop(0.1, "rgba(255,255,255,0.8)");
                            gradient.addColorStop(0.5, "rgba(255,255,255,1)");
                            gradient.addColorStop(0.9, "rgba(255,255,255,0.8)");
                            gradient.addColorStop(1, "rgba(255,255,255,0)");

                            ctx.globalCompositeOperation = "destination-in"; // keep only where gradient is
                            ctx.fillStyle = gradient;
                            ctx.fillRect(0, 0, w, h);
                            ctx.globalCompositeOperation = "source-over"; // reset for next frame


                            // Reset glow/blur for next wave
                            ctx.shadowBlur = 0;
                            ctx.filter = "none";
                        });

                    };

                    // --- Speech Recognition setup ---
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                    if (SpeechRecognition) {
                        const recognition = new SpeechRecognition();
                        recognition.lang = "en-US";          // or "hi-IN", "bn-IN" etc.
                        recognition.continuous = true;
                        recognition.interimResults = true;

                        recognition.onresult = (event: SpeechRecognitionEvent) => {
                            let text = "";
                            for (let i = event.resultIndex; i < event.results.length; i++) {
                                text += event.results[i][0].transcript;
                            }
                            setTranscript(text.trim());
                        };

                        recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
                            console.error("SpeechRecognition error:", e);
                        };

                        recognitionRef.current = recognition;
                        recognition.start();
                    }

                    // start the loop
                    draw();

                })
                .catch(err => console.error("mic Error", err));
        }
    }, [isActiveMic])

    const stopAudioContent = () => {
        setIsActiveMic(false);
        setIsPaused(false)
        console.log("Mic stop");

        if (streamRef.current) {
            (streamRef.current as MediaStream).getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }

        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setTranscript("");
    };

    const toggleMic = () => {
        if (!streamRef.current) return;

        const tracks = streamRef.current.getTracks();
        if (isPaused) {
            // Resume mic
            console.log("Mic Resume");

            tracks.forEach(track => (track.enabled = true));
            recognitionRef.current?.start();
            setIsPaused(false);
        } else {
            // Pause mic
            console.log("Mic Pause");

            tracks.forEach(track => (track.enabled = false));
            recognitionRef.current?.stop();
            setIsPaused(true);
        }
    };

    const handleAudioContent = () => {
        setIsActiveMic(true);
        setIsPaused(false);
    }
    return (
        <Dialog>
            <DialogTrigger className="w-full" asChild>
                <span>Ask to add</span>
            </DialogTrigger>
            <DialogContent ref={dialogContentRef}>
                <DialogHeader>
                    <DialogTitle>Describe your thought</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3">
                    <Textarea placeholder="enter your text" className="mix-h-20" value={transcript} onChange={(e) => setTranscript(e.target.value)} />
                </div>
                {isActiveMic && 
                <div className="min-h-[200px]">
                    <canvas className="w-full rounded-2xl min-h-[200px]" ref={canvasRef}></canvas>
                </div>
                }
                <DialogFooter>
                    {!isActiveMic && !isPaused && <Button variant="outline" onClick={handleAudioContent}><Mic /></Button>}
                    {isActiveMic && isPaused && <Button variant="outline" onClick={toggleMic}><MicOff /></Button>}
                    {isActiveMic && !isPaused && <Button variant="outline" onClick={toggleMic}><Pause /></Button>}
                    <DialogClose asChild>
                        <Button variant="outline" onClick={stopAudioContent}>Cancel</Button>
                    </DialogClose>
                    <Button type="submit">Ask AI</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default AddSpeechRecognitionComponent;