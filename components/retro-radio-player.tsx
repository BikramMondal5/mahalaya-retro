"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { useOrientation } from "@/hooks/use-orientation"

interface Song {
  id: number
  title: string
  artist: string
  duration: string
  src: string
}

const mahalayaSongs: Song[] = [
  { id: 1, title: "Ya Chandi", artist: "Pankaj Mullick", duration: "4:32", src: "/audio/Ya-chandi.mpeg" },
  { id: 2, title: "Mahishasura Mardini", artist: "Adi Shankaracharya", duration: "6:15", src: "/audio/Mahisasuramardini.mpeg" },
  { id: 3, title: "Namo Chandi", artist: "Bimal Bhushan", duration: "8:45", src: "/audio/Namo%20Chandi.mpeg" },
  { id: 4, title: "Jago Durga", artist: "Dwijen Mukherjee", duration: "5:20", src: "/audio/Jago-Durga.mpeg" },
  { id: 5, title: "Tabo Achintya", artist: "Manabendra Mukherjee", duration: "7:30", src: "/audio/Tabo%20Achintya.mpeg" },
  { id: 6, title: "Bimane Bimane", artist: "Sandhya Mukherjee", duration: "3:45", src: "/audio/Bimane%20Bimane.mpeg" },
  { id: 7, title: "Bajlo Tomar", artist: "Supriti Ghosh", duration: "6:40", src: "/audio/Bajlo-tomai.mpeg" },
  { id: 8, title: "Ma Go Taba Beene", artist: "Sumitra Sen", duration: "5:55", src: "/audio/Ma%20Go%20Taba%20Beene.mpeg" },
  { id: 9, title: "Akhila Bimane Taba Jaya Gane", artist: "Devotional", duration: "7:15", src: "/audio/AkhilaBimane%20Taba%20JayaGane.mpeg" },
  { id: 10, title: "Simhastha Sashisekhara", artist: "Devotional", duration: "4:50", src: "/audio/Simhastha%20Sashisekhara.mpeg" },
  { id: 11, title: "Aham Rudrebhirvasubhischara", artist: "Krishna Dasgupta", duration: "5:10", src: "/audio/Aham%20Rudrebhirvasubhischara.mpeg" },
  { id: 12, title: "Jatajauta Samayuktam", artist: "Priyankaa Bhattacharya and Shekharr Srivastav", duration: "6:05", src: "/audio/JatajutasamayuktamardhendukritaSekharam.mpeg" },
]

export function RetroRadioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSong, setCurrentSong] = useState(0)
  const [volume, setVolume] = useState([75])
  const [tuning, setTuning] = useState([50])
  const [knobRotation, setKnobRotation] = useState(0)
  const [tuningKnobRotation, setTuningKnobRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartAngle, setDragStartAngle] = useState(0)
  const [dragStartRotation, setDragStartRotation] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [secondsDisplay, setSecondsDisplay] = useState("00")
  const [isFavorite, setIsFavorite] = useState(false)
  const [isShuffled, setIsShuffled] = useState(false)
  const [repeatMode, setRepeatMode] = useState(0) // 0: off, 1: all, 2: one
  const [screenHeight, setScreenHeight] = useState(0)
  const [screenWidth, setScreenWidth] = useState(0)
  const [isLandscape, setIsLandscape] = useState(false)
  const [visualizerBars, setVisualizerBars] = useState<number[]>([])
  const orientation = useOrientation()

  const volumeKnobRef = useRef<HTMLDivElement>(null)
  const tuningKnobRef = useRef<HTMLDivElement>(null)
  const radioPlayerRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Use effect to update screen dimensions and orientation
  useEffect(() => {
    if (typeof window !== "undefined") {
      const updateDimensions = () => {
        setScreenWidth(window.innerWidth)
        setScreenHeight(window.innerHeight)
        setIsLandscape(window.matchMedia("(orientation: landscape)").matches)
      }
      
      // Initialize visualizer bars with consistent pattern resembling the reference image
      const initialBars = Array.from({ length: 60 }, (_, i) => {
        // Group bars in sections of 3 for a more natural audio visualizer look
        const section = Math.floor(i / 3); 
        const baseHeight = 15 + (Math.sin(section * 0.8) * 15);
        const variance = Math.sin(i * 3.7) * 5;
        return Math.floor(baseHeight + variance);
      });
      setVisualizerBars(initialBars)
      
      window.addEventListener('resize', updateDimensions)
      updateDimensions()
      
      return () => {
        window.removeEventListener('resize', updateDimensions)
      }
    }
  }, [])  // Update isLandscape when orientation changes
  useEffect(() => {
    if (orientation) {
      setIsLandscape(orientation === 'landscape')
    }
  }, [orientation])

  useEffect(() => {
    setKnobRotation(volume[0] * 2.7) // 270 degrees max rotation
    
    // Update audio volume
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
    }
  }, [volume])
  
  // Update seconds display on client-side only
  // Initialize audio
  useEffect(() => {
    if (audioRef.current) {
      // Set the initial src
      audioRef.current.src = mahalayaSongs[currentSong].src;
      audioRef.current.volume = volume[0] / 100;
      
      // Add event listeners
      const handleTimeUpdate = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
          // Update the seconds display with milliseconds
          setSecondsDisplay(Math.floor((audioRef.current.currentTime % 1) * 100).toString().padStart(2, '0'));
        }
      };
      
      const handleDurationChange = () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration);
        }
      };
      
      const handleEnded = () => {
        if (repeatMode === 2) { // repeat one
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
          }
        } else if (repeatMode === 1 || currentSong < mahalayaSongs.length - 1) { // repeat all or has next song
          nextSong();
        } else {
          setIsPlaying(false);
        }
      };
      
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('durationchange', handleDurationChange);
      audioRef.current.addEventListener('ended', handleEnded);
      
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
          audioRef.current.removeEventListener('durationchange', handleDurationChange);
          audioRef.current.removeEventListener('ended', handleEnded);
        }
      };
    }
  }, [currentSong, repeatMode]);
  
  useEffect(() => {
    // Animate the visualizer bars to match the reference image style
    if (typeof window !== 'undefined') {
      const animationTimer = setInterval(() => {
        setVisualizerBars(prev => {
          return Array.from({ length: 60 }, (_, i) => {
            // Create more varied heights with some randomness but maintaining consistency within groups
            const section = Math.floor(i / 3); // Group bars in sections of 3
            const baseHeight = 15 + (Math.sin(section * 0.8 + (Date.now() / 1000)) * 15);
            const variance = Math.sin(i * 3.7 + (Date.now() / 800)) * 5;
            return Math.floor(baseHeight + variance);
          });
        });
      }, 100);
      
      return () => clearInterval(animationTimer);
    }
  }, [])

  useEffect(() => {
    const newTuning = Math.max(0, Math.min(100, (tuningKnobRotation / 360) * 100))
    if (Math.abs(newTuning - tuning[0]) > 1) {
      setTuning([newTuning])
    }
  }, [tuningKnobRotation, tuning])

  useEffect(() => {
    // Calculate the index of the song based on the tuning position
    // With more songs, we need to ensure they're evenly distributed across the tuning range
    const songCount = mahalayaSongs.length;
    
    // Create a more precise mapping of tuning value to song index
    // This creates small "station zones" on the tuning dial for each song
    const stationIndex = Math.floor((tuning[0] / 100) * songCount);
    const clampedIndex = Math.min(stationIndex, songCount - 1);
    
    if (clampedIndex !== currentSong) {
      setCurrentSong(clampedIndex);
      
      // Update audio source when tuning changes
      if (audioRef.current) {
        audioRef.current.src = mahalayaSongs[clampedIndex].src;
        
        // Always play when tuning changes if the radio is on,
        // or if in landscape mode and dragging while the radio is on
        if (isPlaying || (isLandscape && isDragging)) {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error("Error playing audio after tuning:", error);
            });
          }
          
          // Update the playing state if needed
          if (!isPlaying) {
            setIsPlaying(true);
          }
        }
      }
    }
  }, [tuning, currentSong, isLandscape, isDragging, isPlaying])

  const getAngleFromCenter = useCallback((clientX: number, clientY: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI)
    return angle + 90 // Adjust so 0 degrees is at the top
  }, [])

  // Define togglePlay function first
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        // Turn off - pause audio
        audioRef.current.pause();
      } else {
        // Turn on - ensure audio source is set before playing
        if (!audioRef.current.src || audioRef.current.src.endsWith('/')) {
          audioRef.current.src = mahalayaSongs[currentSong].src;
        }
        
        audioRef.current.play().catch(error => {
          console.error("Error playing audio:", error);
          // Handle autoplay policy restrictions gracefully
        });
      }
      setIsPlaying(!isPlaying);
    }
  }

  const handleTuningMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!tuningKnobRef.current) return
      
      // This flag is to differentiate between a click and a drag
      let isDragInitiated = false;
      
      setIsDragging(true)
      const startAngle = getAngleFromCenter(e.clientX, e.clientY, tuningKnobRef.current)
      setDragStartAngle(startAngle)
      setDragStartRotation(tuningKnobRotation)
      
      // In landscape mode, set up listeners to detect if this becomes a drag
      if (isLandscape) {
        const handleMouseMove = () => {
          isDragInitiated = true;
          document.removeEventListener("mousemove", handleMouseMove);
        };
        
        const handleMouseUp = () => {
          // If no drag occurred, don't do anything (the click event will handle the toggle)
          // If drag occurred, we need to prevent the click event
          if (isDragInitiated && e.target instanceof HTMLElement) {
            e.target.onclick = (e) => {
              e.stopPropagation();
              setTimeout(() => {
                if (e.target instanceof HTMLElement) {
                  e.target.onclick = null;
                }
              }, 100);
            };
          }
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
        };
        
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      }
    },
    [tuningKnobRotation, getAngleFromCenter, isLandscape],
  )

  const handleTuningTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!tuningKnobRef.current) return
      e.preventDefault() // Prevent default to avoid scrolling while dragging
      
      // This flag is to differentiate between a tap and a drag
      let isDragInitiated = false;
      
      setIsDragging(true)
      const touch = e.touches[0]
      const startAngle = getAngleFromCenter(touch.clientX, touch.clientY, tuningKnobRef.current)
      setDragStartAngle(startAngle)
      setDragStartRotation(tuningKnobRotation)
      
      // In landscape mode, set up listeners to detect if this becomes a drag
      if (isLandscape) {
        const handleTouchMove = () => {
          isDragInitiated = true;
          document.removeEventListener("touchmove", handleTouchMove);
        };
        
        const handleTouchEnd = () => {
          // If no drag occurred, manually toggle play
          if (!isDragInitiated && isLandscape) {
            // We can't reference togglePlay directly in the callback's dependency array,
            // so we'll use the state values directly
            if (audioRef.current) {
              if (isPlaying) {
                audioRef.current.pause();
              } else {
                if (!audioRef.current.src || audioRef.current.src.endsWith('/')) {
                  audioRef.current.src = mahalayaSongs[currentSong].src;
                }
                audioRef.current.play().catch(err => console.error(err));
              }
              setIsPlaying(!isPlaying);
            }
          }
          document.removeEventListener("touchmove", handleTouchMove);
          document.removeEventListener("touchend", handleTouchEnd);
        };
        
        document.addEventListener("touchmove", handleTouchMove);
        document.addEventListener("touchend", handleTouchEnd);
      }
    },
    [tuningKnobRotation, getAngleFromCenter, isLandscape, currentSong, isPlaying],
  )

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !tuningKnobRef.current) return
      const currentAngle = getAngleFromCenter(e.clientX, e.clientY, tuningKnobRef.current)
      let angleDiff = currentAngle - dragStartAngle

      // Handle angle wrap-around
      if (angleDiff > 180) angleDiff -= 360
      if (angleDiff < -180) angleDiff += 360

      const newRotation = (dragStartRotation + angleDiff + 360) % 360
      setTuningKnobRotation(newRotation)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !tuningKnobRef.current) return
      e.preventDefault() // Prevent scrolling during touch interactions
      const touch = e.touches[0]
      const currentAngle = getAngleFromCenter(touch.clientX, touch.clientY, tuningKnobRef.current)
      let angleDiff = currentAngle - dragStartAngle

      // Handle angle wrap-around
      if (angleDiff > 180) angleDiff -= 360
      if (angleDiff < -180) angleDiff += 360

      // Apply some sensitivity adjustment for touch screens
      const sensitivity = isLandscape ? 1.2 : 1
      const newRotation = (dragStartRotation + (angleDiff * sensitivity) + 360) % 360
      setTuningKnobRotation(newRotation)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("touchmove", handleTouchMove)
      document.addEventListener("touchend", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleMouseUp)
    }
  }, [isDragging, dragStartAngle, dragStartRotation, getAngleFromCenter])

  const nextSong = () => {
    const nextIndex = (currentSong + 1) % mahalayaSongs.length;
    setCurrentSong(nextIndex);
    
    // Calculate tuning position based on the song index
    // With 12 songs, each song occupies about 8.33% of the tuning range
    const newTuningValue = mahalayaSongs.length > 1 ? 
      (nextIndex / (mahalayaSongs.length - 1)) * 100 : 50;
    
    // Update tuning UI
    setTuning([newTuningValue]);
    setTuningKnobRotation((newTuningValue / 100) * 360);
    
    // Always play the next song when user explicitly changes songs, regardless of previous state
    if (audioRef.current) {
      audioRef.current.src = mahalayaSongs[nextIndex].src;
      // Force play the next song
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Error playing next song:", error);
        });
      }
      
      // Always set playing state to true when changing songs
      setIsPlaying(true);
    }
  }

  const prevSong = () => {
    const prevIndex = (currentSong - 1 + mahalayaSongs.length) % mahalayaSongs.length;
    setCurrentSong(prevIndex);
    
    // Calculate tuning position based on the song index
    // With 12 songs, each song occupies about 8.33% of the tuning range
    const newTuningValue = mahalayaSongs.length > 1 ? 
      (prevIndex / (mahalayaSongs.length - 1)) * 100 : 50;
    
    // Update tuning UI
    setTuning([newTuningValue]);
    setTuningKnobRotation((newTuningValue / 100) * 360);
    
    // Always play the previous song when user explicitly changes songs, regardless of previous state
    if (audioRef.current) {
      audioRef.current.src = mahalayaSongs[prevIndex].src;
      // Force play the previous song
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Error playing previous song:", error);
        });
      }
      
      // Always set playing state to true when changing songs
      setIsPlaying(true);
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const parseDuration = (duration: string) => {
    const [mins, secs] = duration.split(":").map(Number)
    return mins * 60 + secs
  }

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center" ref={radioPlayerRef}>
      <audio ref={audioRef} preload="metadata" />
      <div className="portrait:block landscape:hidden w-full max-w-md mx-auto">
        <div className="h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex flex-col items-center justify-evenly relative overflow-hidden safe-area-inset-bottom">
          {/* Top Section - Song Info */}
          <div className="flex-shrink-0 pt-8 pb-8 px-6">
            <div className="text-center">
              <h1 className="text-xl font-semibold mb-1 px-4 leading-tight tracking-wide text-secondary">
                {mahalayaSongs[currentSong].title}
              </h1>
              <p className="text-gray-400 text-base font-medium">{mahalayaSongs[currentSong].artist}</p>
            </div>
          </div>

          {/* Center Section - Album Art */}
          <div className="flex-shrink-0 flex items-center justify-center px-8 w-full my-4">
            <div className="relative mx-auto">
              <div className="w-72 h-72 rounded-full overflow-hidden shadow-2xl border-4 border-gray-700/50 backdrop-blur-sm">
                <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center relative">
                  {/* Modern vinyl record effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-700/20 via-transparent to-gray-900/40 rounded-full"></div>
                  <div className="absolute inset-8 bg-gradient-to-br from-gray-800/30 to-black/50 rounded-full border border-gray-700/30"></div>
                  <div className="absolute inset-16 bg-gradient-to-br from-gray-900/50 to-black/70 rounded-full border border-gray-600/20"></div>

                  {/* Center with orange inner circle */}
                  <div className="absolute w-36 h-36 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-inner border-2 border-orange-400/30 z-10">
                    <div className="w-24 h-24 bg-gradient-radial from-orange-400 to-orange-700 rounded-full shadow-inner"></div>
                  </div>

                  {/* Modern glass effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Audio Waveform Visualization */}
          <div className="flex-shrink-0 px-6 mb-8">
            <div className="flex items-end justify-center gap-[2px] h-16 bg-black/70 rounded-md p-2">
              {visualizerBars.map((height, i) => {
                // Calculate a height between 5-30px from our visualizer values for a cleaner look
                const barHeight = (height / 30) * 25 + 5;
                const isActive = i < (currentTime / parseDuration(mahalayaSongs[currentSong].duration)) * 60
                return (
                  <div
                    key={i}
                    className={`w-[3px] ${
                      isActive ? "bg-emerald-400" : "bg-gray-600"
                    }`}
                    style={{ height: `${barHeight}px` }}
                  />
                )
              })}
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex-shrink-0 px-8 mb-8 w-full">
            <div className="flex items-center justify-center gap-8 mx-auto">
              <button
                onClick={prevSong}
                className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-full transition-all duration-200"
              >
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>

              <button
                onClick={togglePlay}
                className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-200 border border-emerald-400/30"
              >
                {isPlaying ? (
                  <div className="flex gap-2">
                    <div className="w-2.5 h-10 bg-white rounded-full"></div>
                    <div className="w-2.5 h-10 bg-white rounded-full"></div>
                  </div>
                ) : (
                  <svg className="w-10 h-10 text-white ml-1.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button
                onClick={nextSong}
                className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-full transition-all duration-200"
              >
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6l8.5 6-8.5 6V6m9 12h2V6h-2v12z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="portrait:hidden landscape:block w-full h-screen flex items-center justify-center">
        <Card className="mx-auto bg-gradient-to-br from-gray-900 via-black to-gray-900 border-gray-700 rounded-3xl relative overflow-hidden shadow-2xl shadow-black/80 h-[90vh] max-h-[450px] w-[95%] max-w-5xl flex flex-col">
          {/* Brand Label - Top Right */}
          <div className="absolute top-3 sm:top-4 right-4 sm:right-8 text-white"></div>

          <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 border-b border-gray-700 p-2 landscape:p-1 sm:p-3 md:p-4 shadow-inner shadow-black/60 drop-shadow-xl flex-1 rounded-t-3xl">
            <div className="w-full h-full">
              {/* Frequency Display - Full Width */}
              <div className="bg-gradient-to-b from-gray-800 via-gray-900 to-black rounded-lg p-3 landscape:p-2 sm:p-4 md:p-6 border-2 border-emerald-500/30 relative shadow-inner shadow-black/80 drop-shadow-2xl h-full flex flex-col justify-center backdrop-blur-sm overflow-y-auto">
                {/* Frequency Scale */}
                <div className="relative h-16 landscape:h-14 sm:h-20 md:h-24 mb-3 landscape:mb-2 sm:mb-4 md:mb-6">
                  {/* Frequency Numbers */}
                  <div className="absolute top-0 left-0 right-0 flex justify-between text-emerald-400 text-[10px] landscape:text-[9px] sm:text-xs md:text-sm font-mono tracking-wider">
                    {[88, 90, 92, 94, 96, 98, 100, 102, 104, 106, 108].map((freq) => (
                      <span key={freq} className="text-shadow">
                        {freq}
                      </span>
                    ))}
                  </div>

                  {/* Scale Lines */}
                  <div className="absolute top-4 landscape:top-3 sm:top-5 md:top-6 left-0 right-0 flex justify-between">
                    {Array.from({ length: 41 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-px bg-gray-500 ${i % 4 === 0 ? "h-6 landscape:h-5 sm:h-7 md:h-8 bg-emerald-400/70" : "h-3 landscape:h-2.5 sm:h-3.5 md:h-4"} shadow-sm`}
                      />
                    ))}
                  </div>

                  {/* Red Tuning Indicator */}
                  <div
                    className="absolute top-4 landscape:top-3 w-1 landscape:w-0.5 sm:w-1.5 h-12 landscape:h-10 sm:h-16 md:h-20 bg-gradient-to-b from-red-400 to-red-600 rounded-full shadow-lg drop-shadow-lg transition-all duration-300 z-50 border border-red-300/50"
                    style={{ left: `${tuning[0]}%`, transform: "translateX(-50%)" }}
                  />

                  {/* Second row of frequency numbers */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between text-emerald-400 text-[10px] landscape:text-[9px] sm:text-xs md:text-sm font-mono tracking-wider">
                    {isLandscape && screenWidth < 640 ? 
                      [530, 700, 900, 1100, 1300, 1600].map((freq) => (
                        <span key={freq} className="text-shadow">
                          {freq}
                        </span>
                      )) :
                      [530, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1600].map((freq) => (
                        <span key={freq} className="text-shadow">
                          {freq}
                        </span>
                      ))
                    }
                  </div>
                </div>

                {/* Current Station Display */}
                <div className="text-center mb-3 landscape:mb-2 sm:mb-6 md:mb-8">
                  <div className="text-xl landscape:text-lg sm:text-2xl md:text-3xl font-mono mb-1 landscape:mb-0.5 sm:mb-2 tracking-wider text-shadow-lg text-secondary truncate px-2">
                    {mahalayaSongs[currentSong].title}
                  </div>
                  <div className="text-gray-300 text-base landscape:text-sm sm:text-lg md:text-xl tracking-wide truncate px-2">
                    {mahalayaSongs[currentSong].artist}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Control Buttons Section */}
          <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 p-3 landscape:py-1.5 landscape:px-2 sm:p-4 md:p-6 border-t border-gray-700 shadow-inner shadow-black/40 rounded-b-3xl">
            <div className="flex justify-between items-center">
              {/* Left Side - 5 Control Buttons */}
              <div className="flex gap-2 landscape:gap-1 sm:gap-3 md:gap-6">
                <button 
                  className={`relative inline-block w-14 landscape:w-12 h-12 landscape:h-10 sm:w-16 sm:h-14 md:w-20 md:h-16 rounded-lg ${isPlaying ? "bg-gradient-to-b from-emerald-600 to-emerald-800" : "bg-gradient-to-b from-gray-600 to-gray-800"} shadow-[inset_-8px_0_8px_rgba(0,0,0,0.15),inset_0_-8px_8px_rgba(0,0,0,0.25),0_0_0_2px_rgba(0,0,0,0.75),10px_20px_25px_rgba(0,0,0,0.4)] overflow-hidden transition-all duration-100 ease-in-out select-none hover:shadow-[inset_-4px_0_4px_rgba(0,0,0,0.1),inset_0_-4px_4px_rgba(0,0,0,0.15),0_0_0_2px_rgba(0,0,0,0.5),5px_10px_15px_rgba(0,0,0,0.3)] active:translate-y-0.5 active:shadow-[inset_-4px_0_4px_rgba(0,0,0,0.1),inset_0_-4px_4px_rgba(0,0,0,0.15),0_0_0_2px_rgba(0,0,0,0.5),5px_10px_15px_rgba(0,0,0,0.3)] before:content-[''] before:absolute before:top-1 before:left-1 before:bottom-3.5 before:right-3 before:bg-gradient-to-r before:from-gray-700 before:to-gray-500 before:rounded-lg before:shadow-[-10px_-10px_10px_rgba(255,255,255,0.25),10px_5px_10px_rgba(0,0,0,0.15)] before:border-l before:border-l-black/25 before:border-b before:border-b-black/25 before:border-t before:border-t-black/60 before:transition-all before:duration-100 before:ease-in-out active:before:top-1.5 active:before:left-1.5 active:before:bottom-3 active:before:right-3 before:shadow-[-5px_-5px_5px_rgba(255,255,255,0.15),5px_3px_5px_rgba(0,0,0,0.1)]`}
                  onClick={togglePlay}
                >
                  <span className={`absolute left-3 landscape:left-2.5 top-3 landscape:top-2 ${isPlaying ? "text-white" : "text-gray-200"} text-xs landscape:text-[10px] sm:text-sm font-bold transition-transform duration-100 ease-in-out active:translate-y-0.5 z-10`}>
                    ON
                  </span>
                </button>

                <button className="relative inline-block w-14 landscape:w-12 h-12 landscape:h-10 sm:w-16 sm:h-14 md:w-20 md:h-16 rounded-lg bg-gradient-to-b from-gray-600 to-gray-800 shadow-[inset_-8px_0_8px_rgba(0,0,0,0.15),inset_0_-8px_8px_rgba(0,0,0,0.25),0_0_0_2px_rgba(0,0,0,0.75),10px_20px_25px_rgba(0,0,0,0.4)] overflow-hidden transition-all duration-100 ease-in-out select-none hover:shadow-[inset_-4px_0_4px_rgba(0,0,0,0.1),inset_0_-4px_4px_rgba(0,0,0,0.15),0_0_0_2px_rgba(0,0,0,0.5),5px_10px_15px_rgba(0,0,0,0.3)] active:translate-y-0.5 active:shadow-[inset_-4px_0_4px_rgba(0,0,0,0.1),inset_0_-4px_4px_rgba(0,0,0,0.15),0_0_0_2px_rgba(0,0,0,0.5),5px_10px_15px_rgba(0,0,0,0.3)] before:content-[''] before:absolute before:top-1 before:left-1 before:bottom-3.5 before:right-3 before:bg-gradient-to-r before:from-gray-700 before:to-gray-500 before:rounded-lg before:shadow-[-10px_-10px_10px_rgba(255,255,255,0.25),10px_5px_10px_rgba(0,0,0,0.15)] before:border-l before:border-l-black/25 before:border-b before:border-b-black/25 before:border-t before:border-t-black/60 before:transition-all before:duration-100 before:ease-in-out active:before:top-1.5 active:before:left-1.5 active:before:bottom-3 active:before:right-3 active:before:shadow-[-5px_-5px_5px_rgba(255,255,255,0.15),5px_3px_5px_rgba(0,0,0,0.1)]">
                  <span className="absolute left-3 landscape:left-2 top-3 landscape:top-2 text-gray-200 text-xs landscape:text-[10px] sm:text-sm font-bold transition-transform duration-100 ease-in-out active:translate-y-0.5 z-10">
                    VOL
                  </span>
                </button>

                <button className="relative inline-block w-14 landscape:w-12 h-12 landscape:h-10 sm:w-16 sm:h-14 md:w-20 md:h-16 rounded-lg bg-gradient-to-b from-gray-600 to-gray-800 shadow-[inset_-8px_0_8px_rgba(0,0,0,0.15),inset_0_-8px_8px_rgba(0,0,0,0.25),0_0_0_2px_rgba(0,0,0,0.75),10px_20px_25px_rgba(0,0,0,0.4)] overflow-hidden transition-all duration-100 ease-in-out select-none hover:shadow-[inset_-4px_0_4px_rgba(0,0,0,0.1),inset_0_-4px_4px_rgba(0,0,0,0.15),0_0_0_2px_rgba(0,0,0,0.5),5px_10px_15px_rgba(0,0,0,0.3)] active:translate-y-0.5 active:shadow-[inset_-4px_0_4px_rgba(0,0,0,0.1),inset_0_-4px_4px_rgba(0,0,0,0.15),0_0_0_2px_rgba(0,0,0,0.5),5px_10px_15px_rgba(0,0,0,0.3)] before:content-[''] before:absolute before:top-1 before:left-1 before:bottom-3.5 before:right-3 before:bg-gradient-to-r before:from-gray-700 before:to-gray-500 before:rounded-lg before:shadow-[-10px_-10px_10px_rgba(255,255,255,0.25),10px_5px_10px_rgba(0,0,0,0.15)] before:border-l before:border-l-black/25 before:border-b before:border-b-black/25 before:border-t before:border-t-black/60 before:transition-all before:duration-100 before:ease-in-out active:before:top-1.5 active:before:left-1.5 active:before:bottom-3 active:before:right-3 active:before:shadow-[-5px_-5px_5px_rgba(255,255,255,0.15),5px_3px_5px_rgba(0,0,0,0.1)]">
                  <span className="absolute left-3 landscape:left-2 top-3 landscape:top-2 text-gray-200 text-xs landscape:text-[10px] sm:text-sm font-bold transition-transform duration-100 ease-in-out active:translate-y-0.5 z-10">
                    TONE
                  </span>
                </button>

                <button className="relative inline-block w-14 landscape:w-12 h-12 landscape:h-10 sm:w-16 sm:h-14 md:w-20 md:h-16 rounded-lg bg-gradient-to-b from-gray-600 to-gray-800 shadow-[inset_-8px_0_8px_rgba(0,0,0,0.15),inset_0_-8px_8px_rgba(0,0,0,0.25),0_0_0_2px_rgba(0,0,0,0.75),10px_20px_25px_rgba(0,0,0,0.4)] overflow-hidden transition-all duration-100 ease-in-out select-none hover:shadow-[inset_-4px_0_4px_rgba(0,0,0,0.1),inset_0_-4px_4px_rgba(0,0,0,0.15),0_0_0_2px_rgba(0,0,0,0.5),5px_10px_15px_rgba(0,0,0,0.3)] active:translate-y-0.5 active:shadow-[inset_-4px_0_4px_rgba(0,0,0,0.1),inset_0_-4px_4px_rgba(0,0,0,0.15),0_0_0_2px_rgba(0,0,0,0.5),5px_10px_15px_rgba(0,0,0,0.3)] before:content-[''] before:absolute before:top-1 before:left-1 before:bottom-3.5 before:right-3 before:bg-gradient-to-r before:from-gray-700 before:to-gray-500 before:rounded-lg before:shadow-[-10px_-10px_10px_rgba(255,255,255,0.25),10px_5px_10px_rgba(0,0,0,0.15)] before:border-l before:border-l-black/25 before:border-b before:border-b-black/25 before:border-t before:border-t-black/60 before:transition-all before:duration-100 before:ease-in-out active:before:top-1.5 active:before:left-1.5 active:before:bottom-3 active:before:right-3 active:before:shadow-[-5px_-5px_5px_rgba(255,255,255,0.15),5px_3px_5px_rgba(0,0,0,0.1)]">
                  <span className="absolute left-3 landscape:left-2 top-3 landscape:top-2 text-gray-200 text-xs landscape:text-[10px] sm:text-sm font-bold transition-transform duration-100 ease-in-out active:translate-y-0.5 z-10">
                    BAND
                  </span>
                </button>

                <button className="relative inline-block w-14 landscape:w-12 h-12 landscape:h-10 sm:w-16 sm:h-14 md:w-20 md:h-16 rounded-lg bg-gradient-to-b from-gray-600 to-gray-800 shadow-[inset_-8px_0_8px_rgba(0,0,0,0.15),inset_0_-8px_8px_rgba(0,0,0,0.25),0_0_0_2px_rgba(0,0,0,0.75),10px_20px_25px_rgba(0,0,0,0.4)] overflow-hidden transition-all duration-100 ease-in-out select-none hover:shadow-[inset_-4px_0_4px_rgba(0,0,0,0.1),inset_0_-4px_4px_rgba(0,0,0,0.15),0_0_0_2px_rgba(0,0,0,0.5),5px_10px_15px_rgba(0,0,0,0.3)] active:translate-y-0.5 active:shadow-[inset_-4px_0_4px_rgba(0,0,0,0.1),inset_0_-4px_4px_rgba(0,0,0,0.15),0_0_0_2px_rgba(0,0,0,0.5),5px_10px_15px_rgba(0,0,0,0.3)] before:content-[''] before:absolute before:top-1 before:left-1 before:bottom-3.5 before:right-3 before:bg-gradient-to-r before:from-gray-700 before:to-gray-500 before:rounded-lg before:shadow-[-10px_-10px_10px_rgba(255,255,255,0.25),10px_5px_10px_rgba(0,0,0,0.15)] before:border-l before:border-l-black/25 before:border-b before:border-b-black/25 before:border-t before:border-t-black/60 before:transition-all before:duration-100 before:ease-in-out active:before:top-1.5 active:before:left-1.5 active:before:bottom-3 active:before:right-3 active:before:shadow-[-5px_-5px_5px_rgba(255,255,255,0.15),5px_3px_5px_rgba(0,0,0,0.1)]">
                  <span className="absolute left-3 landscape:left-2 top-3 landscape:top-2 text-gray-200 text-xs landscape:text-[10px] sm:text-sm font-bold transition-transform duration-100 ease-in-out active:translate-y-0.5 z-10">
                    MODE
                  </span>
                </button>
              </div>

              {/* Right Side - Tuning Knob */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div
                    ref={tuningKnobRef}
                    className="relative inline-block w-20 landscape:w-16 h-20 landscape:h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-b from-gray-600 to-gray-800 shadow-[inset_-8px_0_8px_rgba(0,0,0,0.15),inset_0_-8px_8px_rgba(0,0,0,0.25),0_0_0_2px_rgba(0,0,0,0.75),10px_20px_25px_rgba(0,0,0,0.4)] overflow-hidden transition-all duration-100 ease-in-out select-none cursor-pointer hover:shadow-[inset_-4px_0_4px_rgba(0,0,0,0.1),inset_0_-4px_4px_rgba(0,0,0,0.15),0_0_0_2px_rgba(0,0,0,0.5),5px_10px_15px_rgba(0,0,0,0.3)] active:translate-y-0.5 active:shadow-[inset_-4px_0_4px_rgba(0,0,0,0.1),inset_0_-4px_4px_rgba(0,0,0,0.15),0_0_0_2px_rgba(0,0,0,0.5),5px_10px_15px_rgba(0,0,0,0.3)] before:content-[''] before:absolute before:top-1 before:left-1 before:bottom-3.5 before:right-3 before:bg-gradient-to-r before:from-gray-700 before:to-gray-500 before:rounded-full before:shadow-[-10px_-10px_10px_rgba(255,255,255,0.25),10px_5px_10px_rgba(0,0,0,0.15)] before:border-l before:border-l-black/25 before:border-b before:border-b-black/25 before:border-t before:border-t-black/60 before:transition-all before:duration-100 before:ease-in-out active:before:top-1.5 active:before:left-1.5 active:before:bottom-3 active:before:right-3 active:before:shadow-[-5px_-5px_5px_rgba(255,255,255,0.15),5px_3px_5px_rgba(0,0,0,0.1)]"
                    style={{ transform: `rotate(${tuningKnobRotation}deg)` }}
                    onClick={isLandscape ? togglePlay : undefined}
                    onMouseDown={handleTuningMouseDown}
                    onTouchStart={handleTuningTouchStart}
                  >
                    <div className="absolute top-0 left-1/2 w-2 landscape:w-1.5 h-3 landscape:h-2.5 bg-gradient-to-b from-emerald-400 to-emerald-500 rounded-sm transform -translate-x-1/2 shadow-sm border border-emerald-300/50 z-20" />

                    {/* Glow effect opposite to pointer */}
                    <div
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-400/20 via-gray-500/30 to-gray-600/20 blur-lg"
                      style={{ transform: `rotate(180deg)` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
