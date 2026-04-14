"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "./utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";

interface DateTimePickerProps {
  date?: string; // Expects ISO string or YYYY-MM-DDTHH:mm
  setDate: (date: string) => void;
  label?: string;
  className?: string;
}

export function DateTimePicker({ date, setDate, label, className }: DateTimePickerProps) {
  const currentDate = date ? new Date(date) : undefined;
  
  // Format the visual display
  const displayValue = currentDate && !isNaN(currentDate.getTime())
    ? format(currentDate, "PPP p")
    : "Pick date & time";

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) return;
    
    const updated = new Date(newDate);
    if (currentDate) {
      updated.setHours(currentDate.getHours());
      updated.setMinutes(currentDate.getMinutes());
    } else {
      updated.setHours(12);
      updated.setMinutes(0);
    }
    
    // Format to YYYY-MM-DDTHH:mm for state compatibility
    const year = updated.getFullYear();
    const month = String(updated.getMonth() + 1).padStart(2, '0');
    const day = String(updated.getDate()).padStart(2, '0');
    const hours = String(updated.getHours()).padStart(2, '0');
    const minutes = String(updated.getMinutes()).padStart(2, '0');
    
    setDate(`${year}-${month}-${day}T${hours}:${minutes}`);
  };

  const handleTimeChange = (type: 'hours' | 'minutes', value: string) => {
    const updated = currentDate ? new Date(currentDate) : new Date();
    const val = parseInt(value, 10);
    
    if (type === 'hours') updated.setHours(val);
    else updated.setMinutes(val);

    const year = updated.getFullYear();
    const month = String(updated.getMonth() + 1).padStart(2, '0');
    const day = String(updated.getDate()).padStart(2, '0');
    const hours = String(updated.getHours()).padStart(2, '0');
    const minutes = String(updated.getMinutes()).padStart(2, '0');
    
    setDate(`${year}-${month}-${day}T${hours}:${minutes}`);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      {label && <label className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-none">{label}</label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal bg-black border-zinc-800 h-12 rounded-xl hover:bg-zinc-900 transition-colors",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-blue-400" />
            {displayValue}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800" align="start">
          <Calendar
            mode="single"
            selected={currentDate}
            onSelect={handleDateSelect}
            initialFocus
            className="rounded-md border-0"
          />
          <div className="p-3 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-400">Time:</span>
            </div>
            <div className="flex items-center gap-1">
              <select 
                className="bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-zinc-500"
                value={currentDate?.getHours() || 12}
                onChange={(e) => handleTimeChange('hours', e.target.value)}
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                ))}
              </select>
              <span className="text-gray-500">:</span>
              <select 
                className="bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-zinc-500"
                value={currentDate?.getMinutes() || 0}
                onChange={(e) => handleTimeChange('minutes', e.target.value)}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i * 5} value={i * 5}>{(i * 5).toString().padStart(2, '0')}</option>
                ))}
              </select>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
