import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Bold,
  Italic,
  Underline,
  Image as ImageIcon,
  Table,
  Download,
  FileText,
  Loader2,
  Upload,
  AlignLeft,
  AlignCenter,
  AlignRight,
  PlusSquare,
  MinusSquare,
  Trash2,
  Rows,
  Columns,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface EditorToolbarProps {
  editor: Editor;
  onImageUpload: (file: File) => void;
  onDocumentUpload: (file: File) => void;
  onExportPDF: () => void;
  onExportWord: () => void;
  isExporting: boolean;
}

export const EditorToolbar = ({ editor, onImageUpload, onDocumentUpload, onExportPDF, onExportWord, isExporting }: EditorToolbarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const [tablePopoverOpen, setTablePopoverOpen] = useState(false);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleDocumentClick = () => {
    documentInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
    event.target.value = '';
  };

  const handleDocumentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      onDocumentUpload(file);
    }
    event.target.value = '';
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const fontFamilies = [
    { value: 'Arial', label: 'Arial' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Courier New', label: 'Courier New' },
    { value: 'Verdana', label: 'Verdana' },
  ];

  const fontSizes = [
    { value: '12px', label: '12' },
    { value: '14px', label: '14' },
    { value: '16px', label: '16' },
    { value: '18px', label: '18' },
    { value: '20px', label: '20' },
    { value: '24px', label: '24' },
    { value: '30px', label: '30' },
    { value: '36px', label: '36' },
    { value: '48px', label: '48' },
    { value: '60px', label: '60' },
    { value: '72px', label: '72' },
  ];

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col gap-y-2 p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
        {/* Row 1: Upload/Export */}
        <div className="flex flex-row items-center gap-2 h-8 min-h-[32px]">
          {/* All icon buttons use h-8 w-8 for consistent alignment */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex items-center justify-center text-purple-700 hover:bg-purple-50 border border-transparent hover:border-purple-200"
                  onClick={handleDocumentClick}
                  disabled={isExporting}
                  aria-label="Upload Word Document"
                >
                  <Upload className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Upload Word Document</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onExportWord}
                  disabled={isExporting}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex items-center justify-center text-green-700 hover:bg-green-50 border border-transparent hover:border-green-200"
                  aria-label="Export as Word"
                >
                  {isExporting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export as Word</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onExportPDF}
                  disabled={isExporting}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex items-center justify-center text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200"
                  aria-label="Export as PDF"
                >
                  {isExporting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Download className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export as PDF</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Row 2: Formatting & Insert + Table Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Font Family & Size */}
          <Select
            value={editor.getAttributes('textStyle').fontFamily || 'Arial'}
            onValueChange={(value) => {
              if (value === 'default') {
                editor.chain().focus().unsetFontFamily().run();
              } else {
                editor.chain().focus().setFontFamily(value).run();
              }
            }}
          >
            <SelectTrigger className="w-[120px] h-8 text-xs border-gray-200">
              <SelectValue placeholder="Font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              {fontFamilies.map((font) => (
                <SelectItem key={font.value} value={font.value} className="text-xs">
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={editor.getAttributes('textStyle').fontSize || '16px'}
            onValueChange={(value) => {
              if (value === 'default') {
                editor.chain().focus().unsetFontSize().run();
              } else {
                editor.chain().focus().setFontSize(value).run();
              }
            }}
          >
            <SelectTrigger className="w-[70px] h-8 text-xs border-gray-200">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              {fontSizes.map((size) => (
                <SelectItem key={size.value} value={size.value} className="text-xs">
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Separator orientation="vertical" className="h-6 mx-1" />
          {/* Formatting */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={editor.isActive('bold') ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  aria-label="Bold"
                  className="hover:bg-gray-100"
                >
                  <Bold className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bold</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={editor.isActive('italic') ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  aria-label="Italic"
                  className="hover:bg-gray-100"
                >
                  <Italic className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Italic</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={editor.isActive('underline') ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  aria-label="Underline"
                  className="hover:bg-gray-100"
                >
                  <Underline className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Underline</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Separator orientation="vertical" className="h-6 mx-1" />
          {/* Headings */}
          <Select
            value={
              editor.isActive('heading', { level: 1 }) ? 'h1' :
              editor.isActive('heading', { level: 2 }) ? 'h2' :
              editor.isActive('heading', { level: 3 }) ? 'h3' :
              'paragraph'
            }
            onValueChange={(value) => {
              if (value === 'paragraph') {
                editor.chain().focus().setParagraph().run();
              } else {
                const level = parseInt(value.replace('h', '')) as 1 | 2 | 3 | 4 | 5 | 6;
                editor.chain().focus().toggleHeading({ level }).run();
              }
            }}
          >
            <SelectTrigger className="w-[90px] h-8 text-xs border-gray-200">
              <SelectValue placeholder="Style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paragraph">Paragraph</SelectItem>
              <SelectItem value="h1">Heading 1</SelectItem>
              <SelectItem value="h2">Heading 2</SelectItem>
              <SelectItem value="h3">Heading 3</SelectItem>
            </SelectContent>
          </Select>
          <Separator orientation="vertical" className="h-6 mx-1" />
          {/* Lists */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  aria-label="Bullet List"
                  className="hover:bg-gray-100 font-bold"
                >
                  •
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bullet List</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  aria-label="Numbered List"
                  className="hover:bg-gray-100 font-bold"
                >
                  1.
                </Button>
              </TooltipTrigger>
              <TooltipContent>Numbered List</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {/* Alignment Buttons */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => (editor.chain() as any).focus().setTextAlign('left').run()}
                  aria-label="Align Left"
                  className="hover:bg-gray-100"
                >
                  <AlignLeft className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Align Left</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => (editor.chain() as any).focus().setTextAlign('center').run()}
                  aria-label="Align Center"
                  className="hover:bg-gray-100"
                >
                  <AlignCenter className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Align Center</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => (editor.chain() as any).focus().setTextAlign('right').run()}
                  aria-label="Align Right"
                  className="hover:bg-gray-100"
                >
                  <AlignRight className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Align Right</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Separator orientation="vertical" className="h-6 mx-1" />
          {/* Insert Options */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleImageClick}
                  aria-label="Insert Image"
                  className="hover:bg-gray-100"
                >
                  <ImageIcon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert Image</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {/* Table Controls - icon buttons with tooltips */}
          <Separator orientation="vertical" className="h-6 mx-1" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().addColumnBefore().run()} aria-label="Add Column Left" className="hover:bg-gray-100">
                  <Columns className="h-5 w-5 rotate-180" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Column Left</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().addColumnAfter().run()} aria-label="Add Column Right" className="hover:bg-gray-100">
                  <Columns className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Column Right</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().deleteColumn().run()} aria-label="Delete Column" className="hover:bg-gray-100">
                  <MinusSquare className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete Column</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().addRowBefore().run()} aria-label="Add Row Above" className="hover:bg-gray-100">
                  <Rows className="h-5 w-5 rotate-180" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Row Above</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().addRowAfter().run()} aria-label="Add Row Below" className="hover:bg-gray-100">
                  <Rows className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Row Below</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().deleteRow().run()} aria-label="Delete Row" className="hover:bg-gray-100">
                  <MinusSquare className="h-5 w-5 rotate-90" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete Row</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="destructive" size="icon" onClick={() => editor.chain().focus().deleteTable().run()} aria-label="Delete Table" className="hover:bg-red-100">
                  <Trash2 className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete Table</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Hidden Inputs */}
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <Input
          ref={documentInputRef}
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleDocumentChange}
          className="hidden"
        />
      </div>
    </div>
  );
};
