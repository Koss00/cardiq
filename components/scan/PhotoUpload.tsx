'use client';

import { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

interface Props {
  onImage: (base64: string, mediaType: string, previewUrl: string) => void;
}

const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

export default function PhotoUpload({ onImage }: Props) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const processFile = useCallback(
    (file: File) => {
      if (!ACCEPTED.includes(file.type)) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64 = result.split(',')[1];
        setPreview(result);
        onImage(base64, file.type, result);
      };
      reader.readAsDataURL(file);
    },
    [onImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  if (preview) {
    return (
      <div className="relative chrome-panel p-4 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="Card preview" className="max-h-72 rounded-md border border-[rgba(245,200,66,0.2)] object-contain shadow-gold" />
        <button
          onClick={() => setPreview(null)}
          className="absolute top-3 right-3 w-8 h-8 bg-navy-900/90 border border-[#1E2D45] rounded-md flex items-center justify-center hover:border-[rgba(245,200,66,0.3)] hover:text-white transition-colors cursor-pointer"
        >
          <X size={13} className="text-chrome-300" />
        </button>
      </div>
    );
  }

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center w-full h-72 border-2 border-dashed cursor-pointer transition-all duration-200 rounded-xl overflow-hidden ${
        dragging
          ? 'border-gold-400 bg-gold-400/5 shadow-gold'
          : 'border-[#1E2D45] bg-[#111D33] hover:border-[rgba(245,200,66,0.25)] hover:bg-[#131F36]'
      }`}
    >
      {/* Subtle radial glow behind icon */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: dragging
            ? 'radial-gradient(ellipse at 50% 50%, rgba(245,200,66,0.08) 0%, transparent 65%)'
            : 'radial-gradient(ellipse at 50% 50%, rgba(30,45,69,0.6) 0%, transparent 65%)',
          transition: 'background 0.2s ease',
        }}
      />

      <div className="relative flex flex-col items-center gap-5 text-center px-8">
        <div className={`w-16 h-16 border-2 rounded-xl flex items-center justify-center transition-all duration-200 ${
          dragging
            ? 'border-gold-400 bg-gold-400/15 shadow-gold'
            : 'border-[#1E2D45] bg-navy-900'
        }`}>
          {dragging
            ? <ImageIcon className="text-gold-400" size={28} />
            : <Upload className="text-chrome-500 group-hover:text-chrome-300" size={28} />}
        </div>
        <div>
          <p className={`font-display font-bold text-base tracking-wide ${dragging ? 'text-gold-400' : 'text-white'}`}>
            {dragging ? 'Drop to identify' : 'Upload a card photo'}
          </p>
          <p className="text-muted text-sm mt-1.5 font-sans">
            Drag & drop or <span className="text-gold-400 font-medium">click to browse</span>
          </p>
          <p className="text-chrome-600 text-xs mt-1">JPG, PNG, or WebP</p>
        </div>
      </div>

      <input type="file" className="hidden" accept={ACCEPTED.join(',')} onChange={handleChange} />
    </label>
  );
}
