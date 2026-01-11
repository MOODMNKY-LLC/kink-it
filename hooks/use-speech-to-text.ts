/**
 * Speech-to-Text Hook using Web Speech API
 * 
 * Provides speech recognition functionality for chat input
 */

"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface UseSpeechToTextOptions {
  continuous?: boolean
  interimResults?: boolean
  lang?: string
  onResult?: (transcript: string, isFinal: boolean) => void
  onError?: (error: string) => void
}

interface UseSpeechToTextReturn {
  transcript: string
  isListening: boolean
  isSupported: boolean
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  error: string | null
}

export function useSpeechToText({
  continuous = false,
  interimResults = true,
  lang = "en-US",
  onResult,
  onError,
}: UseSpeechToTextOptions = {}): UseSpeechToTextReturn {
  const [transcript, setTranscript] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const finalTranscriptRef = useRef("")

  // Check browser support
  const isSupported = typeof window !== "undefined" && 
    ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)

  useEffect(() => {
    if (!isSupported) {
      setError("Speech recognition is not supported in this browser")
      return
    }

    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.lang = lang

    // Handle results
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ""
      let finalTranscript = finalTranscriptRef.current

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " "
        } else {
          interimTranscript += transcript
        }
      }

      const fullTranscript = finalTranscript + interimTranscript
      setTranscript(fullTranscript.trim())
      finalTranscriptRef.current = finalTranscript.trim()

      // Call onResult callback
      if (onResult) {
        onResult(fullTranscript.trim(), interimTranscript === "")
      }
    }

    // Handle errors
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMessage = "Speech recognition error"
      
      switch (event.error) {
        case "no-speech":
          errorMessage = "No speech detected"
          break
        case "audio-capture":
          errorMessage = "No microphone found"
          break
        case "not-allowed":
          errorMessage = "Microphone permission denied"
          break
        case "network":
          errorMessage = "Network error"
          break
        default:
          errorMessage = `Speech recognition error: ${event.error}`
      }

      setError(errorMessage)
      setIsListening(false)
      
      if (onError) {
        onError(errorMessage)
      }
    }

    // Handle end
    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [continuous, interimResults, lang, isSupported, onResult, onError])

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      setError("Speech recognition not available")
      return
    }

    try {
      setError(null)
      setIsListening(true)
      recognitionRef.current.start()
    } catch (err: any) {
      setError(err.message || "Failed to start listening")
      setIsListening(false)
    }
  }, [isSupported])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [isListening])

  const resetTranscript = useCallback(() => {
    setTranscript("")
    finalTranscriptRef.current = ""
  }, [])

  return {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error,
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}
