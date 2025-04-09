
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, FileText, Loader2, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function FileUploader() {
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload.",
        variant: "destructive",
      });
      return;
    }
    
    setUploading(true);
    
    // Simulate file upload (in a real app, this would call an API)
    setTimeout(() => {
      setUploading(false);
      setUploadSuccess(true);
      
      toast({
        title: "Files uploaded successfully",
        description: `${files.length} file(s) have been uploaded and will be processed.`,
      });
      
      // Reset form after successful upload
      setTimeout(() => {
        setFiles([]);
        setNotes("");
        setUploadSuccess(false);
      }, 3000);
    }, 2000);
  };

  return (
    <Card className="glass-card">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <Label htmlFor="file-upload" className="block mb-2">
              Upload Files
            </Label>
            <div
              className="border-2 border-dashed border-memora-purple/30 rounded-lg p-8 text-center cursor-pointer hover:bg-memora-purple/5 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-memora-purple" />
              <p className="mb-1 font-medium">Click to upload or drag and drop</p>
              <p className="text-sm text-muted-foreground">
                PDF, DOCX, JPG, PNG (Max 10MB each)
              </p>
              <Input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.docx,.jpg,.jpeg,.png"
              />
            </div>
          </div>

          {files.length > 0 && (
            <div className="mb-6">
              <Label className="block mb-2">Selected Files</Label>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between bg-white/70 p-2 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-memora-purple" />
                      <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <Label htmlFor="notes" className="block mb-2">
              Additional Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any relevant information about these files..."
              className="bg-white/70"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-memora-purple hover:bg-memora-purple-dark"
            disabled={uploading || uploadSuccess}
          >
            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {uploadSuccess && <Check className="mr-2 h-4 w-4" />}
            {uploading
              ? "Uploading..."
              : uploadSuccess
              ? "Uploaded Successfully"
              : "Upload Files"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
