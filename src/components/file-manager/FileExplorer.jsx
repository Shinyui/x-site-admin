import React, { useState } from 'react';
import { 
  Folder, 
  FileText, 
  FileImage, 
  FileVideo, 
  FileMusic, 
  MoreVertical, 
  ChevronRight, 
  Home,
  ArrowLeft
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Mock Data
const MOCK_FILE_SYSTEM = [
  { id: '1', name: 'Documents', type: 'folder', parentId: null },
  { id: '2', name: 'Images', type: 'folder', parentId: null },
  { id: '3', name: 'Videos', type: 'folder', parentId: null },
  { id: '4', name: 'Work', type: 'folder', parentId: '1' },
  { id: '5', name: 'Personal', type: 'folder', parentId: '1' },
  { id: '6', name: 'Resume.pdf', type: 'file', fileType: 'pdf', size: '2.4 MB', date: '2023-10-20', parentId: '1' },
  { id: '7', name: 'Project_Specs.docx', type: 'file', fileType: 'doc', size: '1.1 MB', date: '2023-10-22', parentId: '4' },
  { id: '8', name: 'Vacation.jpg', type: 'file', fileType: 'image', size: '4.2 MB', date: '2023-09-15', parentId: '2' },
  { id: '9', name: 'Demo_Reel.mp4', type: 'file', fileType: 'video', size: '150 MB', date: '2023-11-01', parentId: '3' },
  { id: '10', name: 'Tutorial.mov', type: 'file', fileType: 'video', size: '320 MB', date: '2023-11-05', parentId: '3' },
  { id: '11', name: 'Music', type: 'folder', parentId: null },
  { id: '12', name: 'Song.mp3', type: 'file', fileType: 'audio', size: '5 MB', date: '2023-08-30', parentId: '11' },
];

const getFileIcon = (fileType) => {
  switch (fileType) {
    case 'image': return <FileImage className="w-8 h-8 text-purple-500" />;
    case 'video': return <FileVideo className="w-8 h-8 text-red-500" />;
    case 'audio': return <FileMusic className="w-8 h-8 text-yellow-500" />;
    case 'pdf': return <FileText className="w-8 h-8 text-orange-500" />;
    default: return <FileText className="w-8 h-8 text-gray-500" />;
  }
};

export default function FileExplorer() {
  const [currentPath, setCurrentPath] = useState([]); // Array of folders {id, name}
  const [selectedItems, setSelectedItems] = useState(new Set());

  const currentFolderId = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null;

  const items = MOCK_FILE_SYSTEM.filter(item => item.parentId === currentFolderId);

  // Sorting: Folders first, then Files
  items.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'folder' ? -1 : 1;
  });

  const handleNavigate = (folder) => {
    setCurrentPath([...currentPath, folder]);
    setSelectedItems(new Set());
  };

  const handleNavigateUp = () => {
    if (currentPath.length === 0) return;
    setCurrentPath(currentPath.slice(0, -1));
    setSelectedItems(new Set());
  };

  const handleBreadcrumbClick = (index) => {
    setCurrentPath(currentPath.slice(0, index + 1));
    setSelectedItems(new Set());
  };

  const toggleSelection = (id) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  return (
    <div className="flex flex-col h-full bg-background/50">
      {/* Toolbar / Breadcrumbs */}
      <div className="flex items-center gap-2 p-4 border-b bg-card/50 backdrop-blur">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleNavigateUp} 
          disabled={currentPath.length === 0}
          className="mr-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="flex items-center text-sm text-muted-foreground overflow-hidden">
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("px-2 h-8", currentPath.length === 0 && "text-foreground font-medium")}
            onClick={() => { setCurrentPath([]); setSelectedItems(new Set()); }}
          >
            <Home className="w-4 h-4 mr-1" />
            Home
          </Button>
          
          {currentPath.map((folder, index) => (
            <div key={folder.id} className="flex items-center">
              <ChevronRight className="w-4 h-4 mx-1 opacity-50" />
              <Button
                variant="ghost"
                size="sm"
                className={cn("px-2 h-8", index === currentPath.length - 1 && "text-foreground font-medium")}
                onClick={() => handleBreadcrumbClick(index)}
              >
                {folder.name}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* File Grid */}
      <div className="flex-1 p-4 overflow-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
            <Folder className="w-16 h-16 mb-4" />
            <p>This folder is empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "group relative flex flex-col items-center p-4 rounded-xl border border-transparent transition-all duration-200 cursor-pointer",
                  "hover:bg-accent/50 hover:border-border/50",
                  selectedItems.has(item.id) ? "bg-accent border-primary/20 ring-1 ring-primary/20" : "bg-card/30"
                )}
                onClick={() => {
                  if (item.type === 'folder') {
                    handleNavigate(item);
                  } else {
                    toggleSelection(item.id);
                  }
                }}
              >
                <div className="mb-3 transition-transform group-hover:scale-105">
                  {item.type === 'folder' ? (
                    <Folder className="w-12 h-12 text-blue-400 fill-blue-400/20" />
                  ) : (
                    getFileIcon(item.fileType)
                  )}
                </div>
                <div className="text-center w-full">
                  <p className="text-sm font-medium truncate w-full px-2" title={item.name}>
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.type === 'folder' ? 'Folder' : item.size}
                  </p>
                </div>
                
                {/* Hover Actions (Optional) */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer / Status Bar */}
      <div className="border-t p-2 px-4 text-xs text-muted-foreground bg-card/50 flex justify-between">
        <span>{items.length} items</span>
        <span>{selectedItems.size > 0 ? `${selectedItems.size} selected` : ''}</span>
      </div>
    </div>
  );
}
