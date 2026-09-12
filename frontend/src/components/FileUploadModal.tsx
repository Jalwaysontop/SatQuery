import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileImage,
  FileText,
  Layers,
  Radio,
  Trash2,
  Plus
} from 'lucide-react';
import { useQueryContext } from '../context/useQueryContext';
import { type FileModalityCategory } from '../context/queryContextDef';

const modalityOptions: { key: FileModalityCategory; label: string; desc: string; icon: typeof Layers; color: string }[] = [
  {
    key: 'optical_t1',
    label: 'Optical T1 (Pre-Event)',
    desc: 'Sentinel-2 / Landsat RGB & multi-spectral bands (B02-B12)',
    icon: FileImage,
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  },
  {
    key: 'optical_t2',
    label: 'Optical T2 (Post-Event)',
    desc: 'Target comparison scene for temporal change analysis',
    icon: FileImage,
    color: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  },
  {
    key: 'sar_t1',
    label: 'SAR T1 (Radar)',
    desc: 'Sentinel-1 C-band VV / VH polarizations',
    icon: Radio,
    color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  },
  {
    key: 'sar_t2',
    label: 'SAR T2 (Post Radar)',
    desc: 'Sentinel-1 post-event radar polarization data',
    icon: Radio,
    color: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
  },
  {
    key: 'document',
    label: 'Vector / Document',
    desc: 'GeoJSON, Shapefile, CSV ground truth, or metadata',
    icon: FileText,
    color: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  },
];

export const FileUploadModal: React.FC = () => {
  const {
    isUploadModalOpen,
    setIsUploadModalOpen,
    attachedFiles,
    addAttachedFiles,
    removeAttachedFile,
    clearAttachedFiles,
    updateFileCategory,
  } = useQueryContext();

  const [selectedModality, setSelectedModality] = useState<FileModalityCategory>('optical_t1');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isUploadModalOpen) return null;

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addAttachedFiles(e.dataTransfer.files, selectedModality);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addAttachedFiles(e.target.files, selectedModality);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0f1420] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#121826]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Attach Satellite Imagery & Datasets
              </h3>
              <p className="text-xs text-gray-400">
                Upload GeoTIFFs, SAR polarizations, RGB tiles, or vector layers
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(false)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Modality Category Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Select Modality / Role For Uploaded Files
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {modalityOptions.map((opt) => {
                const isSelected = selectedModality === opt.key;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSelectedModality(opt.key)}
                    className={`
                      text-left p-2.5 rounded-xl border transition-all duration-150 cursor-pointer flex items-start gap-2.5
                      ${
                        isSelected
                          ? `${opt.color} ring-1 ring-blue-500/50`
                          : 'bg-[#141a29]/60 border-slate-800/80 text-gray-300 hover:bg-[#192235]'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">{opt.label}</div>
                      <div className="text-[10px] text-gray-400 line-clamp-1">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Drag & Drop Box */}
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all duration-200
              ${
                isDragOver
                  ? 'border-blue-400 bg-blue-600/15 scale-[0.99]'
                  : 'border-slate-700/80 hover:border-blue-500/60 bg-[#131926]/50 hover:bg-[#151c2d]'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".tif,.tiff,.png,.jpg,.jpeg,.geojson,.csv,.zip,.h5,.nc"
              className="hidden"
              onChange={handleFileInputChange}
            />
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
              <Upload className="w-6 h-6 animate-bounce" />
            </div>
            <p className="text-sm font-semibold text-white">
              Drag and drop satellite files here, or <span className="text-blue-400 underline">browse</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Supports GeoTIFF (.tif), Sentinel bands, PNG, JPEG, GeoJSON, CSV (Up to 25 MB per file)
            </p>
          </div>

          {/* Attached Files List */}
          {attachedFiles.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Attached Files ({attachedFiles.length})
                </div>
                <button
                  type="button"
                  onClick={clearAttachedFiles}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove All</span>
                </button>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {attachedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#141a29] border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                      {file.previewUrl ? (
                        <img
                          src={file.previewUrl}
                          alt="preview"
                          className="w-10 h-10 rounded-lg object-cover border border-slate-700 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-blue-400 flex-shrink-0">
                          <FileImage className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-white truncate">{file.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{formatFileSize(file.size)}</p>
                      </div>
                    </div>

                    {/* Modality Tag Dropdown */}
                    <div className="flex items-center gap-2">
                      <select
                        value={file.category}
                        onChange={(e) => updateFileCategory(file.id, e.target.value as FileModalityCategory)}
                        className="bg-[#0b0f1a] text-blue-300 text-[11px] font-medium py-1 px-2 rounded-lg border border-slate-700 outline-none cursor-pointer"
                      >
                        <option value="optical_t1">Optical T1 (Pre)</option>
                        <option value="optical_t2">Optical T2 (Post)</option>
                        <option value="sar_t1">SAR T1</option>
                        <option value="sar_t2">SAR T2</option>
                        <option value="document">Document/Vector</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => removeAttachedFile(file.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-[#121826]">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#192235] hover:bg-[#202c44] text-xs font-medium text-gray-200 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add More</span>
          </button>
          
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(false)}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            Done ({attachedFiles.length} file{attachedFiles.length === 1 ? '' : 's'})
          </button>
        </div>

      </div>
    </div>
  );
};
