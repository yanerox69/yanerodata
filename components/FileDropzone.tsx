import React, { useCallback, useRef, useState } from 'react';
import { FileIcon, UploadIcon, XIcon } from './icons';

interface FileDropzoneProps {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}

const ACCEPTED = '.pdf,.docx,.txt,.md';

export const FileDropzone: React.FC<FileDropzoneProps> = ({ files, onChange, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (incoming: FileList | null) => {
      if (!incoming) return;
      const merged = [...files, ...Array.from(incoming)].slice(0, 20);
      onChange(merged);
    },
    [files, onChange]
  );

  const removeFile = (idx: number) => {
    onChange(files.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!disabled) addFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`cursor-pointer border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? 'border-sky-400 bg-sky-400/10' : 'border-gray-600 hover:border-gray-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <UploadIcon className="h-8 w-8 mx-auto text-sky-400 mb-2" />
        <p className="text-gray-300 font-medium">Suelta contratos/documentos aquí o haz clic para elegir</p>
        <p className="text-gray-500 text-sm mt-1">PDF, DOCX o TXT — hasta 20 archivos</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          className="hidden"
          disabled={disabled}
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {files.map((f, idx) => (
            <li
              key={`${f.name}-${idx}`}
              className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2 truncate">
                <FileIcon className="h-4 w-4 text-sky-400 shrink-0" />
                <span className="truncate">{f.name}</span>
              </span>
              {!disabled && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  className="text-gray-500 hover:text-red-400 shrink-0"
                  aria-label={`Remove ${f.name}`}
                >
                  <XIcon className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
