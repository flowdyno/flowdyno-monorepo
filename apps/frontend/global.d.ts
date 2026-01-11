declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}

// 文件系统访问 API 类型
interface FilePickerAcceptType {
  description?: string;
  accept: Record<string, string[]>;
}

interface FilePickerOptions {
  id?: string;
  multiple?: boolean;
  types?: FilePickerAcceptType[];
  suggestedName?: string;
}

interface FileSystemFileHandle {
  readonly kind: 'file';
  readonly name: string;
  createWritable(): Promise<FileSystemWritableFileStream>;
  getFile(): Promise<File>;
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: any): Promise<void>;
  close(): Promise<void>;
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
}

interface FileSystemDirectoryHandle {
  readonly kind: 'directory';
  readonly name: string;
  values(): AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle>;
}

interface DirectoryPickerOptions {
  id?: string;
  mode?: 'read' | 'readwrite';
}

interface Window {
  showOpenFilePicker?: (options?: FilePickerOptions) => Promise<FileSystemFileHandle[]>;
  showSaveFilePicker?: (options?: FilePickerOptions) => Promise<FileSystemFileHandle>;
  showDirectoryPicker?: (options?: DirectoryPickerOptions) => Promise<FileSystemDirectoryHandle>;
  JSZip?: any;
  firstFrame?: () => void;
}

// Google Identity / One Tap 全局类型
declare global {
  interface Window {
    google?: any;
    handleGoogleCallback?: (response: GoogleCredentialResponse) => void;

    sse?: {
      params?: Record<string, any>;
      settings?: any;
      poster?: boolean;
      contentUrl: string;
      contents: any;
    };
  }
  interface GoogleCredentialResponse {
    credential?: string;
    [key: string]: any;
  }
}

export {};
