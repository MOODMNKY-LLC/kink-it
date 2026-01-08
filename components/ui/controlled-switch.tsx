"use client"

import * as React from "react"
import { Switch } from "./switch"

interface ControlledSwitchProps {
  id: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  [key: string]: any
}

/**
 * ControlledSwitch - Wrapper around Radix Switch that prevents infinite loops
 * 
 * This component isolates Radix's initialization behavior from parent state updates.
 * It uses internal state that syncs with props, but only calls parent callback
 * on actual user interaction (not during initialization).
 */
export function ControlledSwitch({
  id,
  checked: checkedProp,
  onCheckedChange,
  disabled,
  ...props
}: ControlledSwitchProps) {
  const [internalChecked, setInternalChecked] = React.useState(checkedProp)
  const isMountedRef = React.useRef(false)
  const isUserInteractionRef = React.useRef(false)
  const previousCheckedRef = React.useRef(checkedProp)

  // Sync with prop changes from parent (but not during initialization or user interaction)
  React.useEffect(() => {
    if (isMountedRef.current && !isUserInteractionRef.current) {
      // Prop changed externally, sync internal state
      if (checkedProp !== previousCheckedRef.current) {
        setInternalChecked(checkedProp)
      }
    }
    previousCheckedRef.current = checkedProp
  }, [checkedProp])

  // Mark as mounted after first render
  React.useEffect(() => {
    isMountedRef.current = true
  }, [])

  const handleCheckedChange = React.useCallback((checked: boolean) => {
    // Update internal state immediately
    setInternalChecked(checked)
    
    // Mark as user interaction
    isUserInteractionRef.current = true
    
    // Call parent callback
    onCheckedChange(checked)
    
    // Reset user interaction flag after a brief delay
    // This allows prop sync to work again
    setTimeout(() => {
      isUserInteractionRef.current = false
    }, 100)
  }, [onCheckedChange])

  return (
    <Switch
      id={id}
      checked={internalChecked}
      onCheckedChange={handleCheckedChange}
      disabled={disabled}
      {...props}
    />
  )
}
