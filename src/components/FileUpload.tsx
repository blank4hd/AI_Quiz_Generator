import {
  Upload,
  FileText,
  Image as ImageIcon,
  File,
  Type,
  Link,
  AlertCircle,
  Settings,
} from "lucide-react";
import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { createWorker } from "tesseract.js";
import * as mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker - using unpkg CDN for reliable ESM support
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs`;

interface FileUploadProps {
  onFileProcessed: (content: string, fileName: string) => void;
}

export function FileUpload({ onFileProcessed }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeMethod, setYoutubeMethod] = useState<"python" | "google">(
    "google"
  );
  const [googleApiKey, setGoogleApiKey] = useState("");
  const { toast } = useToast();

  const processFile = async (file: File) => {
    const maxSize = 20 * 1024 * 1024; // 20MB
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "image/jpeg",
      "image/png",
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
      let extractedText = "";

      if (file.type === "text/plain") {
        extractedText = await file.text();
      } else if (file.type === "application/pdf") {
        try {
          const arrayBuffer = await file.arrayBuffer();
          console.log("PDF arrayBuffer size:", arrayBuffer.byteLength);

          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          console.log("PDF loaded, pages:", pdf.numPages);

          const textParts: string[] = [];

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(" ");
            textParts.push(pageText);
          }

          extractedText = textParts.join("\n\n");
          console.log("Extracted text length:", extractedText.length);
        } catch (pdfError) {
          console.error("PDF processing error:", pdfError);
          throw new Error(
            `Failed to parse PDF: ${
              pdfError instanceof Error ? pdfError.message : "Unknown error"
            }`
          );
        }
      } else if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      } else if (file.type === "image/jpeg" || file.type === "image/png") {
        const worker = await createWorker("eng");
        const { data } = await worker.recognize(file);
        extractedText = data.text;
        await worker.terminate();
      }

      if (!extractedText || extractedText.trim().length === 0) {
        toast({
          title: "No text found",
          description: "Could not extract any text from this file.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      onFileProcessed(extractedText, file.name);
      toast({
        title: "File processed",
        description: "Your document is ready for quiz generation.",
      });
    } catch (error) {
      console.error("File processing error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Could not process your file. Please try again.";
      toast({
        title: "Processing failed",
        description: errorMessage,
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

  const handleTextSubmit = () => {
    if (!textContent.trim()) {
      toast({
        title: "No content",
        description: "Please enter some text to generate a quiz.",
        variant: "destructive",
      });
      return;
    }

    if (textContent.trim().length < 50) {
      toast({
        title: "Content too short",
        description:
          "Please enter at least 50 characters for better quiz generation.",
        variant: "destructive",
      });
      return;
    }

    onFileProcessed(textContent, "Pasted Text");
    toast({
      title: "Text processed",
      description: "Your content is ready for quiz generation.",
    });
  };

  const handleYoutubeSubmit = async () => {
    if (!youtubeUrl.trim()) {
      toast({
        title: "No URL",
        description: "Please enter a YouTube URL.",
        variant: "destructive",
      });
      return;
    }

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(youtubeUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL.",
        variant: "destructive",
      });
      return;
    }

    // Validate API key for Google method
    if (youtubeMethod === "google" && !googleApiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Google API key to use this method.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      if (youtubeMethod === "python") {
        // Use Python API method
        const response = await fetch("/youtube/transcript", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: youtubeUrl }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch transcript");
        }

        const data = await response.json();

        if (!data.transcript || data.transcript.length < 50) {
          throw new Error(
            "Transcript is too short or unavailable for this video"
          );
        }

        onFileProcessed(data.transcript, `YouTube - ${data.title || "Video"}`);
        toast({
          title: "Transcript fetched",
          description: "Video transcript is ready for quiz generation.",
        });
      } else {
        // Use Google YouTube Data API method
        const response = await fetch("/api/youtube-transcript", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: youtubeUrl,
            apiKey: googleApiKey,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch video data");
        }

        // Note: YouTube Data API v3 doesn't provide transcript content directly
        // Show info and suggest Python method
        toast({
          title: "YouTube Data API Note",
          description:
            data.note ||
            "This method requires additional OAuth2 setup. Please use the Python API method for now.",
          variant: "destructive",
        });

        throw new Error(
          "YouTube Data API requires OAuth2 for transcript access. Please use the Python API method."
        );
      }
    } catch (error) {
      console.error("YouTube transcript error:", error);
      toast({
        title: "Failed to fetch transcript",
        description:
          error instanceof Error
            ? error.message
            : "Could not fetch YouTube transcript. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold tracking-tight">
          Turn your notes into a quiz in seconds
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Upload a file or paste your text — we'll generate a quiz
          automatically.
        </p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload File
          </TabsTrigger>
          <TabsTrigger value="text" className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            Paste Text
          </TabsTrigger>
          <TabsTrigger value="youtube" className="flex items-center gap-2">
            <Link className="w-4 h-4" />
            YouTube Video
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-6">
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
                  {isProcessing
                    ? "Processing your file..."
                    : "Upload or Drop File Here"}
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
        </TabsContent>

        <TabsContent value="text" className="mt-6">
          <Card className="p-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="text-content" className="text-sm font-medium">
                  Paste your quiz material here
                </label>
                <Textarea
                  id="text-content"
                  placeholder="Paste your notes, lecture content, or study material here...&#10;&#10;Example: The water cycle describes how water evaporates from the surface of the earth, rises into the atmosphere, cools and condenses into clouds, and falls back to the surface as precipitation."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="min-h-[300px] resize-y"
                  disabled={isProcessing}
                />
                <p className="text-xs text-muted-foreground">
                  {textContent.length} characters{" "}
                  {textContent.length >= 50 ? "✓" : "(minimum 50)"}
                </p>
              </div>

              <Button
                size="lg"
                onClick={handleTextSubmit}
                disabled={isProcessing || textContent.trim().length < 50}
                className="w-full"
              >
                Generate Quiz from Text
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="youtube" className="mt-6">
          <Card className="p-8">
            <div className="space-y-6">
              {/* Method Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Transcript Extraction Method
                </Label>
                <RadioGroup
                  value={youtubeMethod}
                  onValueChange={(value: any) => setYoutubeMethod(value)}
                >
                  <div className="flex items-start space-x-2 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <RadioGroupItem
                      value="google"
                      id="google"
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="google"
                        className="font-semibold cursor-pointer"
                      >
                        Google YouTube Data API (Recommended)
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        More reliable, official API. Requires Google API key and
                        YouTube Data API v3 enabled.
                      </p>
                      <a
                        href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mt-1 inline-block"
                      >
                        Enable API →
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <RadioGroupItem
                      value="python"
                      id="python"
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="python"
                        className="font-semibold cursor-pointer"
                      >
                        Python API (Alternative)
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Free, no API key required. May be blocked by YouTube for
                        some videos.
                      </p>
                      <a
                        href="https://github.com/jdepoix/youtube-transcript-api"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mt-1 inline-block"
                      >
                        Learn more →
                      </a>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Google API Key input (only shown when Google method selected) */}
              {youtubeMethod === "google" && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>API Key Required</AlertTitle>
                  <AlertDescription className="text-xs space-y-2">
                    <p>
                      You can use your existing Gemini API key if YouTube Data
                      API v3 is enabled in your Google Cloud project.
                    </p>
                    <div className="mt-2">
                      <Input
                        type="password"
                        placeholder="Enter your Google API key"
                        value={googleApiKey}
                        onChange={(e) => setGoogleApiKey(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* YouTube URL Input */}
              <div className="space-y-2">
                <Label htmlFor="youtube-url">YouTube Video URL</Label>
                <Input
                  id="youtube-url"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  disabled={isProcessing}
                />
              </div>

              {/* Submit Button */}
              <Button
                size="lg"
                onClick={handleYoutubeSubmit}
                disabled={
                  isProcessing ||
                  !youtubeUrl.trim() ||
                  (youtubeMethod === "google" && !googleApiKey.trim())
                }
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Fetching Transcript...
                  </>
                ) : (
                  <>
                    <Link className="mr-2 h-4 w-4" />
                    Generate Quiz from Video
                  </>
                )}
              </Button>

              {/* Info Section */}
              <div className="pt-2 space-y-2">
                <h4 className="font-semibold text-sm">Requirements:</h4>
                <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Video must have captions/subtitles enabled</li>
                  <li>Supports YouTube.com and youtu.be links</li>
                  <li>Google method recommended for reliability</li>
                  <li>
                    Python method works immediately but may fail occasionally
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
