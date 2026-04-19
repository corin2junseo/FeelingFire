"use client";

import React from "react";
import ReactDOM from "react-dom";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
  ArrowUp,
  Square,
  X,
  FileText,
  Clock,
  Layers,
  Check,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { calcCreditCost } from "@/services/pricing";


// ── Textarea ──────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex w-full rounded-md border-none bg-transparent px-3 py-2.5 text-base text-gray-100 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] resize-none",
        className
      )}
      ref={ref}
      rows={1}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

// ── Tooltip ───────────────────────────────────────────────────────────────────
const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border border-[#333333] bg-[#1F2023] px-3 py-1.5 text-sm text-white shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// ── PromptInput Context ───────────────────────────────────────────────────────
interface PromptInputContextType {
  isLoading: boolean;
  value: string;
  setValue: (value: string) => void;
  maxHeight: number | string;
  onSubmit?: () => void;
  disabled?: boolean;
}
const PromptInputContext = React.createContext<PromptInputContextType>({
  isLoading: false,
  value: "",
  setValue: () => {},
  maxHeight: 240,
  onSubmit: undefined,
  disabled: false,
});
function usePromptInput() {
  return React.useContext(PromptInputContext);
}

// ── PromptInput ───────────────────────────────────────────────────────────────
interface PromptInputProps {
  isLoading?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  maxHeight?: number | string;
  onSubmit?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}
const PromptInput = React.forwardRef<HTMLDivElement, PromptInputProps>(
  (
    {
      className,
      isLoading = false,
      maxHeight = 240,
      value,
      onValueChange,
      onSubmit,
      children,
      disabled = false,
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState(value || "");
    const handleChange = (newValue: string) => {
      setInternalValue(newValue);
      onValueChange?.(newValue);
    };
    return (
      <TooltipProvider>
        <PromptInputContext.Provider
          value={{
            isLoading,
            value: value ?? internalValue,
            setValue: onValueChange ?? handleChange,
            maxHeight,
            onSubmit,
            disabled,
          }}
        >
          <div
            ref={ref}
            className={cn(
              "rounded-3xl border border-[#444444] bg-[#1F2023] p-2 shadow-[0_8px_30px_rgba(0,0,0,0.24)] transition-all duration-300",
              className
            )}
          >
            {children}
          </div>
        </PromptInputContext.Provider>
      </TooltipProvider>
    );
  }
);
PromptInput.displayName = "PromptInput";

// ── PromptInputTextarea ───────────────────────────────────────────────────────
interface PromptInputTextareaProps {
  disableAutosize?: boolean;
  placeholder?: string;
}
const PromptInputTextarea: React.FC<
  PromptInputTextareaProps & React.ComponentProps<typeof Textarea>
> = ({ className, onKeyDown, disableAutosize = false, placeholder, ...props }) => {
  const { value, setValue, maxHeight, onSubmit, disabled } = usePromptInput();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (disableAutosize || !textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      typeof maxHeight === "number"
        ? `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`
        : `min(${textareaRef.current.scrollHeight}px, ${maxHeight})`;
  }, [value, maxHeight, disableAutosize]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
    onKeyDown?.(e);
  };

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      className={cn("text-base", className)}
      disabled={disabled}
      placeholder={placeholder}
      {...props}
    />
  );
};

// ── PromptInputActions ────────────────────────────────────────────────────────
interface PromptInputActionsProps extends React.HTMLAttributes<HTMLDivElement> {}
const PromptInputActions: React.FC<PromptInputActionsProps> = ({
  children,
  className,
  ...props
}) => (
  <div className={cn("flex items-center gap-2", className)} {...props}>
    {children}
  </div>
);

// ── PromptInputAction ─────────────────────────────────────────────────────────
interface PromptInputActionProps extends React.ComponentProps<typeof Tooltip> {
  tooltip: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}
const PromptInputAction: React.FC<PromptInputActionProps> = ({
  tooltip,
  children,
  className,
  side = "top",
  ...props
}) => {
  const { disabled } = usePromptInput();
  return (
    <Tooltip {...props}>
      <TooltipTrigger asChild disabled={disabled}>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} className={className}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
};

// ── CustomDivider ─────────────────────────────────────────────────────────────
const CustomDivider: React.FC = () => (
  <div className="relative h-6 w-[1.5px] mx-1">
    <div
      className="absolute inset-0 bg-gradient-to-t from-transparent via-[#9b87f5]/70 to-transparent rounded-full"
      style={{
        clipPath:
          "polygon(0% 0%, 100% 0%, 100% 40%, 140% 50%, 100% 60%, 100% 100%, 0% 100%, 0% 60%, -40% 50%, 0% 40%)",
      }}
    />
  </div>
);

// ── LyricsModal (React Portal) ────────────────────────────────────────────────
interface LyricsModalProps {
  open: boolean;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
}
const LyricsModal: React.FC<LyricsModalProps> = ({
  open,
  value,
  onChange,
  onClose,
}) => {
  const [mounted, setMounted] = React.useState(false);
  const [draft, setDraft] = React.useState(value);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  if (!mounted) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative bg-[#1F2023] border border-[#333] rounded-2xl p-6 w-full max-w-lg shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-gray-100 font-semibold text-base">Lyrics</h2>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-300 hover:bg-[#333] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-gray-500 text-xs mb-4">
              Use structure tags like [Verse], [Chorus], [Bridge]
            </p>

            {/* Textarea */}
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={"[Verse]\nYour lyrics here...\n\n[Chorus]\n..."}
              className="w-full h-52 bg-[#2A2A2E] text-sm text-gray-200 rounded-xl px-3 py-2.5 outline-none border border-[#444] focus:border-[#9b87f5]/60 resize-none placeholder:text-gray-600"
            />

            {/* Actions */}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => {
                  setDraft("");
                  onChange("");
                  onClose();
                }}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Clear lyrics
              </button>
              <button
                onClick={() => {
                  onChange(draft);
                  onClose();
                }}
                className="flex items-center gap-1.5 bg-[#9b87f5] hover:bg-[#9b87f5]/80 text-white text-sm font-medium px-4 py-1.5 rounded-full transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

// ── DurationPopover ───────────────────────────────────────────────────────────
const DURATION_OPTIONS = [
  { label: "1 min", value: 60, credits: 1 },
  { label: "2 min", value: 120, credits: 2 },
  { label: "3 min", value: 180, credits: 3 },
];

interface DurationPopoverProps {
  value: number;
  onChange: (v: number) => void;
}
const DurationPopover: React.FC<DurationPopoverProps> = ({ value, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const currentLabel =
    DURATION_OPTIONS.find((o) => o.value === value)?.label ?? "Duration";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "rounded-full transition-all flex items-center gap-1.5 px-2 py-1 border h-8 text-xs",
          open || value !== 60
            ? "bg-[#9b87f5]/15 border-[#9b87f5]/60 text-[#9b87f5]"
            : "bg-transparent border-transparent text-[#9CA3AF] hover:text-[#D1D5DB]"
        )}
      >
        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="hidden sm:inline">{currentLabel}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-full left-0 mb-2 z-50 bg-[#2A2A2E] border border-[#444] rounded-xl shadow-xl overflow-hidden min-w-[140px]"
          >
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2.5 text-sm transition-colors",
                  value === opt.value
                    ? "text-[#9b87f5] bg-[#9b87f5]/10"
                    : "text-gray-300 hover:bg-[#333] hover:text-white"
                )}
              >
                <span>{opt.label}</span>
                <span className={cn(
                  "text-[11px] flex items-center gap-0.5",
                  opt.credits > 1 ? "text-amber-400/70" : "text-gray-600"
                )}>
                  {opt.credits} cr
                  {value === opt.value && <Check className="w-3 h-3 ml-1" />}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── BatchSizePopover ──────────────────────────────────────────────────────────
interface BatchSizePopoverProps {
  value: number;
  onChange: (v: number) => void;
}
const BatchSizePopover: React.FC<BatchSizePopoverProps> = ({ value, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "rounded-full transition-all flex items-center gap-1.5 px-2 py-1 border h-8 text-xs",
          open || value > 1
            ? "bg-[#9b87f5]/15 border-[#9b87f5]/60 text-[#9b87f5]"
            : "bg-transparent border-transparent text-[#9CA3AF] hover:text-[#D1D5DB]"
        )}
      >
        <Layers className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="hidden sm:inline">×{value}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-full left-0 mb-2 z-50 bg-[#2A2A2E] border border-[#444] rounded-xl shadow-xl overflow-hidden p-2"
          >
            <p className="text-[11px] text-gray-500 px-1 pb-1.5">Variations</p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => {
                      onChange(n);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                      value === n
                        ? "bg-[#9b87f5] text-white"
                        : "bg-[#333] text-gray-300 hover:bg-[#444] hover:text-white"
                    )}
                  >
                    {n}
                  </button>
                  <span className={cn(
                    "text-[10px]",
                    n === 1 ? "text-gray-600" : "text-amber-400/70"
                  )}>
                    {n === 1 ? "base" : `+${n - 1}`}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── MusicOptions ──────────────────────────────────────────────────────────────
export interface MusicOptions {
  lyrics: string;
  duration: number;
  batchSize: number;
}

// ── PromptInputBox (main export) ──────────────────────────────────────────────
interface PromptInputBoxProps {
  onSend?: (caption: string, options: MusicOptions) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  userCredits?: number;
  onInsufficientCredits?: () => void;
}
export const PromptInputBox = React.forwardRef(
  (props: PromptInputBoxProps, ref: React.Ref<HTMLDivElement>) => {
    const {
      onSend = () => {},
      isLoading = false,
      placeholder = "Describe the music style, mood, genre…",
      className,
      userCredits,
      onInsufficientCredits,
    } = props;

    const [input, setInput] = React.useState("");
    const [lyrics, setLyrics] = React.useState("");
    const [duration, setDuration] = React.useState(60);
    const [batchSize, setBatchSize] = React.useState(1);
    const [showLyricsModal, setShowLyricsModal] = React.useState(false);

    const hasContent = input.trim() !== "";
    const hasLyrics = lyrics.trim() !== "";

    const creditCost = calcCreditCost(duration, batchSize);
    const hasEnoughCredits = userCredits === undefined || userCredits >= creditCost;

    const handleSubmit = () => {
      if (!hasContent) return;
      if (!hasEnoughCredits) {
        onInsufficientCredits?.();
        return;
      }
      onSend(input.trim(), { lyrics, duration, batchSize });
      setInput("");
    };

    return (
      <>
        <PromptInput
          value={input}
          onValueChange={setInput}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          className={cn(
            "w-full bg-[#1F2023] border-[#444444] shadow-[0_8px_30px_rgba(0,0,0,0.24)] transition-all duration-300 ease-in-out",
            className
          )}
          disabled={isLoading}
          ref={ref}
        >
          {/* Textarea */}
          <PromptInputTextarea
            placeholder={placeholder}
            className="text-base"
          />

          {/* Actions bar */}
          <PromptInputActions className="flex items-center justify-between gap-2 p-0 pt-2">
            {/* Left: Lyrics, Duration, Batch */}
            <div className="flex items-center gap-1">
              {/* Lyrics */}
              <PromptInputAction tooltip="Add lyrics">
                <button
                  type="button"
                  onClick={() => setShowLyricsModal(true)}
                  className={cn(
                    "rounded-full transition-all flex items-center gap-1.5 px-2 py-1 border h-8 text-xs",
                    hasLyrics
                      ? "bg-[#9b87f5]/15 border-[#9b87f5]/60 text-[#9b87f5]"
                      : "bg-transparent border-transparent text-[#9CA3AF] hover:text-[#D1D5DB]"
                  )}
                >
                  <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="hidden sm:inline">Lyrics</span>
                  {hasLyrics && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9b87f5] flex-shrink-0" />
                  )}
                </button>
              </PromptInputAction>

              <CustomDivider />

              {/* Duration */}
              <DurationPopover value={duration} onChange={setDuration} />

              <CustomDivider />

              {/* Batch size */}
              <BatchSizePopover value={batchSize} onChange={setBatchSize} />
            </div>

            {/* Right: Credit cost + Send / Stop */}
            <div className="flex items-center gap-2">
              {/* Credit cost badge */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={creditCost}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium border",
                    !hasEnoughCredits
                      ? "bg-red-500/10 border-red-500/30 text-red-400"
                      : "bg-amber-400/[0.08] border-amber-400/20 text-amber-400/80"
                  )}
                >
                  <Zap className="w-2.5 h-2.5 fill-current" />
                  <span>{creditCost}</span>
                </motion.div>
              </AnimatePresence>

              <PromptInputAction
                tooltip={
                  !hasEnoughCredits
                    ? "Not enough credits"
                    : isLoading
                    ? "Generating…"
                    : "Send"
                }
              >
                <button
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200",
                    hasContent && hasEnoughCredits
                      ? "bg-white hover:bg-white/80 text-[#1F2023]"
                      : hasContent && !hasEnoughCredits
                      ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 cursor-pointer"
                      : "bg-transparent text-[#9CA3AF] cursor-default"
                  )}
                  onClick={handleSubmit}
                  disabled={!hasContent || isLoading}
                >
                  {isLoading ? (
                    <Square className="h-4 w-4 fill-[#1F2023] animate-pulse" />
                  ) : (
                    <ArrowUp className="h-4 w-4" />
                  )}
                </button>
              </PromptInputAction>
            </div>
          </PromptInputActions>
        </PromptInput>

        {/* Lyrics Modal (React Portal) */}
        <LyricsModal
          open={showLyricsModal}
          value={lyrics}
          onChange={setLyrics}
          onClose={() => setShowLyricsModal(false)}
        />
      </>
    );
  }
);
PromptInputBox.displayName = "PromptInputBox";
