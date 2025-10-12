import { Upload, FileText, Image as ImageIcon, File } from "lucide-react";
import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileProcessed: (content: string, fileName: string) => void;
}

export function FileUpload({ onFileProcessed }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processFile = async (file: File) => {
    const maxSize = 20 * 1024 * 1024; // 20MB
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "image/jpeg",
      "image/png"
    ];

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "File exceeds 20MB limit.",
        variant: "destructive",
      });
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Please upload PDF, DOCX, TXT, JPG, or PNG files.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // For now, just read text files
      if (file.type === "text/plain") {
        const text = await file.text();
        onFileProcessed(text, file.name);
        toast({
          title: "File processed",
          description: "Your document is ready for quiz generation.",
        });
      } else {
        // Mock processing for other file types
        setTimeout(() => {
          const mockContent = "This is a sample document content that would be extracted from your file. In a full implementation, this would use OCR for images and PDF parsing for documents.";
          onFileProcessed(mockContent, file.name);
          toast({
            title: "File processed",
            description: "Your document is ready for quiz generation.",
          });
        }, 2000);
      }
    } catch (error) {
      toast({
        title: "Processing failed",
        description: "Could not process your file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold tracking-tight">
          Turn your notes into a quiz in seconds
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Upload a PDF, image, or paste text — we'll generate a quiz automatically.
        </p>
      </div>

      <Card
        className={`p-12 border-2 border-dashed transition-all duration-200 ${
          isDragging ? "border-primary bg-primary/5" : "border-border"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="p-6 rounded-full bg-primary/10">
            <Upload className="w-12 h-12 text-primary" />
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-2xl font-semibold">
              {isProcessing ? "Processing your file..." : "Upload or Drop File Here"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Accepted formats: PDF, DOCX, TXT, JPG, PNG (max 20MB)
            </p>
          </div>

          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            disabled={isProcessing}
          />
          
          <Button
            size="lg"
            onClick={() => document.getElementById("file-upload")?.click()}
            disabled={isProcessing}
          >
            Choose File
          </Button>

          <div className="flex items-center gap-8 pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>PDF</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <File className="w-4 h-4" />
              <span>DOCX</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ImageIcon className="w-4 h-4" />
              <span>Images</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
