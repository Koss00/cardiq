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
      <div className="relative inline-block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="Card preview" className="max-h-72 border border-[rgba(0,212,255,0.2)] rounded-sm object-contain" />
        <button
          onClick={() => setPreview(null)}
          className="absolute top-2 right-2 w-7 h-7 bg-navy-900 border border-[rgba(0,212,255,0.2)] rounded-sm flex items-center justify-center hover:border-[rgba(0,212,255,0.4)] transition-colors"
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
      className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed cursor-pointer transition-all rounded-sm ${
        dragging
          ? 'border-electric bg-electric/5 shadow-[0_0_30px_rgba(0,212,255,0.1)]'
          : 'border-[rgba(0,212,255,0.15)] bg-navy-800/50 hover:border-[rgba(0,212,255,0.3)] hover:bg-navy-800'
      }`}
    >
      <div className="flex flex-col items-center gap-4 text-center px-6">
        <div className={`w-14 h-14 border flex items-center justify-center rounded-sm transition-all ${
          dragging ? 'border-electric bg-electric/15' : 'border-[rgba(0,212,255,0.15)] bg-navy-700'
        }`}>
          {dragging ? <ImageIcon className="text-electric" size={26} /> : <Upload className="text-chrome-400" size={26} />}
        </div>
        <div>
          <p className={`font-display font-black uppercase tracking-widest text-sm ${dragging ? 'text-electric' : 'text-white'}`}>
            {dragging ? 'Drop to identify' : 'Upload card photo'}
          </p>
          <p className="text-chrome-500 text-xs mt-1 font-display">Drag & drop or click to browse — JPG, PNG, WebP</p>
        </div>
      </div>
      <input type="file" className="hidden" accept={ACCEPTED.join(',')} onChange={handleChange} />
    </label>
  );
}
