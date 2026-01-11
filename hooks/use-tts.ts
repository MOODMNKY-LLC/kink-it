"use client"

import { useState, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

interface TTSState {
  isPlaying: boolean
  isLoading: boolean
  error: string | null
}

/**
 * useTTS Hook
 * 
 * Manages Text-to-Speech playback with support for:
 * - Browser Web Speech API (fallback)
 * - Eleven Labs API
 * - OpenAI TTS API
 */
export function useTTS() {
  const [state, setState] = useState<TTSState>({
    isPlaying: false,
    isLoading: false,
    error: null,
  })
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  const supabase = createClient()

  const stop = useCallback(() => {
    // Stop audio playback
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }

    // Stop speech synthesis
    if (speechSynthesisRef.current && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      speechSynthesisRef.current = null
    }

    setState({
      isPlaying: false,
      isLoading: false,
      error: null,
    })
  }, [])

  const play = useCallback(async (text: string) => {
    // Stop any current playback
    stop()

    setState({
      isPlaying: false,
      isLoading: true,
      error: null,
    })

    try {
      // Get user's TTS settings
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("User not authenticated")
      }

      const { data: settings, error: settingsError } = await supabase
        .from("user_chat_settings")
        .select("tts_provider, tts_voice_id, tts_speed, tts_pitch")
        .eq("user_id", user.id)
        .eq("agent_name", "Kinky Kincade")
        .single()

      if (settingsError && settingsError.code !== "PGRST116") {
        // PGRST116 = not found, which is fine (use defaults)
        console.error("Error loading TTS settings:", settingsError)
      }

      const provider = settings?.tts_provider || "browser"
      const voiceId = settings?.tts_voice_id
      const speed = settings?.tts_speed || 1.0
      const pitch = settings?.tts_pitch || 1.0

      // Validate provider and voiceId combination
      if (provider !== "browser" && !voiceId) {
        throw new Error(`Voice ID is required for ${provider} TTS. Please select a voice in settings.`)
      }

      if (provider === "browser") {
        // Use browser Web Speech API
        if (!window.speechSynthesis) {
          throw new Error("Speech synthesis not supported in this browser")
        }

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = speed
        utterance.pitch = pitch
        utterance.volume = 1.0

        utterance.onend = () => {
          setState({
            isPlaying: false,
            isLoading: false,
            error: null,
          })
        }

        utterance.onerror = (error) => {
          setState({
            isPlaying: false,
            isLoading: false,
            error: error.error || "Speech synthesis failed",
          })
        }

        speechSynthesisRef.current = utterance
        window.speechSynthesis.speak(utterance)

        setState({
          isPlaying: true,
          isLoading: false,
          error: null,
        })
      } else {
        // Use external TTS API (Eleven Labs or OpenAI)
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            provider,
            voiceId,
            speed,
            pitch,
          }),
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: "TTS request failed" }))
          throw new Error(error.error || "TTS request failed")
        }

        // Get audio blob
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)

        // Create audio element and play
        const audio = new Audio(audioUrl)
        audioRef.current = audio

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
          setState({
            isPlaying: false,
            isLoading: false,
            error: null,
          })
        }

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl)
          setState({
            isPlaying: false,
            isLoading: false,
            error: "Audio playback failed",
          })
        }

        await audio.play()

        setState({
          isPlaying: true,
          isLoading: false,
          error: null,
        })
      }
    } catch (error) {
      console.error("TTS error:", error)
      setState({
        isPlaying: false,
        isLoading: false,
        error: error instanceof Error ? error.message : "TTS failed",
      })
      throw error
    }
  }, [stop, supabase])

  return {
    isPlaying: state.isPlaying,
    isLoading: state.isLoading,
    error: state.error,
    play,
    stop,
  }
}
