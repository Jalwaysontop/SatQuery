import React, { useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Paperclip,
  Globe,
  ArrowRight,
  Sparkles,
  X,
  Info,
  Layers,
  FileImage,
  Radio,
  FileText,
  MapPin,
  Satellite,
  Volume2
} from 'lucide-react';
import { useQueryContext } from '../context/useQueryContext';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { FileUploadModal } from './FileUploadModal';
import { GeoContextModal } from './GeoContextModal';

const suggestionChips = [
  'What changed between these two images?',
  'Is this area flooded in the SAR image?',
  'Classify land use in this scene',
  'Detect deforestation in this region',
];

export const SearchBar: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    searchQuery,
    setSearchQuery,
    lastSubmittedQuery,
    showPlaceholderResponse,
    setShowPlaceholderResponse,
    handleQuerySubmit,
    attachedFiles,
    removeAttachedFile,
    setIsUploadModalOpen,
    geoContext,
    setIsGeoModalOpen,
  } = useQueryContext();

  // Voice recognition hook
  const {
    isListening,
    transcript,
    error: voiceError,
    audioLevel,
    toggleListening,
    stopListening,
  } = useVoiceRecognition((liveText) => {
    setSearchQuery(liveText);
  });

  // When speech transcript updates, keep search input updated
  useEffect(() => {
    if (transcript) {
      setSearchQuery(transcript);
    }
  }, [transcript, setSearchQuery]);

  // Focus input if navigated with ?new=true
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      inputRef.current?.focus();
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('new');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isListening) {
      stopListening();
    }
    if (!searchQuery.trim() && attachedFiles.length === 0) return;
    handleQuerySubmit(searchQuery);
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isListening) {
      stopListening();
    }
    handleQuerySubmit(suggestion);
  };

  const handleClear = () => {
    if (isListening) {
      stopListening();
    }
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getModalityIcon = (category: string) => {
    if (category.startsWith('sar')) return Radio;
    if (category === 'document') return FileText;
    return FileImage;
  };

  const isGeoCustomized =
    geoContext.regionName !== 'Global / Auto-Detect' ||
    geoContext.sensor !== 'auto' ||
    geoContext.language !== 'en-US';

  return (
    <div className="w-full max-w-[840px] mx-auto px-4 z-20 relative my-2">
      {/* File Upload Modal */}
      <FileUploadModal />

      {/* Geo / Globe Context Modal */}
      <GeoContextModal />

      {/* Active Targeting Badge Bar (Above Search Bar if Geo is Configured) */}
      {isGeoCustomized && (
        <div className="flex items-center justify-between px-3 py-1.5 mb-2 rounded-xl bg-[#0f1523]/80 border border-blue-500/30 text-xs text-blue-300 backdrop-blur-sm animate-fade-in">
          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="flex items-center gap-1 font-semibold text-white">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>{geoContext.regionName}</span>
            </div>
            <span className="text-slate-600">•</span>
            <div className="flex items-center gap-1 text-[11px] text-gray-300">
              <Satellite className="w-3 h-3 text-cyan-400" />
              <span className="capitalize">{geoContext.sensor.replace(/_/g, ' ')}</span>
            </div>
            {geoContext.language !== 'en-US' && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-[11px] text-gray-400">{geoContext.language}</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsGeoModalOpen(true)}
            className="text-[11px] text-blue-400 hover:text-blue-300 underline font-medium cursor-pointer flex-shrink-0 ml-2"
          >
            Edit ROI
          </button>
        </div>
      )}

      {/* Attached Files Inline Strip (Above Search Bar) */}
      {attachedFiles.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-1 scrollbar-thin">
          <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1 mr-1 flex-shrink-0">
            <Paperclip className="w-3 h-3 text-blue-400" />
            <span>Files ({attachedFiles.length}):</span>
          </span>
          {attachedFiles.map((f) => {
            const Icon = getModalityIcon(f.category);
            return (
              <div
                key={f.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141b2c] border border-blue-500/30 text-xs text-gray-200 flex-shrink-0 shadow-sm"
              >
                <Icon className="w-3 h-3 text-blue-400 flex-shrink-0" />
                <span className="max-w-[120px] truncate font-medium">{f.name}</span>
                <span className="text-[10px] text-gray-400 font-mono">({formatFileSize(f.size)})</span>
                <button
                  type="button"
                  onClick={() => removeAttachedFile(f.id)}
                  className="p-0.5 text-gray-400 hover:text-red-400 rounded transition-colors ml-0.5"
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="px-2 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-[11px] text-blue-300 font-medium flex-shrink-0 transition-colors cursor-pointer"
          >
            + Add
          </button>
        </div>
      )}

      {/* Main Search Input Form */}
      <form
        onSubmit={handleSubmit}
        className={`
          relative flex items-center w-full
          bg-[#121724]/95 border rounded-full
          px-3 sm:px-4 py-2 sm:py-2.5
          transition-all duration-200 shadow-2xl backdrop-blur-md
          ${
            isListening
              ? 'border-red-500/80 ring-2 ring-red-500/30 shadow-red-500/20'
              : 'border-slate-700/70 hover:border-slate-600 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20'
          }
        `}
      >
        {/* Left Side: Microphone & Paperclip Icons */}
        <div className="flex items-center gap-1 sm:gap-2 mr-2 sm:mr-3 text-gray-400 flex-shrink-0">
          {/* Microphone Voice Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`
              p-2 rounded-full transition-all duration-200 cursor-pointer relative
              ${
                isListening
                  ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500 animate-pulse'
                  : 'hover:text-blue-400 hover:bg-slate-800/80 text-gray-400'
              }
            `}
            title={isListening ? 'Stop voice recording' : 'Voice search (Transcribe speech)'}
            aria-label="Voice Search"
          >
            {isListening ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
            {isListening && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            )}
          </button>

          {/* Paperclip File Upload Button */}
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className={`
              p-2 rounded-full transition-all duration-150 cursor-pointer relative
              ${
                attachedFiles.length > 0
                  ? 'text-blue-400 bg-blue-600/20 ring-1 ring-blue-500/40'
                  : 'hover:text-blue-400 hover:bg-slate-800/80 text-gray-400'
              }
            `}
            title="Attach Satellite Imagery / TIFF / Shapefile"
            aria-label="Attach satellite imagery files"
          >
            <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
            {attachedFiles.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                {attachedFiles.length}
              </span>
            )}
          </button>
        </div>

        {/* Live Audio Level / Listening Visualizer or Search Input */}
        {isListening ? (
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-1 h-5">
              <span className="w-1 bg-red-500 rounded-full animate-bounce" style={{ height: `${Math.max(20, audioLevel)}%`, animationDelay: '0ms' }} />
              <span className="w-1 bg-red-400 rounded-full animate-bounce" style={{ height: `${Math.max(40, audioLevel * 1.2)}%`, animationDelay: '150ms' }} />
              <span className="w-1 bg-red-500 rounded-full animate-bounce" style={{ height: `${Math.max(60, audioLevel * 0.8)}%`, animationDelay: '300ms' }} />
              <span className="w-1 bg-red-400 rounded-full animate-bounce" style={{ height: `${Math.max(30, audioLevel * 1.1)}%`, animationDelay: '450ms' }} />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Listening... Speak your satellite query now..."
              className="flex-1 bg-transparent text-white placeholder-red-300/70 text-sm sm:text-base outline-none min-w-0 font-medium"
            />
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ask about any place on Earth…"
            className="flex-1 bg-transparent text-white placeholder-gray-400 text-sm sm:text-base outline-none min-w-0"
          />
        )}

        {/* Clear input button */}
        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-gray-400 hover:text-gray-200 rounded-full hover:bg-slate-800 transition-colors mr-1 cursor-pointer"
            aria-label="Clear text"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Right Side: Globe Icon + Circular Blue Send Button */}
        <div className="flex items-center gap-2 sm:gap-3 ml-2 flex-shrink-0">
          {/* Globe Regional ROI & Constellation Selector Button */}
          <button
            type="button"
            onClick={() => setIsGeoModalOpen(true)}
            className={`
              p-2 rounded-full transition-all duration-150 cursor-pointer relative
              ${
                isGeoCustomized
                  ? 'text-blue-400 bg-blue-600/20 ring-1 ring-blue-500/40'
                  : 'hover:text-blue-400 hover:bg-slate-800/80 text-gray-400'
              }
            `}
            title={`Geographic Context: ${geoContext.regionName} (${geoContext.sensor})`}
            aria-label="Select Geographic Coordinates and Sensors"
          >
            <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
            {isGeoCustomized && (
              <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-cyan-400" />
            )}
          </button>

          {/* Circular Blue "Send" button */}
          <button
            type="submit"
            className={`
              w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center
              bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white
              shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50
              transition-all duration-150 cursor-pointer active:scale-95 flex-shrink-0
              ${!searchQuery.trim() && attachedFiles.length === 0 ? 'opacity-80' : 'opacity-100'}
            `}
            title="Submit query to SatQuery AI"
            aria-label="Send Query"
          >
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </form>

      {/* Voice Recognition Error Notice (if any) */}
      {voiceError && (
        <div className="mt-2 text-center text-xs text-amber-300/90 flex items-center justify-center gap-1.5 bg-amber-950/40 border border-amber-500/30 rounded-lg py-1.5 px-3">
          <Volume2 className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
          <span>{voiceError}</span>
        </div>
      )}

      {/* Suggestion Chips Below Search Bar */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-3.5 text-xs">
        <span className="text-gray-400 font-medium flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-blue-400" />
          <span>Try asking:</span>
        </span>

        {suggestionChips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => handleSuggestionClick(chip)}
            className="
              px-3 py-1 rounded-full text-gray-400 hover:text-white
              bg-[#131926] hover:bg-[#1c2438]
              border border-slate-800 hover:border-blue-500/40
              transition-all duration-150 cursor-pointer
              shadow-sm active:scale-95 text-center
            "
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Dismissible Placeholder Response Card */}
      {showPlaceholderResponse && (
        <div className="mt-4 p-4 rounded-2xl bg-[#101726]/95 border border-blue-500/30 shadow-2xl backdrop-blur-md animate-fade-in transition-all">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Info className="w-4 h-4 text-blue-400" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white tracking-tight">
                    Query Registered in Frontend Sandbox
                  </h4>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded border border-blue-500/30">
                    FastAPI Ready
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Backend not connected yet — this query has been logged, but no analysis was run.
                </p>

                {/* Query details summary */}
                <div className="space-y-1.5 pt-1">
                  {lastSubmittedQuery && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0a0e1a] border border-slate-800/80 text-[11px] text-gray-300 font-mono">
                      <Layers className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      <span className="truncate">"{lastSubmittedQuery}"</span>
                    </div>
                  )}

                  {/* Context parameters summary */}
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-400">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-blue-400" />
                      <span>{geoContext.regionName}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 flex items-center gap-1">
                      <Satellite className="w-2.5 h-2.5 text-cyan-400" />
                      <span className="capitalize">{geoContext.sensor.replace(/_/g, ' ')}</span>
                    </span>
                    {attachedFiles.length > 0 && (
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 flex items-center gap-1 text-emerald-300">
                        <Paperclip className="w-2.5 h-2.5" />
                        <span>{attachedFiles.length} file(s) attached</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Close / Dismiss Button */}
            <button
              type="button"
              onClick={() => setShowPlaceholderResponse(false)}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer flex-shrink-0"
              aria-label="Dismiss response"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
